"use client";

import { useState } from "react";
import { Submit } from "./submit";
import { Question } from "@/types/types";
import { ExportQuestions } from "./export-questions";
import { CheckCircle, XCircle } from "lucide-react";

interface QuestionListProps {
    questions: Question[];
}

export function QuestionList({ questions }: QuestionListProps) {
    const [selectedAnswers, setSelectedAnswers] = useState<(number | string)[]>(
        new Array(questions.length).fill(null)
    );
    const [showResults, setShowResults] = useState(false);

    const handleSelect = (questionIndex: number, answer: number | string) => {
        setSelectedAnswers((prev) => {
            const newAnswers = [...prev];
            newAnswers[questionIndex] = answer;
            return newAnswers;
        });
    };

    const isCorrectAnswer = (questionIndex: number) => {
        const question = questions[questionIndex];
        const selectedAnswer = selectedAnswers[questionIndex];

        if (question && question.type === "true-false") {
            return (
                String(selectedAnswer).toLowerCase() ===
                String(question.correctAnswer).toLowerCase()
            );
        }

        return question ? selectedAnswer === question.correctAnswer : false;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    {showResults ? "Results" : "Questions"}
                </h2>
                <ExportQuestions questions={questions} />
            </div>

            {questions.map((question, qIndex) => (
                <div
                    key={qIndex}
                    className={`p-6 rounded-xl border ${
                        showResults
                            ? isCorrectAnswer(qIndex)
                                ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10"
                                : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10"
                            : "border-gray-200 dark:border-gray-800"
                    }`}
                >
                    <div className="flex gap-3">
                        <span className="text-lg font-medium">
                            {qIndex + 1}.
                        </span>
                        <div className="space-y-4 flex-1">
                            {question && (
                                <>
                                    <h3 className="text-lg font-medium">
                                        {question.question}
                                    </h3>
                                    <div className="space-y-2">
                                        {question.type === "multiple-choice" &&
                                            question.options?.map((option, oIndex) => (
                                                <button
                                                    key={oIndex}
                                                    onClick={() =>
                                                        handleSelect(qIndex, oIndex)
                                                    }
                                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                                        selectedAnswers[qIndex] ===
                                                        oIndex
                                                            ? "border-black bg-gray-50 dark:border-white dark:bg-gray-900"
                                                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        {question.type === "true-false" && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleSelect(qIndex, "true")
                                                    }
                                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                                        selectedAnswers[qIndex] ===
                                                        "true"
                                                            ? "border-black bg-gray-50 dark:border-white dark:bg-gray-900"
                                                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                                                    }`}
                                                >
                                                    True
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleSelect(qIndex, "false")
                                                    }
                                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                                        selectedAnswers[qIndex] ===
                                                        "false"
                                                            ? "border-black bg-gray-50 dark:border-white dark:bg-gray-900"
                                                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                                                    }`}
                                                >
                                                    False
                                                </button>
                                            </>
                                        )}
                                        {question.type === "short-answer" && (
                                            <input
                                                type="text"
                                                onChange={(e) =>
                                                    handleSelect(qIndex, e.target.value)
                                                }
                                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            />
                                        )}
                                    </div>
                                    {showResults && (
                                        <div className="flex items-center gap-2 mt-4 text-sm">
                                            {isCorrectAnswer(qIndex) ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    <span className="text-green-600 dark:text-green-400">
                                                        Correct!
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                    <span className="text-red-600 dark:text-red-400">
                                                        Incorrect. The correct answer was:{" "}
                                                        {question.type ===
                                                            "multiple-choice" &&
                                                        question.options
                                                            ? question.options[
                                                                  question.correctAnswer as number
                                                              ]
                                                            : question.correctAnswer}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {!showResults && (
                <Submit onClick={() => setShowResults(true)}>
                    Check answers
                </Submit>
            )}

            {showResults && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-lg font-medium mb-2">Summary</h3>
                    <p>
                        Correct:{" "}
                        {questions.reduce(
                            (count, _, idx) =>
                                count + (isCorrectAnswer(idx) ? 1 : 0),
                            0
                        )}{" "}
                        out of {questions.length}
                    </p>
                </div>
            )}
        </div>
    );
}
