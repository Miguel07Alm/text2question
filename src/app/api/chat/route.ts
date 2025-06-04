import { GenerateQuestionsParams, ModelToLanguageModel, QuestionSchema } from "@/types/types";
import { LanguageModelV1, streamObject } from "ai";
import { auth } from "@/auth";
import { checkRateLimit, consumeGeneration } from "@/lib/rate-limit";

export const maxDuration = 60;
export async function POST(req: Request) {
    const session = await auth(); // Get the session
    const userId = session?.user?.id;
    const { success, limit, remaining, reset, purchasedCredits, dailyUsed } =
        await checkRateLimit(req);

    if (!success) {
        console.log(
            userId
                ? `User ${userId}`
                : `IP ${
                      req.headers.get("x-forwarded-for") ??
                      req.headers.get("remote-addr") ??
                      "127.0.0.1"
                  }`,
            `rate limited. Limit: ${limit}, Daily Used: ${dailyUsed}, Purchased: ${purchasedCredits}`
        );
        return new Response(
            JSON.stringify({
                error: "Rate limit exceeded. Please try again later.",
                limit,
                remaining: 0, // Explicitly 0 when rate limited
                reset: new Date(reset).toISOString(),
                isLoggedIn: !!userId,
            }),
            {
                status: 429, // Too Many Requests
                headers: {
                    "Content-Type": "application/json",
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
                },
            }
        );
    }

    // --- Consume Generation Credit/Limit (only if check passed) ---
    try {
        await consumeGeneration(userId); // Call the consumption function
    } catch (error) {
        console.error("Error consuming generation:", error);

        return new Response("Failed to record generation usage.", {
            status: 500,
        });
    }
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
            model = "gemini-2.0-flash", // Default to Gemini 2.0 Flash
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
              
              QUESTION TYPE SPECIFIC RULES:
              
              ${questionType === "multiple-choice" || questionType === "mixed" ? `
              For MULTIPLE-CHOICE questions:
              - Generate exactly ${optionsCount} options
              ${correctAnswersPrompt}
              - The 'correctAnswer' field MUST be an array of indices for multiple correct answers
              - All correct answers must be equally valid
              - The correctAnswer field must always be an array, even for single answers
              - Distribute correct answers randomly among the options
              - Include clear explanations why each selected answer is correct
              - Ensure all options are of similar length and grammatically consistent
              ` : ""}
              
              ${questionType === "true-false" || questionType === "mixed" ? `
              For TRUE-FALSE questions:
              - The 'correctAnswer' field MUST be a boolean (true or false) - NEVER a number
              - EXAMPLES: correctAnswer: true OR correctAnswer: false
              - INVALID: correctAnswer: 0, correctAnswer: 1, correctAnswer: "true"
              - Do NOT include an 'options' field
              - Do NOT include a 'correctAnswersCount' field
              - Avoid absolute statements and focus on testing understanding
              - The answer must be either true or false based on the factual accuracy of the statement
              ` : ""}
              
              ${questionType === "short-answer" || questionType === "mixed" ? `
              For SHORT-ANSWER questions:
              - The 'correctAnswer' field MUST be a string containing the expected answer - NEVER a number
              - EXAMPLES: correctAnswer: "photosynthesis", correctAnswer: "Albert Einstein"
              - INVALID: correctAnswer: 0, correctAnswer: 1, correctAnswer: true
              - Do NOT include an 'options' field
              - Do NOT include a 'correctAnswersCount' field
              - Specify clearly what constitutes a complete response
              - The answer should be concise but complete (usually 1-3 words or a short phrase)
              - Focus on key terms, concepts, or specific values that demonstrate understanding
              ` : ""}

              You must strictly use this type of questions: ${questionType.replace(
                  "-",
                  " "
              )}

              If there is only a question type, you must avoid using other types of questions.
              
              CRITICAL: Ensure correct data types for 'correctAnswer' field:
              - Multiple-choice: ARRAY of numbers [0, 1, 2, etc.]
              - True-false: BOOLEAN (true or false)
              - Short-answer: STRING ("answer text here")
              
              Additional requirements:
              - When the content comes from a PDF or document with pages, include the page number where the answer can be found in the 'page' field
              - The page number should be extracted from the context where the answer is found
              - If no specific page number is available, omit the page field
              
              For example, if the answer comes from "Page 5:" in the text, set page: 5 in the response.
              
              You must speak STRICTLY in the same language as the content provided, if there are different languages in the user input,
              prioritize the language where the content is most.
              `;
        const selectedModel: LanguageModelV1 = ModelToLanguageModel[model];
        const result = streamObject({
            model: selectedModel,
            schema: QuestionSchema,
            messages: [
                {
                    role: "system",
                    content: finalSystemPrompt,
                },
                {
                    role: "user",
                    content: `User input: ${input}\n\nAttached file: ${fileContent}\n\nCurrent questions that are being generated by you, try to follow the rules strictly: ${JSON.stringify(
                        output
                    )}`,
                },
            ],
            temperature: 0.5,
            onError: (error) => {
                console.error("Error generating questions:", error);
            },
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error generating questions:", error);
        return new Response("An error occurred while generating questions.", {
            status: 500,
        });
    }
}
