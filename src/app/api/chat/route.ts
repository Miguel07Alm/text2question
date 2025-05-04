import { GenerateQuestionsParams, QuestionSchema } from "@/types/types";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { deepseek } from "@ai-sdk/deepseek";
import { redis } from "@/lib/redis"; // Import the Redis client
import { Ratelimit } from "@upstash/ratelimit"; // Import Ratelimit
import { auth } from "@/auth";

export const maxDuration = 60;

// Rate Limiter for Unauthenticated Users (5 requests/day by IP) - Keep this
const ipRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, "1 d"), // 5 requests per 1 day
    analytics: true,
    prefix: "@upstash/ratelimit_ip",
});

// Define the daily limit for authenticated users
const DAILY_LIMIT_AUTH_USER = 15;

export async function POST(req: Request) {
    const session = await auth(); // Get the session
    const userId = session?.user?.id;
    let limit = 0;
    let remaining = 0;
    let reset = 0;
    let success = false;

    const now = new Date();

    if (userId) {
        // --- Authenticated User: Manual Redis Limit Check ---
        limit = DAILY_LIMIT_AUTH_USER;
        const userGenerationsKey = `user:generations:${userId}`;
        const userData = await redis.hgetall<{ count: string; lastReset: string }>(userGenerationsKey);

        let currentCount = parseInt(userData?.count || '0');
        let lastResetDate = userData?.lastReset ? new Date(userData.lastReset) : new Date(0); // Start of epoch if never reset

        // Check if the last reset was more than 24 hours ago
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        if (lastResetDate < oneDayAgo) {
            // Reset the count and update the last reset time
            currentCount = 0;
            lastResetDate = now;
            await redis.hset(userGenerationsKey, { count: currentCount.toString(), lastReset: lastResetDate.toISOString() });
            console.log(`Reset generation count for user ${userId}`);
        }

        if (currentCount < limit) {
            // Increment the count and update Redis
            const newCount = await redis.hincrby(userGenerationsKey, 'count', 1);
            // Ensure lastReset is set if this is the first generation after reset
            if (newCount === 1 && !userData?.lastReset) {
                 await redis.hset(userGenerationsKey, { lastReset: lastResetDate.toISOString() });
            }
            remaining = limit - newCount;
            reset = lastResetDate.getTime() + 24 * 60 * 60 * 1000; // Reset time is 24h after last reset
            success = true;
            console.log(`User ${userId} generation ${newCount}/${limit}. Remaining: ${remaining}`);
        } else {
            // Daily limit reached, check for purchased credits
            const creditsKey = `purchased_credits:user:${userId}`;
            const purchasedCredits = await redis.get(creditsKey);
            const creditsCount = purchasedCredits ? parseInt(purchasedCredits as string) : 0;
            if (creditsCount > 0) {
                // Use a purchased credit
                await redis.decr(creditsKey);
                remaining = 0;
                reset = lastResetDate.getTime() + 24 * 60 * 60 * 1000;
                success = true;
                console.log(`User ${userId} used a purchased credit. Remaining purchased: ${creditsCount - 1}`);
            } else {
                // No daily or purchased credits left
                remaining = 0;
                reset = lastResetDate.getTime() + 24 * 60 * 60 * 1000;
                success = false;
                console.log(`User ${userId} has no daily or purchased credits left.`);
            }
        }

    } else {
        // --- Unauthenticated User: Use IP Rate Limiter ---
        const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("remote-addr") ?? "127.0.0.1";
        const result = await ipRateLimiter.limit(ip);
        success = result.success;
        limit = result.limit;
        remaining = result.remaining;
        reset = result.reset; // Keep the reset time from the IP limiter

        if (!success) {
             console.log(`IP ${ip} rate limited. Limit: ${limit}`);
        }
    }

    // --- Handle Rate Limit Exceeded ---
    if (!success) {
        return new Response(
            JSON.stringify({
                error: "Rate limit exceeded. Please try again later.",
                limit,
                remaining,
                reset: new Date(reset).toISOString(), // Send reset time as ISO string
                isLoggedIn: !!userId
            }),
            {
                status: 429, // Too Many Requests
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    // Convert reset timestamp (milliseconds) to seconds for the header
                    'X-RateLimit-Reset': Math.ceil(reset / 1000).toString(),
                },
            }
        );
    }

    // --- Proceed with Generation Logic if Rate Limit Not Hit ---
    try {
        const {
            input,
            fileContent,
            questionType,
            questionCount,
            optionsCount = 4,
            systemPrompt,
            correctAnswersCount = 1,
            isRandomCorrectAnswers = false,
            minCorrectAnswers = 1,
            maxCorrectAnswers = 1,
            output,
            model = "deepseek" // Default to deepseek
        }: GenerateQuestionsParams = await req.json();
        console.log("🚀 ~ POST ~ correctAnswersCount:", correctAnswersCount);

        if (questionCount > 20) {
            return new Response("The maximum number of questions is 20.", {
                status: 400,
            });
        }

        const typePrompt =
            questionType === "mixed"
                ? "The questions can be multiple-choice, true-false, or short-answer."
                : `The questions must be ${questionType.replace("-", " ")}.`;

        console.log("🚀 ~ POST ~ typePrompt:", typePrompt);

        const correctAnswersPrompt = isRandomCorrectAnswers
            ? `STRICT RULES FOR CORRECT ANSWERS:
       1. NUMBER OF CORRECT ANSWERS:
          - MINIMUM: Each question MUST have AT LEAST ${minCorrectAnswers} correct answer(s)
          - MAXIMUM: Each question MUST have NO MORE than ${maxCorrectAnswers} correct answer(s)
          - RANDOM: Pick a random number between these limits for each question
       
       2. VARIATION REQUIREMENTS:
          - CONSECUTIVE QUESTIONS must have DIFFERENT numbers of correct answers
          - Example: If Q1 has ${minCorrectAnswers} correct answers, Q2 MUST have a different number
          - NEVER repeat the same number of correct answers in consecutive questions
       
       3. DISTRIBUTION:
          - Try to use all possible numbers between ${minCorrectAnswers} and ${maxCorrectAnswers}
          - Distribute the variations evenly across all questions
       
       4. TECHNICAL REQUIREMENTS:
          - Set 'correctAnswersCount' field to the exact number used in each question
          - All correct answers must be equally valid and complete
          - Double-check that NO question violates the min/max limits`
            : `CORRECT ANSWERS REQUIREMENTS:
       - Each question MUST have EXACTLY ${correctAnswersCount} correct answer(s)
       - The 'correctAnswersCount' field MUST be set to ${correctAnswersCount}
       - All correct answers must be equally valid and complete`;
        console.log("🚀 ~ POST ~ correctAnswersPrompt:", correctAnswersPrompt);

        const finalSystemPrompt = `You are an expert quiz creator with years of experience in educational assessment and instructional design.
              Follow these principles when generating ${questionCount} questions:
              
              1. Progressive difficulty: Start with foundational concepts and gradually increase complexity
              2. Cognitive levels: Include a mix of recall, understanding, application, and analysis questions
              3. Clear language: Use precise, unambiguous wording that focuses on key concepts
              4. Plausible options: For multiple choice, all distractors should be realistic and based on common misconceptions
              5. Learning value: Each question should reinforce important concepts from the content
              
              ${typePrompt}
              
              For true/false, avoid absolute statements and focus on testing understanding.
              For multiple-choice, ensure all options are of similar length and grammatically consistent.
              For short answers, specify clearly what constitutes a complete response.

              You must strictly use this type of questions: ${questionType.replace(
                  "-",
                  " "
              )}

              If there is only a question type, you must avoid using other types of questions.
              
              Additional requirements:
              - When the content comes from a PDF or document with pages, include the page number where the answer can be found in the 'page' field
              - The page number should be extracted from the context where the answer is found
              - If no specific page number is available, omit the page field
              
              For example, if the answer comes from "Page 5:" in the text, set page: 5 in the response.
              
              For multiple-choice questions, you MUST follow these rules strictly:
              - Generate exactly ${optionsCount} options
              ${correctAnswersPrompt}
              - The 'correctAnswer' field MUST be an array of indices for multiple correct answers

              Important requirements for multiple answers:
              - All correct answers must be equally valid
              - The correctAnswer field must always be an array, even for single answers
              - Distribute correct answers randomly among the options
              - Include clear explanations why each selected answer is correct
              
              ${systemPrompt ? `Custom Behaviour: ${systemPrompt}` : ""}

              You must speak STRICTLY in the same language as the content provided, if there are different languages in the user input,
              prioritize the language where the content is most.
              `;
        
        const result = streamObject({
            // @ts-ignore
            model: model === "openai" ? openai("gpt-4o-mini") : deepseek("deepseek-chat"),
            schema: QuestionSchema,
            messages: [
                {
                    role: "system",
                    content: finalSystemPrompt,
                },
                {
                    role: "user",
                    content: `User input: ${input}\n\nAttached file: ${fileContent}\n\nCurrent questions that are being generated by you, try to follow the rules strictly: ${JSON.stringify(output)}`,
                },
            ],
            temperature: 0.5,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error generating questions:", error);
        return new Response("An error occurred while generating questions.", {
            status: 500,
        });
    }
}
