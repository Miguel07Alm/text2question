import { GenerateQuestionsParams, QuestionSchema } from "@/types/types";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 120;

export async function POST(req: Request) {
    try {
        const { input, fileContent, questionType, questionCount }: GenerateQuestionsParams = await req.json();

        const typePrompt = questionType === 'mixed' ? 
            'The questions can be multiple-choice, true-false, or short-answer.' : 
            `The questions should be ${questionType.replace('-', ' ')}.`;

        const result = streamObject({
            model: openai("gpt-4o-mini"),
            schema: QuestionSchema,
            messages: [
                {
                    role: "system",
                    content: `You are an expert in creating various types of questions. 
              Generate exactly ${questionCount} questions based on the provided content. 
              ${typePrompt}`,
                },
                {
                    role: "user",
                    content: `User input: ${input}\n\nAttached file: ${fileContent}`,
                },
            ],
            temperature: 0.7,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error generating questions:", error);
        return new Response("An error occurred while generating questions.", { status: 500 });
    }
}
