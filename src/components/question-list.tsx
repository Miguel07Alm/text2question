"use client";

import { useState, useEffect } from "react";
import { Submit } from "./submit";
import { Question } from "@/types/types";
// import { ExportQuestions } from "./export-questions";
import { CheckCircle, XCircle, HelpCircle, Check } from "lucide-react";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";

interface QuestionListProps {
    questions: Question[];
    timeLimit?: number | null; // hacer el tiempo opcional
}

export function QuestionList({
    questions: initialQuestions,
    timeLimit = null, // valor por defecto null
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

    const [answeredCount, setAnsweredCount] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState<string>("00:00");
    const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : 0); // convertir a segundos
    const [isPenalized, setIsPenalized] = useState(false);
    const [autoSubmitWarning, setAutoSubmitWarning] = useState(false);

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

    useEffect(() => {
        const answered = selectedAnswers.filter(answer => 
            Array.isArray(answer) 
                ? answer.length > 0 
                : answer !== undefined
        ).length;
        setAnsweredCount(answered);
    }, [selectedAnswers]);

    // Iniciar el temporizador cuando se monta el componente
    useEffect(() => {
        setStartTime(new Date());
    }, []);

    // Actualizar el tiempo transcurrido cada segundo
    useEffect(() => {
        if (!timeLimit) return;
        if (!startTime || endTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setElapsedTime(
                `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            );

            // Actualizar tiempo restante
            const remaining = (timeLimit * 60) - Math.floor(diff / 1000);
            setTimeRemaining(remaining);

            // Mostrar advertencia cuando quedan 60 segundos
            if (remaining === 60) {
                setAutoSubmitWarning(true);
            }

            // Auto-submit cuando se acaba el tiempo
            if (remaining <= 0) {
                clearInterval(timer);
                handleTimeUp();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, endTime, timeLimit]);

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
        setEndTime(new Date()); // Guardar tiempo final
        const results = await Promise.all(
            questions.map((_, index) => checkAnswer(index))
        );
        setAnswerResults(results);
        setShowResults(true);
        setIsChecking(false);
    };

    const handleTimeUp = async () => {
        setIsPenalized(true);
        await handleCheckAnswers();
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
        setStartTime(new Date()); // Reiniciar tiempo
        setEndTime(null);
        setElapsedTime("00:00");
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

    const calculatePercentage = (correct: number, total: number) => {
        return Math.round((correct / total) * 100);
    };

    const formatTimeSpent = (startTime: Date, endTime: Date) => {
        const diff = endTime.getTime() - startTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const formatTimeRemaining = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const calculateFinalScore = (correctCount: number, totalQuestions: number) => {
        const baseScore = (correctCount / totalQuestions) * 100;
        if (isPenalized) {
            return Math.max(0, baseScore - 10); // Penalización del 10%
        }
        return baseScore;
    };

    return (
        <div className="space-y-8">
            <div className="sticky top-0 z-10 py-4 border-b backdrop-blur-sm bg-opacity-90 bg-white dark:bg-gray-900 rounded-md">
                <div className="md:hidden space-y-4 mx-2">
                    <h2 className="text-xl font-semibold text-center">
                        {showResults ? "Results" : "Questions"}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Progress:</span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                                {answeredCount} / {questions.length}
                            </span>
                        </div>
                        {timeLimit && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Time:</span>
                                <span className={`px-2 py-1 rounded-md font-mono
                                    ${timeRemaining <= 60 
                                        ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 animate-pulse' 
                                        : 'bg-gray-100 dark:bg-gray-800'}`}
                                >
                                    {formatTimeRemaining(timeRemaining)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden md:block mx-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            {showResults ? "Results" : "Questions"}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Progress:</span>
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                                    {answeredCount} / {questions.length}
                                </span>
                            </div>
                            {timeLimit && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Time Left:</span>
                                    <span className={`px-2 py-1 rounded-md font-mono
                                        ${timeRemaining <= 60 
                                            ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 animate-pulse' 
                                            : 'bg-gray-100 dark:bg-gray-800'}`}
                                    >
                                        {formatTimeRemaining(timeRemaining)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-2 h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300"
                        style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {timeLimit && autoSubmitWarning && timeRemaining > 0 && !showResults && (
                <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-4 rounded-lg shadow-lg animate-bounce">
                    <p className="font-medium">⚠️ 1 minute remaining!</p>
                    <p className="text-sm">Quiz will be automatically submitted when time runs out.</p>
                </div>
            )}

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
                <div className="space-y-6">
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
                                Quiz Complete
                            </h3>
                            <div className="flex items-end gap-4">
                                <span className="text-6xl font-semibold text-gray-900 dark:text-gray-100">
                                    {calculateFinalScore(
                                        answerResults.filter((result) => result).length,
                                        questions.length
                                    ).toFixed(1)}%
                                </span>
                                <div className="mb-2 space-y-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Accuracy
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {answerResults.filter((result) => result).length} correct answers
                                    </p>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-500 ease-out"
                                    style={{ 
                                        width: `${calculatePercentage(
                                            answerResults.filter((result) => result).length,
                                            questions.length
                                        )}%` 
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Total Questions: {questions.length}</span>
                                <span>Time Spent: {startTime && endTime ? formatTimeSpent(startTime, endTime) : elapsedTime}</span>
                            </div>
                            {isPenalized && (
                                <div className="text-sm text-red-600 dark:text-red-400">
                                    10% penalty applied for exceeding time limit
                                </div>
                            )}
                        </div>
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
