import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const { userAnswer, correctAnswer } = await req.json();

        const response = await generateObject({
            model: openai("gpt-4o-mini"),
            messages: [
            {
                role: "system",
                content: "You are an advanced quiz grader. Your task is to compare the student's answer with the correct answer and provide a percentage score (0-100) indicating how correct the student's answer is. Also, provide a brief explanation, addressing the user as 'student', of why you assigned that score. Consider the following scoring guide:\n\n- 100%: The student's answer is completely correct and matches the meaning of the correct answer perfectly.\n- 75-99%: The student's answer is mostly correct but has minor flaws or omissions.\n- 50-74%: The student's answer is partially correct but misses significant aspects of the correct answer.\n- 25-49%: The student's answer contains some relevant information but is largely incorrect.\n- 0-24%: The student's answer is completely incorrect or irrelevant.\n\nFocus on the core meaning and key details. Provide the percentage and justification in the 'score' and 'reason' fields respectively. Address the user as 'student' in the 'reason' field."
            },
            {
                role: "user",
                content: `Correct answer: "${correctAnswer}"\nStudent answer: "${userAnswer}"`
            }
            ],
            temperature: 0.1,
            maxTokens: 200,
            schema: z.object({
            score: z.number().min(0).max(100).describe("A percentage (0-100) indicating how correct the user's answer is."),
            reason: z.string().describe("A brief explanation of why the score was assigned.")
            })
    });

        const { score, reason } = response.object;
        return Response.json({ score, reason });

    } catch (error) {
        console.error("Error checking answer:", error);
        return Response.json({ error: "Failed to check answer" }, { status: 500 });
    }
}
