import { Question } from "@/types/types";

export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export const shuffleMultipleChoiceOptions = (question: Question): Question => {
    if (question.type === "multiple-choice" && question.options) {
        const originalOptions = [...question.options];

        const correctAnswersText =
            originalOptions.filter((_, index) => (question.correctAnswer as number[]).includes(index));
        const shuffledOptions = shuffleArray([...question.options]);
        const newCorrectAnswer: number[] = correctAnswersText.map((correctAnswer) => shuffledOptions.indexOf(correctAnswer));

        return {
            ...question,
            options: shuffledOptions,
            correctAnswer: newCorrectAnswer,
        };
    }
    return question;
};
