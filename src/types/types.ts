import { DeepPartial } from "ai";
import { z } from "zod";

export const QuestionSchema = z.object({
    questions: z.array(
        z.object({
            question: z.string(),
            type: z.enum(["multiple-choice", "true-false", "short-answer"]),
            options: z.array(z.string().min(1)),
            correctAnswer: z.union([
                z.array(z.number()),  // Siempre array para multiple-choice
                z.string(),          // Para short-answer
                z.boolean()          // Para true-false
            ]),
            correctAnswersCount: z.number(),  // Ahora requerido, no opcional
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