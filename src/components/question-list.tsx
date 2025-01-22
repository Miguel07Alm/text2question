"use client";

import { useState, useEffect } from "react";
import { Submit } from "./submit";
import { Question } from "@/types/types";
// import { ExportQuestions } from "./export-questions";
import { CheckCircle, XCircle, HelpCircle, Check } from "lucide-react";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";

interface QuestionListProps {
    questions: Question[];
}

export function QuestionList({
    questions: initialQuestions,
}: QuestionListProps) {
    console.log("🚀 ~ initialQuestions:", JSON.stringify(initialQuestions))
    const [questions, setQuestions] = useState(initialQuestions);

    const [selectedAnswers, setSelectedAnswers] = useState<
        (number[] | string | undefined)[]
    >(new Array(questions.length).fill(undefined)); // Initialize with undefined
    const [showResults, setShowResults] = useState(false);
    const [showHint, setShowHint] = useState<number[]>([]);
    const [answerResults, setAnswerResults] = useState<boolean[]>(
        new Array(questions.length).fill(false)
    );
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        setQuestions(initialQuestions);
    }, [initialQuestions]);

    // Mezclar las opciones de multiple-choice solo una vez al inicio
    useEffect(() => {
        if (questions.some((q) => q.type === "multiple-choice")) {
            setQuestions((prevQuestions) =>
                prevQuestions.map(shuffleMultipleChoiceOptions)
            );
        }
    }, []);

    const handleSelect = (questionIndex: number, answer: number | string) => {
        setSelectedAnswers((prev) => {
            const newAnswers = [...prev];
            const question = questions[questionIndex];

            if (question.type === "multiple-choice") {
                // Inicializar el array de respuestas para esta pregunta
                let currentAnswers = Array.isArray(newAnswers[questionIndex]) 
                    ? newAnswers[questionIndex] as number[]
                    : [];

                // Determinar si es selección múltiple o única
                const isMultipleSelection = (question.correctAnswersCount || 1) > 1;

                if (typeof answer === "number") {
                    if (isMultipleSelection) {
                        // Lógica para selección múltiple
                        if (currentAnswers.includes(answer)) {
                            // Remover si ya está seleccionada
                            currentAnswers = currentAnswers.filter(a => a !== answer);
                        } else if (currentAnswers.length < (question.correctAnswersCount || 1)) {
                            // Agregar si no excede el límite de respuestas correctas
                            currentAnswers = [...currentAnswers, answer].sort((a, b) => a - b);
                        }
                        newAnswers[questionIndex] = currentAnswers;
                    } else {
                        // Lógica para selección única
                        newAnswers[questionIndex] = [answer];
                    }
                }
            } else if (question.type === "true-false") {
                // Mantener la lógica existente para true-false
                if (typeof answer === "string" && ["true", "false"].includes(answer)) {
                    newAnswers[questionIndex] = answer;
                }
            } else if (question.type === "short-answer") {
                // Mantener la lógica existente para short-answer
                if (typeof answer === "string") {
                    newAnswers[questionIndex] = answer;
                }
            }

            return newAnswers;
        });
    };

    const checkShortAnswer = async (
        userAnswer: string,
        correctAnswer: string
    ) => {
        try {
            const response = await fetch("/api/check-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userAnswer, correctAnswer }),
            });
            const { isCorrect } = await response.json();
            return isCorrect;
        } catch (error) {
            console.error("Error checking short answer:", error);
            return false;
        }
    };

    const checkAnswer = async (questionIndex: number) => {
        const question = questions[questionIndex];
        const selectedAnswer = selectedAnswers[questionIndex];

        if (!question) return false;

        if (question.type === "multiple-choice") {
            const correctAnswers = (
                Array.isArray(question.correctAnswer)
                    ? question.correctAnswer
                    : [question.correctAnswer]
            ) as number[];

            const selected = (Array.isArray(selectedAnswer)
                ? selectedAnswer
                : [selectedAnswer]) as number[];

            return (
                correctAnswers.length === selected.length &&
                correctAnswers.every((answer) =>
                    selected.includes(answer)
                )
            );
        }

        if (question.type === "true-false") {
            return (
                String(selectedAnswer).toLowerCase() ===
                String(question.correctAnswer).toLowerCase()
            );
        }

        if (question.type === "short-answer") {
            return await checkShortAnswer(
                String(selectedAnswer),
                String(question.correctAnswer)
            );
        }
        console.log(
            "🚀 ~ checkAnswer ~ question.correctAnswer:",
            question.correctAnswer
        );
        console.log("🚀 ~ checkAnswer ~ selectedAnswer:", selectedAnswer);
        return selectedAnswer === question.correctAnswer;
    };

    const handleCheckAnswers = async () => {
        setIsChecking(true);
        const results = await Promise.all(
            questions.map((_, index) => checkAnswer(index))
        );
        setAnswerResults(results);
        setShowResults(true);
        setIsChecking(false);
    };

    const toggleHint = (index: number) => {
        setShowHint((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    const handleRetakeQuiz = () => {
        setQuestions((prevQuestions) => {
            const shuffledQuestions = shuffleArray([...prevQuestions]);
            return shuffledQuestions.map(shuffleMultipleChoiceOptions);
        });
        setSelectedAnswers(new Array(questions.length).fill(undefined)); // Reset to undefined
        setShowResults(false);
        setAnswerResults(new Array(questions.length).fill(false));
        setShowHint([]);
    };

    const getFormattedAnswers = (question: Question, correctAnswers: number[]) => {
        if (!question.options) return '';
        
        if (correctAnswers.length === 1) {
            return question.options[correctAnswers[0]];
        }

        return correctAnswers
            .map((index) => `• ${question.options![index]}`)
            .join('\n');
    };

    const getSelectionStyle = (isSelected: boolean, isMultiple: boolean) => {
        const baseStyle = "absolute inset-0 transition-all duration-200";
        const multipleStyle = isSelected
            ? "border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950"
            : "border-2 border-gray-200 dark:border-gray-700";
        const singleStyle = isSelected
            ? "bg-blue-500 dark:bg-blue-400"
            : "border-2 border-gray-200 dark:border-gray-700";
        
        return `${baseStyle} ${isMultiple ? multipleStyle : singleStyle} rounded-lg`;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    {showResults ? "Results" : "Questions"}
                </h2>
            </div>

            {questions.map((question, qIndex) => (
                <div
                    key={qIndex}
                    className={`p-6 rounded-xl border ${
                        showResults
                            ? answerResults[qIndex]
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
                                        {question.type ===
                                            "multiple-choice" && (
                                            <div className="space-y-2">
                                                {question.correctAnswersCount &&
                                                    question.correctAnswersCount >
                                                        1 && (
                                                        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900">
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                                    Multiple Selection Required
                                                                </h4>
                                                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                                                    Select{" "}
                                                                    {
                                                                        question.correctAnswersCount
                                                                    }{" "}
                                                                    answers
                                                                </p>
                                                            </div>
                                                            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-md">
                                                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                                                    {(
                                                                        selectedAnswers[
                                                                            qIndex
                                                                        ] as number[] ||
                                                                        []
                                                                    ).length}{" "}
                                                                    of{" "}
                                                                    {
                                                                        question.correctAnswersCount
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                <div className="grid gap-2">
                                                    {question.options?.map(
                                                        (option, oIndex) => {
                                                            const isSelected = Array.isArray(selectedAnswers[qIndex]) &&
                                                                (selectedAnswers[qIndex] as number[]).includes(oIndex);
                                                            const isMultiple =
                                                                (question.correctAnswersCount ||
                                                                    1) > 1;
                                                            const isDisabled =
                                                                !isSelected &&
                                                                isMultiple &&
                                                                Array.isArray(selectedAnswers[qIndex]) &&
                                                                (selectedAnswers[qIndex] as number[]).length >=
                                                                    (question.correctAnswersCount ||
                                                                        1);

                                                            return (
                                                                <button
                                                                    key={
                                                                        oIndex
                                                                    }
                                                                    onClick={() =>
                                                                        handleSelect(
                                                                            qIndex,
                                                                            oIndex
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isDisabled
                                                                    }
                                                                    className={`
                                                                        relative w-full p-4 text-left transition-all
                                                                        ${
                                                                            isDisabled
                                                                                ? "opacity-50 cursor-not-allowed"
                                                                                : "hover:transform hover:scale-[1.01]"
                                                                        }
                                                                        group
                                                                    `}
                                                                >
                                                                    <div
                                                                        className={getSelectionStyle(
                                                                            isSelected,
                                                                            isMultiple
                                                                        )}
                                                                    />
                                                                    <div className="relative flex items-center gap-3">
                                                                        <div
                                                                            className={`
                                                                                flex items-center justify-center w-5 h-5
                                                                                ${
                                                                                    isMultiple
                                                                                        ? "rounded-md"
                                                                                        : "rounded-full"
                                                                                }
                                                                                ${
                                                                                    isSelected
                                                                                        ? "text-white"
                                                                                        : "text-transparent"
                                                                                }
                                                                                transition-colors
                                                                                ${
                                                                                    isMultiple &&
                                                                                    isSelected
                                                                                        ? "bg-blue-500 dark:bg-blue-400"
                                                                                        : ""
                                                                                }
                                                                            `}
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                        </div>
                                                                        <span
                                                                            className={`
                                                                                flex-1 text-sm
                                                                                ${
                                                                                    isSelected
                                                                                        ? "font-medium"
                                                                                        : "font-normal"
                                                                                }
                                                                            `}
                                                                        >
                                                                            {
                                                                                option
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {question.type === "true-false" && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleSelect(
                                                            qIndex,
                                                            "true"
                                                        )
                                                    }
                                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                                        selectedAnswers[
                                                            qIndex
                                                        ] === "true"
                                                            ? "border-black bg-gray-50 dark:border-white dark:bg-gray-900"
                                                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900"
                                                    }`}
                                                >
                                                    True
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleSelect(
                                                            qIndex,
                                                            "false"
                                                        )
                                                    }
                                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                                        selectedAnswers[
                                                            qIndex
                                                        ] === "false"
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
                                                    handleSelect(
                                                        qIndex,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            />
                                        )}
                                    </div>
                                    {question?.hint && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() =>
                                                    toggleHint(qIndex)
                                                }
                                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                                {showHint.includes(qIndex)
                                                    ? "Hide hint"
                                                    : "Show hint"}
                                            </button>
                                            {showHint.includes(qIndex) && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                    {question.hint}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {showResults && (
                                        <div className="flex items-center gap-2 mt-4 text-sm">
                                            {answerResults[qIndex] ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    <div className="space-y-2">
                                                        <span className="text-green-600 dark:text-green-400">
                                                            Correct!
                                                        </span>
                                                        {question.why && (
                                                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm italic">
                                                                {question.why}
                                                                {question.page && (
                                                                    <span className="ml-2 font-semibold">
                                                                        (Page{" "}
                                                                        {
                                                                            question.page
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                    <div className="space-y-2">
                                                        <div className="text-red-600 dark:text-red-400">
                                                            <p>
                                                                Incorrect. The
                                                                correct answer
                                                                {Array.isArray(
                                                                    question.correctAnswer
                                                                ) &&
                                                                question
                                                                    .correctAnswer
                                                                    .length > 1
                                                                    ? "s were"
                                                                    : " was"}
                                                                :
                                                            </p>
                                                            <pre className="mt-1 whitespace-pre-line">
                                                                {question.type ===
                                                                    "multiple-choice" &&
                                                                question.options
                                                                    ? getFormattedAnswers(
                                                                          question,
                                                                          Array.isArray(
                                                                              question.correctAnswer
                                                                          )
                                                                              ? question.correctAnswer
                                                                              : [
                                                                                    question.correctAnswer as unknown as number,
                                                                                ]
                                                                      )
                                                                    : question.correctAnswer}
                                                            </pre>
                                                        </div>
                                                        {question.why && (
                                                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm italic">
                                                                {question.why}
                                                                {question.page && (
                                                                    <span className="ml-2 font-semibold">
                                                                        (Page{" "}
                                                                        {
                                                                            question.page
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
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
                <Submit
                    onClick={handleCheckAnswers}
                    loading={isChecking}
                    disabled={isChecking}
                    primaryColor="green-600"
                    foregroundColor="white"
                >
                    Check answers
                </Submit>
            )}

            {showResults && (
                <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <h3 className="text-lg font-medium mb-2">Summary</h3>
                        <p>
                            Correct:{" "}
                            {answerResults.filter((result) => result).length}{" "}
                            out of {questions.length}
                        </p>
                    </div>
                    <Submit
                        onClick={handleRetakeQuiz}
                        loading={false}
                        primaryColor="yellow"
                        foregroundColor="black"
                    >
                        Retake Quiz
                    </Submit>
                </div>
            )}
        </div>
    );
}
