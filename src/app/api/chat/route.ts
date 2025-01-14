import { GenerateQuestionsParams, QuestionSchema } from "@/types/types";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { input, fileContent, questionType, questionCount }: GenerateQuestionsParams = await req.json();

    const typePrompt = questionType === 'mixed' ? 
        'The questions can be multiple-choice, true-false, or short-answer.' : 
        `The questions should be ${questionType.replace('-', ' ')}.`;

    const result = streamObject({
        // model: google("gemini-2.0-flash-exp"),
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
}
