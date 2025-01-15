import { z } from "zod";

export const QuestionSchema = z.object({
    questions: z.array(
        z.object({
            question: z.string(),
            type: z.enum(["multiple-choice", "true-false", "short-answer"]),
            options: z.array(z.string().min(1)),
            correctAnswer: z.union([z.number().int().min(0), z.string(), z.boolean()]),
            hint: z.string().optional(),
        })
    ),
});

export interface Question {
    question?: string;
    type?: "multiple-choice" | "true-false" | "short-answer";
    options?: string[];
    correctAnswer?: number | string;
    hint?: string;
};

export type GenerateQuestionsParams = {
    input: string;
    fileContent: string;
    questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed';
    questionCount: number;
};