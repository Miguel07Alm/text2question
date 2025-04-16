"use client";

import { useState, useEffect } from "react";
import { Submit } from "./submit";
import { Question } from "@/types/types";
// import { ExportQuestions } from "./export-questions";
import { CheckCircle, XCircle, HelpCircle, Check } from "lucide-react";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";

interface ShortAnswerResult {
    score: number | null;
    reason: string | null;
}

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
        new Array(initialQuestions.length).fill(false)
    );
    // New state for short answer details
    const [shortAnswerDetails, setShortAnswerDetails] = useState<Record<number, ShortAnswerResult>>(
        {}
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
                : answer !== undefined && answer !== '' // Consider empty string as unanswered for short-answer
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

    // Helper function to call the API for checking short answers
    const checkShortAnswer = async (
        questionIndex: number, // Add index to store results
        userAnswer: string,
        correctAnswer: string
    ): Promise<boolean> => {
        // Handle empty user answer
        if (!userAnswer || userAnswer.trim() === "") {
            setShortAnswerDetails(prev => ({ ...prev, [questionIndex]: { score: 0, reason: "No answer provided." } }));
            return false;
        }
        try {
            const response = await fetch("/api/check-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userAnswer, correctAnswer }),
            });
            if (!response.ok) {
                console.error("API Error:", response.statusText);
                const errorText = await response.text();
                setShortAnswerDetails(prev => ({ ...prev, [questionIndex]: { score: null, reason: `API Error: ${response.statusText} - ${errorText}` } }));
                return false; // Treat API errors as incorrect
            }
            const data = await response.json();
            if (data.error) {
                console.error("API Error Message:", data.error);
                setShortAnswerDetails(prev => ({ ...prev, [questionIndex]: { score: null, reason: `API Error: ${data.error}` } }));
                return false;
            }

            const { score, reason } = data as { score: number; reason: string };
            // Store score and reason
            setShortAnswerDetails(prev => ({ ...prev, [questionIndex]: { score, reason } }));

            // Determine correctness based on score threshold (e.g., >= 75)
            const isCorrect = score >= 75;
            return isCorrect;

        } catch (error) {
            console.error("Error checking short answer:", error);
            setShortAnswerDetails(prev => ({ ...prev, [questionIndex]: { score: null, reason: `Client Error: ${error instanceof Error ? error.message : String(error)}` } }));
            return false; // Treat network or other errors as incorrect
        }
    };

    // Function to check a single answer, now async
    const checkAnswer = async (questionIndex: number): Promise<boolean> => {
        const question = questions[questionIndex];
        const selectedAnswer = selectedAnswers[questionIndex];

        if (!question || selectedAnswer === undefined) return false;

        if (question.type === "multiple-choice") {
            const correctAnswers = (
                Array.isArray(question.correctAnswer)
                    ? question.correctAnswer
                    : [question.correctAnswer]
            ) as number[];

            const selected = (Array.isArray(selectedAnswer)
                ? selectedAnswer
                : [selectedAnswer]) as (number | undefined)[]; // Allow undefined

            // Filter out undefined values before comparison
            const validSelected = selected.filter(s => s !== undefined) as number[];

            // Ensure selected answers are sorted for consistent comparison
            validSelected.sort((a, b) => a - b);
            const sortedCorrectAnswers = [...correctAnswers].sort((a, b) => a - b);

            return (
                sortedCorrectAnswers.length === validSelected.length &&
                sortedCorrectAnswers.every((answer, index) =>
                    answer === validSelected[index]
                )
            );
        }

        if (question.type === "true-false") {
            // Ensure correctAnswer is treated as a boolean string if necessary
            const correctAnswerBool = typeof question.correctAnswer === 'boolean'
                ? String(question.correctAnswer)
                : String(question.correctAnswer).toLowerCase();

            return (
                String(selectedAnswer).toLowerCase() === correctAnswerBool
            );
        }

        if (question.type === "short-answer") {
            // Call the async helper function, passing the index
            return await checkShortAnswer(
                questionIndex, // Pass index here
                String(selectedAnswer),
                String(question.correctAnswer) // Ensure correctAnswer is a string
            );
        }

        // Fallback for unexpected types (should not happen with current types)
        console.warn("Unsupported question type for checking:", question.type);
        return false;
    };

    // Updated to handle async checkAnswer
    const handleCheckAnswers = async () => {
        setIsChecking(true);
        setEndTime(new Date()); // Guardar tiempo final
        // Reset short answer details before checking
        setShortAnswerDetails({});
        try {
            const results = await Promise.all(
                questions.map((_, index) => checkAnswer(index))
            );
            setAnswerResults(results);
            setShowResults(true);
        } catch (error) {
            console.error("Error during answer checking:", error);
            // Handle potential errors during Promise.all, e.g., show a general error message
        } finally {
            setIsChecking(false);
        }
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
        setShortAnswerDetails({}); // Reset short answer details on retake
        setStartTime(new Date()); // Reiniciar tiempo
        setEndTime(null);
        setElapsedTime("00:00");
        setTimeRemaining(timeLimit ? timeLimit * 60 : 0); // Reset timer
        setIsPenalized(false);
        setAutoSubmitWarning(false);
    };

    const getFormattedAnswers = (question: Question, correctAnswers: number[]) => {
        if (!question.options) return '';

        if (correctAnswers.length === 1) {
            // Ensure the index is valid before accessing the option
            return correctAnswers[0] >= 0 && correctAnswers[0] < question.options.length
                ? question.options[correctAnswers[0]]
                : 'Invalid Answer Index';
        }

        return correctAnswers
            .map((index) => index >= 0 && index < question.options!.length ? `• ${question.options![index]}` : '• Invalid Answer Index')
            .join('\n'); // Corrected newline character
    };


    const getSelectionStyle = (isSelected: boolean, isMultiple: boolean) => {
        const baseStyle = "absolute inset-0 transition-all duration-200";
        const multipleStyle = isSelected
            ? "border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950"
            : "border-2 border-gray-200 dark:border-gray-700";
        const singleStyle = isSelected
            ? "bg-blue-500 dark:bg-blue-400" // Changed for single selection visual cue
            : "border-2 border-gray-200 dark:border-gray-700"; // Keep border for unselected single

        return `${baseStyle} ${isMultiple ? multipleStyle : singleStyle} rounded-lg`;
    };


    const calculatePercentage = (correct: number, total: number) => {
        if (total === 0) return 0; // Avoid division by zero
        return Math.round((correct / total) * 100);
    };

    const formatTimeSpent = (startTime: Date | null, endTime: Date | null) => {
        if (!startTime || !endTime) return "--m --s";
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
        if (totalQuestions === 0) return 0;
        const baseScore = (correctCount / totalQuestions) * 100;
        let finalScore = baseScore;
        if (isPenalized) {
            finalScore = Math.max(0, baseScore - 10); // Penalización del 10%
        }
        return Math.round(finalScore); // Round the final score
    };


    const correctCount = answerResults.filter(Boolean).length;
    const finalScore = calculateFinalScore(correctCount, questions.length);

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
                        style={{ width: `${calculatePercentage(answeredCount, questions.length)}%` }}
                    />
                </div>
            </div>

            {timeLimit && autoSubmitWarning && timeRemaining > 0 && !showResults && (
                <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-4 rounded-lg shadow-lg animate-bounce z-50">
                    <p className="font-medium">⚠️ 1 minute remaining!</p>
                    <p className="text-sm">Quiz will be automatically submitted when time runs out.</p>
                </div>
            )}

            {showResults && (
                <div className="p-6 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-center">Quiz Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                            <p className={`text-3xl font-bold ${finalScore >= 70 ? 'text-green-600 dark:text-green-400' : finalScore >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                {finalScore}%
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Correct Answers</p>
                            <p className="text-3xl font-bold">{correctCount} / {questions.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Time Spent</p>
                            <p className="text-3xl font-bold">{formatTimeSpent(startTime, endTime)}</p>
                        </div>
                    </div>
                    {isPenalized && (
                        <p className="text-center text-sm text-red-600 dark:text-red-400 mt-3">
                            -10% score penalty applied due to time limit exceeded.
                        </p>
                    )}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleRetakeQuiz}
                            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Retake Quiz
                        </button>
                    </div>
                </div>
            )}

            {questions.map((question, qIndex) => (
                <div
                    key={qIndex}
                    className={`p-6 rounded-xl border transition-colors duration-300 ${
                        showResults
                            ? answerResults[qIndex]
                                ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10"
                                : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10"
                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                    }`}
                >
                    <div className="flex gap-3">
                        <span className="text-lg font-medium pt-1">
                            {qIndex + 1}.
                        </span>
                        <div className="space-y-4 flex-1">
                            {question && (
                                <>
                                    <h3 className="text-lg font-medium">
                                        {question.question}
                                    </h3>
                                    <div className="space-y-3">
                                        {question.type === "multiple-choice" && (
                                            <>
                                                {question.correctAnswersCount &&
                                                    question.correctAnswersCount > 1 && (
                                                        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900">
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                                    Multiple Selection Required
                                                                </h4>
                                                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                                                    Select{" "}
                                                                    {question.correctAnswersCount}{" "}
                                                                    answers
                                                                </p>
                                                            </div>
                                                            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-md">
                                                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                                                    {(
                                                                        selectedAnswers[qIndex] as number[] || []
                                                                    ).length}{" "}
                                                                    of{" "}
                                                                    {question.correctAnswersCount}
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
                                                                (question.correctAnswersCount || 1) > 1;
                                                            const isDisabled = showResults || (
                                                                !isSelected &&
                                                                isMultiple &&
                                                                Array.isArray(selectedAnswers[qIndex]) &&
                                                                (selectedAnswers[qIndex] as number[]).length >=
                                                                    (question.correctAnswersCount || 1)
                                                            );

                                                            return (
                                                                <button
                                                                    key={oIndex}
                                                                    onClick={() => handleSelect(qIndex, oIndex)}
                                                                    disabled={isDisabled}
                                                                    className={`
                                                                        relative w-full p-4 text-left transition-all
                                                                        ${isDisabled
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
                                                                                flex items-center justify-center w-5 h-5 border
                                                                                ${isMultiple ? "rounded-md" : "rounded-full"}
                                                                                ${isSelected
                                                                                    ? (isMultiple ? "bg-blue-500 dark:bg-blue-400 border-blue-500 dark:border-blue-400 text-white" : "bg-blue-500 dark:bg-blue-400 border-blue-500 dark:border-blue-400 text-white") // Keep checkmark visible for single selected
                                                                                    : "border-gray-300 dark:border-gray-600 text-transparent"}
                                                                                transition-colors
                                                                            `}
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                        </div>

                                                                        <span
                                                                            className={`
                                                                                flex-1 text-sm
                                                                                ${isSelected ? "font-medium" : "font-normal"}
                                                                                ${isDisabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}
                                                                            `}
                                                                        >
                                                                            {option}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {question.type === "true-false" && (
                                            <div className="flex gap-3">
                                                {[true, false].map((value) => {
                                                    const isSelected = selectedAnswers[qIndex] === String(value);
                                                    return (
                                                        <button
                                                            key={String(value)}
                                                            onClick={() => handleSelect(qIndex, String(value))}
                                                            disabled={showResults}
                                                            className={`
                                                                flex-1 p-3 rounded-lg border text-center transition-colors
                                                                ${isSelected
                                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                }
                                                                ${showResults ? 'cursor-not-allowed opacity-70' : ''}
                                                            `}
                                                        >
                                                            {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {question.type === "short-answer" && (
                                            <input
                                                type="text"
                                                value={(selectedAnswers[qIndex] as string) || ''}
                                                onChange={(e) => handleSelect(qIndex, e.target.value)}
                                                disabled={showResults}
                                                placeholder="Type your answer here..."
                                                className={`
                                                    w-full p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors
                                                    ${showResults ? 'cursor-not-allowed opacity-70' : ''}
                                                `}
                                            />
                                        )}
                                    </div>

                                    {showResults && (
                                        <div className={`mt-4 p-4 rounded-lg border 
                                            ${answerResults[qIndex]
                                                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' // Green if score >= threshold
                                                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}` // Red otherwise
                                        }>
                                            <div className="flex items-center gap-2 mb-2">
                                                {answerResults[qIndex] ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                )}
                                                <span className={`font-medium ${answerResults[qIndex] ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                                    {answerResults[qIndex] ? "Correct" : "Incorrect"}
                                                    {/* Display score for short answers */}
                                                    {question.type === 'short-answer' && shortAnswerDetails[qIndex]?.score !== null && (
                                                        <span className="ml-2 text-sm font-normal">({shortAnswerDetails[qIndex]?.score}%)</span>
                                                    )}
                                                </span>
                                            </div>

                                            {/* Display API reason for short answers */}
                                            {question.type === 'short-answer' && shortAnswerDetails[qIndex]?.reason && (
                                                 <p className="text-sm mb-2 italic text-gray-600 dark:text-gray-400">
                                                    {shortAnswerDetails[qIndex]?.reason}
                                                 </p>
                                            )}


                                            {/* Only show the original correct answer if the user was marked INCORRECT for non-short-answer types */}
                                            {!answerResults[qIndex] && question.type !== 'short-answer' && (
                                                <div className="text-sm space-y-1 mb-2">
                                                    {/* Show correct options for multiple-choice */}
                                                    {question.type === 'multiple-choice' && Array.isArray(question.correctAnswer) && (
                                                        <p><span className="font-medium">Correct Answer(s):</span><br />
                                                            <span className="whitespace-pre-wrap">
                                                                {getFormattedAnswers(question, question.correctAnswer as number[])}
                                                            </span>
                                                        </p>
                                                    )}
                                                    {/* Show correct answer ONLY for true/false when incorrect */}
                                                    {question.type === 'true-false' && (
                                                        <p><span className="font-medium">Correct Answer:</span> {String(question.correctAnswer)}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Always show the original explanation */}
                                            {question.why && (
                                                <p className={`text-sm ${!answerResults[qIndex] || question.type === 'short-answer' ? 'mt-2 pt-2 border-t border-gray-200 dark:border-gray-700' : ''}`}>
                                                    <span className="font-medium">Explanation:</span> {question.why}
                                                    {question.page && (
                                                         <span className="ml-2 font-semibold">
                                                            (Page {question.page})
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {question.hint && !showResults && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => toggleHint(qIndex)}
                                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                                {showHint.includes(qIndex) ? "Hide Hint" : "Show Hint"}
                                            </button>
                                            {showHint.includes(qIndex) && (
                                                <p className="mt-1 p-3 text-sm bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-700 dark:text-yellow-300">
                                                    {question.hint}
                                                </p>
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
                <div className="flex justify-center mt-8">
                    <Submit
                        onClick={handleCheckAnswers}
                        disabled={answeredCount !== questions.length || isChecking}
                        loading={isChecking} // Changed from isLoading
                        primaryColor="green-600" // Changed to a valid color from the allowed types
                        foregroundColor="white" // Example color
                    >
                        {isChecking ? "Checking..." : "Check Answers"}
                    </Submit>
                </div>
            )}
        </div>
    );
}
