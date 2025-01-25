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
                    content: "You are a quiz grader. Compare the user's answer with the correct answer. If both answers convey the same basic meaning, even with some variations in style, phrasing, or use of synonyms, respond with true. If the meaning differs significantly, respond with false. In cases where the answer uses a different phrasing but maintains the same core meaning."
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
