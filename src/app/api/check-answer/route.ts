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
                    content: "You are a quiz grader. Compare the user's answer with the correct answer and respond with true if they are semantically equivalent, or false if they are different. Only respond with true or false."
                },
                {
                    role: "user",
                    content: `Correct answer: "${correctAnswer}"\nUser answer: "${userAnswer}"`
                }
            ],
            temperature: 0.1,
            maxTokens: 5,
            schema: z.object({
                isCorrect: z.boolean()
            })
});

        const isCorrect = response.object.isCorrect;
        return Response.json({ isCorrect });
    } catch (error) {
        console.error("Error checking answer:", error);
        return Response.json({ error: "Failed to check answer" }, { status: 500 });
    }
}
