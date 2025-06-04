import { deepseek } from "@ai-sdk/deepseek";
import { google } from "@ai-sdk/google";
import { LanguageModelV1, openrouter } from "@openrouter/ai-sdk-provider";
import { DeepPartial } from "ai";
import { z } from "zod";

export const QuestionSchema = z.object({
    questions: z.array(
        z.object({
            question: z.string(),
            type: z.enum(["multiple-choice", "true-false", "short-answer"]),
            options: z.array(z.string().min(1)).optional(),
            correctAnswer: z.union([
                z.array(z.number()),  
                z.string(),          
                z.boolean()          
            ]),
            correctAnswersCount: z.number().optional(),  
            hint: z.string().optional(),
            why: z.string(),
            page: z.number().optional(), 
        })
    ),
});

export interface Question {
    question?: string;
    type?: "multiple-choice" | "true-false" | "short-answer";
    options?: string[];
    correctAnswer?: number[] | string | boolean;
    correctAnswersCount?: number; 
    hint?: string;
    why?: string;
    page?: number;
};

export type GenerateQuestionsParams = {
    input: string;
    fileContent: string;
    questionType: "multiple-choice" | "true-false" | "short-answer" | "mixed";
    questionCount: number;
    optionsCount: number;
    systemPrompt?: string;
    correctAnswersCount: number;
    isRandomCorrectAnswers?: boolean;
    minCorrectAnswers?: number;
    maxCorrectAnswers?: number;
    model: Model;
    output?:
        | (
              | DeepPartial<{
                    correctAnswersCount: number;
                    type: "multiple-choice" | "true-false" | "short-answer";
                    options: string[];
                    question: string;
                    correctAnswer: string | boolean | number[];
                    why: string;
                    hint?: string | undefined;
                    page?: number | undefined;
                }>
              | undefined
          )[]
        | undefined;
};

export type Model = "deepseek-chat" | "openai/gpt-4o-mini" | "gemini-2.0-flash";

export const ModelToLanguageModel: Record<Model, LanguageModelV1> = {
    "deepseek-chat": deepseek("deepseek-chat"),
    "openai/gpt-4o-mini": openrouter.chat("openai/gpt-4o-mini"),
    "gemini-2.0-flash": google("gemini-2.0-flash"),
}