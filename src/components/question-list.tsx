"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/types/types";
import {
    CheckCircle,
    XCircle,
    HelpCircle,
    Check,
    Clock,
    Award,
    BookOpen,
    AlertTriangle,
} from "lucide-react";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";
import confetti from "canvas-confetti";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { Locale } from "@/i18n.config";
import { TranslationLoading } from "./translation-loading";

interface ShortAnswerResult {
    score: number | null;
    reason: string | null;
}

interface QuestionListProps {
    questions: Question[];
    timeLimit?: number | null;
    lang: Locale;
}

export function QuestionList({
    questions: initialQuestions,
    timeLimit = null,
    lang,
}: QuestionListProps) {
    const [dictionary, setDictionary] = useState<any>(null);
    const [questions, setQuestions] = useState(initialQuestions);
    const [selectedAnswers, setSelectedAnswers] = useState<
        (number[] | string | undefined)[]
    >(new Array(questions.length).fill(undefined));
    const [showResults, setShowResults] = useState(false);
    const [showHint, setShowHint] = useState<number[]>([]);
    const [answerResults, setAnswerResults] = useState<boolean[]>(
        new Array(initialQuestions.length).fill(false)
    );
    const [shortAnswerDetails, setShortAnswerDetails] = useState<
        Record<number, ShortAnswerResult>
    >({});
    const [isChecking, setIsChecking] = useState(false);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState<string>("00:00");
    const [timeRemaining, setTimeRemaining] = useState(
        timeLimit ? timeLimit * 60 : 0
    );
    const [isPenalized, setIsPenalized] = useState(false);
    const [autoSubmitWarning, setAutoSubmitWarning] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizMode, setQuizMode] = useState<"all" | "one-by-one">("all");
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuestions(initialQuestions);
    }, [initialQuestions]);

    useEffect(() => {
        const fetchDictionary = async () => {
            const dict = await getDictionary(lang);
            setDictionary(dict);
        };
        fetchDictionary();
    }, [lang]);

    // Shuffle multiple-choice options once at the beginning
    useEffect(() => {
        if (questions.some((q) => q.type === "multiple-choice")) {
            setQuestions((prevQuestions) =>
                prevQuestions.map(shuffleMultipleChoiceOptions)
            );
        }
    }, []);

    useEffect(() => {
        const answered = selectedAnswers.filter((answer) =>
            Array.isArray(answer)
                ? answer.length > 0
                : answer !== undefined && answer !== ""
        ).length;
        setAnsweredCount(answered);
    }, [selectedAnswers]);

    // Start timer when component mounts
    useEffect(() => {
        setStartTime(new Date());
    }, []);

    // Update elapsed time every second
    useEffect(() => {
        if (!timeLimit) return;
        if (!startTime || endTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - startTime.getTime();
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setElapsedTime(
                `${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`
            );

            // Update remaining time
            const remaining = timeLimit * 60 - Math.floor(diff / 1000);
            setTimeRemaining(remaining);

            // Show warning when 60 seconds remain
            if (remaining === 60) {
                setAutoSubmitWarning(true);
            }

            // Auto-submit when time runs out
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
                let currentAnswers = Array.isArray(newAnswers[questionIndex])
                    ? (newAnswers[questionIndex] as number[])
                    : [];
                const isMultipleSelection =
                    (question.correctAnswersCount || 1) > 1;

                if (typeof answer === "number") {
                    if (isMultipleSelection) {
                        if (currentAnswers.includes(answer)) {
                            currentAnswers = currentAnswers.filter(
                                (a) => a !== answer
                            );
                        } else if (
                            currentAnswers.length <
                            (question.correctAnswersCount || 1)
                        ) {
                            currentAnswers = [...currentAnswers, answer].sort(
                                (a, b) => a - b
                            );
                        }
                        newAnswers[questionIndex] = currentAnswers;
                    } else {
                        newAnswers[questionIndex] = [answer];
                    }
                }
            } else if (question.type === "true-false") {
                if (
                    typeof answer === "string" &&
                    ["true", "false"].includes(answer)
                ) {
                    newAnswers[questionIndex] = answer;
                }
            } else if (question.type === "short-answer") {
                if (typeof answer === "string") {
                    newAnswers[questionIndex] = answer;
                }
            }

            return newAnswers;
        });
    };

    const checkShortAnswer = async (
        questionIndex: number,
        userAnswer: string,
        correctAnswer: string
    ): Promise<boolean> => {
        if (!userAnswer || userAnswer.trim() === "") {
            setShortAnswerDetails((prev) => ({
                ...prev,
                [questionIndex]: { score: 0, reason: "No answer provided." },
            }));
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
                setShortAnswerDetails((prev) => ({
                    ...prev,
                    [questionIndex]: {
                        score: null,
                        reason: `API Error: ${response.statusText} - ${errorText}`,
                    },
                }));
                return false;
            }
            const data = await response.json();
            if (data.error) {
                console.error("API Error Message:", data.error);
                setShortAnswerDetails((prev) => ({
                    ...prev,
                    [questionIndex]: {
                        score: null,
                        reason: `API Error: ${data.error}`,
                    },
                }));
                return false;
            }

            const { score, reason } = data as { score: number; reason: string };
            setShortAnswerDetails((prev) => ({
                ...prev,
                [questionIndex]: { score, reason },
            }));
            const isCorrect = score >= 75;
            return isCorrect;
        } catch (error) {
            console.error("Error checking short answer:", error);
            setShortAnswerDetails((prev) => ({
                ...prev,
                [questionIndex]: {
                    score: null,
                    reason: `Client Error: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                },
            }));
            return false;
        }
    };

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

            const selected = (
                Array.isArray(selectedAnswer)
                    ? selectedAnswer
                    : [selectedAnswer]
            ) as (number | undefined)[];
            const validSelected = selected.filter(
                (s) => s !== undefined
            ) as number[];
            validSelected.sort((a, b) => a - b);
            const sortedCorrectAnswers = [...correctAnswers].sort(
                (a, b) => a - b
            );

            return (
                sortedCorrectAnswers.length === validSelected.length &&
                sortedCorrectAnswers.every(
                    (answer, index) => answer === validSelected[index]
                )
            );
        }

        if (question.type === "true-false") {
            const correctAnswerBool =
                typeof question.correctAnswer === "boolean"
                    ? String(question.correctAnswer)
                    : String(question.correctAnswer).toLowerCase();

            return String(selectedAnswer).toLowerCase() === correctAnswerBool;
        }

        if (question.type === "short-answer") {
            return await checkShortAnswer(
                questionIndex,
                String(selectedAnswer),
                String(question.correctAnswer)
            );
        }

        console.warn("Unsupported question type for checking:", question.type);
        return false;
    };

    const handleCheckAnswers = async () => {
        setIsChecking(true);
        setEndTime(new Date());
        setShortAnswerDetails({});

        try {
            const results = await Promise.all(
                questions.map((_, index) => checkAnswer(index))
            );
            setAnswerResults(results);
            setShowResults(true);

            // Trigger confetti if score is good
            const correctCount = results.filter(Boolean).length;
            const percentage = (correctCount / questions.length) * 100;

            if (percentage >= 70) {
                setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                    });
                }, 500);
            }

            // Scroll to results
            setTimeout(() => {
                if (resultsRef.current) {
                    resultsRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }, 100);
        } catch (error) {
            console.error("Error during answer checking:", error);
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
        setSelectedAnswers(new Array(questions.length).fill(undefined));
        setShowResults(false);
        setAnswerResults(new Array(questions.length).fill(false));
        setShowHint([]);
        setShortAnswerDetails({});
        setStartTime(new Date());
        setEndTime(null);
        setElapsedTime("00:00");
        setTimeRemaining(timeLimit ? timeLimit * 60 : 0);
        setIsPenalized(false);
        setAutoSubmitWarning(false);
        setCurrentQuestionIndex(0);
    };

    const getFormattedAnswers = (
        question: Question,
        correctAnswers: number[]
    ) => {
        if (!question.options) return "";

        if (correctAnswers.length === 1) {
            return correctAnswers[0] >= 0 &&
                correctAnswers[0] < question.options.length
                ? question.options[correctAnswers[0]]
                : "Invalid Answer Index";
        }

        return correctAnswers
            .map((index) =>
                index >= 0 && index < question.options!.length
                    ? `• ${question.options![index]}`
                    : "• Invalid Answer Index"
            )
            .join("\n");
    };

    const calculatePercentage = (correct: number, total: number) => {
        if (total === 0) return 0;
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
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const calculateFinalScore = (
        correctCount: number,
        totalQuestions: number
    ) => {
        if (totalQuestions === 0) return 0;
        const baseScore = (correctCount / totalQuestions) * 100;
        let finalScore = baseScore;
        if (isPenalized) {
            finalScore = Math.max(0, baseScore - 10);
        }
        return Math.round(finalScore);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const correctCount = answerResults.filter(Boolean).length;
    const finalScore = calculateFinalScore(correctCount, questions.length);

    // Determine which questions to render based on quiz mode
    const questionsToRender =
        quizMode === "all" ? questions : [questions[currentQuestionIndex]];

    if (!dictionary) {
        // Show loading state or fallback while dictionary is loading
        return <TranslationLoading/>;
    }

    return (
        <div className="space-y-8">
            {/* Quiz Header with Progress and Controls */}
            <div className="sticky top-0 z-10 py-4 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="px-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-[hsl(var(--themed-blue))]" />
                            <h2 className="text-xl font-medium">
                                {showResults
                                    ? dictionary.quiz_results
                                    : dictionary.quiz_questions}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {dictionary.view_mode}
                                    </span>
                                    <div className="flex rounded-full p-0.5 bg-gray-100 dark:bg-gray-800">
                                        <button
                                            onClick={() => setQuizMode("all")}
                                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                quizMode === "all"
                                                    ? "bg-[hsl(var(--themed-blue))] text-white"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                                            {dictionary.all_questions}
                                        </button>
                                        <button
                                            onClick={() =>
                                                setQuizMode("one-by-one")
                                            }
                                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                quizMode === "one-by-one"
                                                    ? "bg-[hsl(var(--themed-blue))] text-white"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                        >
                                            {dictionary.one_by_one}
                                        </button>
                                    </div>
                                </div>
                            

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {dictionary.progress}
                                </span>
                                <span className="text-sm font-medium">
                                    {answeredCount} / {questions.length}
                                </span>
                            </div>

                            {timeLimit && (
                                <div
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border
                  ${
                      timeRemaining <= 60
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                                >
                                    <Clock
                                        className={`h-4 w-4 ${
                                            timeRemaining <= 60
                                                ? "text-red-500 dark:text-red-400"
                                                : ""
                                        }`}
                                    />
                                    <span
                                        className={`text-sm font-mono ${
                                            timeRemaining <= 60
                                                ? "text-red-600 dark:text-red-400"
                                                : ""
                                        }`}
                                    >
                                        {formatTimeRemaining(timeRemaining)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] transition-all duration-500 ease-out"
                            style={{
                                width: `${calculatePercentage(
                                    answeredCount,
                                    questions.length
                                )}%`,
                            }}
                        />
                    </div>

                    {/* Question navigation for one-by-one mode */}
                    {quizMode === "one-by-one" && !showResults && (
                        <div className="flex items-center justify-between mt-3">
                            <button
                                onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="px-3 py-1 text-sm rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                            >
                                {dictionary.previous}
                            </button>
                            <span className="text-sm font-medium">
                                {dictionary.question_of
                                    .replace("{current}", currentQuestionIndex + 1)
                                    .replace("{total}", questions.length)}
                            </span>
                            <button
                                onClick={handleNextQuestion}
                                disabled={
                                    currentQuestionIndex ===
                                    questions.length - 1
                                }
                                className="px-3 py-1 text-sm rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                            >
                                {dictionary.next}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Time limit warning */}
            {timeLimit &&
                autoSubmitWarning &&
                timeRemaining > 0 &&
                !showResults && (
                    <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/70 text-red-600 dark:text-red-300 p-4 rounded-lg shadow-lg z-50 animate-pulse border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            <p className="font-medium">{dictionary.time_remaining_warning}</p>
                        </div>
                        <p className="text-sm mt-1">
                            {dictionary.auto_submit_warning}
                        </p>
                    </div>
                )}

            {/* Results summary */}
            {showResults && (
                <div
                    ref={resultsRef}
                    className="themed-card p-6 border-2 border-[hsl(var(--ghibli-cream))] dark:border-gray-700 bg-gradient-to-br from-white to-[hsl(var(--ghibli-cream))/30] dark:from-gray-800 dark:to-gray-800/50"
                >
                    <h3 className="text-xl font-bold mb-6 text-center relative inline-block">
                        <span className="relative z-10">{dictionary.quiz_results}</span>
                        <div className="absolute bottom-0 left-0 h-3 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center transform transition-transform hover:scale-105">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {dictionary.score}
                            </p>
                            <div className="relative inline-block">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--themed-blue))/20] to-[hsl(var(--themed-green))/20] blur-xl"></div>
                                <p
                                    className={`text-4xl font-bold relative z-10 ${
                                        finalScore >= 70
                                            ? "text-green-600 dark:text-green-400"
                                            : finalScore >= 40
                                            ? "text-yellow-600 dark:text-yellow-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}
                                >
                                    {finalScore}%
                                </p>
                            </div>
                            {finalScore >= 70 && (
                                <Award className="h-6 w-6 mx-auto mt-2 text-yellow-500" />
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center transform transition-transform hover:scale-105">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {dictionary.correct_answers}
                            </p>
                            <p className="text-4xl font-bold text-[hsl(var(--themed-blue))]">
                                {correctCount}{" "}
                                <span className="text-lg text-gray-400 dark:text-gray-500">
                                    / {questions.length}
                                </span>
                            </p>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] h-2.5 rounded-full"
                                    style={{
                                        width: `${
                                            (correctCount / questions.length) *
                                            100
                                        }%`,
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center transform transition-transform hover:scale-105">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {dictionary.time_spent}
                            </p>
                            <p className="text-4xl font-bold text-[hsl(var(--themed-forest))]">
                                {formatTimeSpent(startTime, endTime)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {isPenalized
                                    ? dictionary.time_limit_exceeded
                                    : dictionary.completed_in_time}
                            </p>
                        </div>
                    </div>

                    {isPenalized && (
                        <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center">
                            <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                            <span>
                                {dictionary.penalty_applied}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleRetakeQuiz}
                            className="px-6 py-3 bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] text-white rounded-full hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"
                                    fill="currentColor"
                                />
                            </svg>
                            {dictionary.retake_quiz}
                        </button>
                    </div>
                </div>
            )}

            {/* Questions */}
            <div className="space-y-6">
                {questionsToRender.map((question, qIndex) => {
                    // For one-by-one mode, adjust the index
                    const actualIndex =
                        quizMode === "one-by-one"
                            ? currentQuestionIndex
                            : qIndex;

                    return (
                        <div
                            key={actualIndex}
                            className={`p-6 rounded-xl border-2 transition-all duration-300 shadow-sm
                ${
                    showResults
                        ? answerResults[actualIndex]
                            ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
                            : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                        : "border-[hsl(var(--ghibli-cream))] dark:border-gray-700 bg-white dark:bg-gray-800"
                }
                ${quizMode === "one-by-one" ? "animate-fadeIn" : ""}
              `}
                        >
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--themed-blue))] text-white font-medium">
                                    {actualIndex + 1}
                                </div>

                                <div className="space-y-4 flex-1">
                                    {question && (
                                        <>
                                            <h3 className="text-lg font-medium">
                                                {question.question}
                                            </h3>

                                            <div className="space-y-3">
                                                {question.type ===
                                                    "multiple-choice" && (
                                                    <>
                                                        {question.correctAnswersCount &&
                                                            question.correctAnswersCount >
                                                                1 && (
                                                                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg border border-blue-100 dark:border-blue-900">
                                                                    <div className="flex-1">
                                                                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                                            {dictionary.multiple_selection_required}
                                                                        </h4>
                                                                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                                                            {dictionary.select_n_answers.replace("{count}", question.correctAnswersCount)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        <div className="grid gap-3">
                                                            {question.options?.map(
                                                                (
                                                                    option,
                                                                    oIndex
                                                                ) => {
                                                                    const isSelected =
                                                                        Array.isArray(
                                                                            selectedAnswers[
                                                                                actualIndex
                                                                            ]
                                                                        ) &&
                                                                        (
                                                                            selectedAnswers[
                                                                                actualIndex
                                                                            ] as number[]
                                                                        ).includes(
                                                                            oIndex
                                                                        );
                                                                    const isMultiple =
                                                                        (question.correctAnswersCount ||
                                                                            1) >
                                                                        1;
                                                                    const isDisabled =
                                                                        showResults ||
                                                                        (!isSelected &&
                                                                            isMultiple &&
                                                                            Array.isArray(
                                                                                selectedAnswers[
                                                                                    actualIndex
                                                                                ]
                                                                            ) &&
                                                                            (
                                                                                selectedAnswers[
                                                                                    actualIndex
                                                                                ] as number[]
                                                                            )
                                                                                .length >=
                                                                                (question.correctAnswersCount ||
                                                                                    1));

                                                                    // Determine if this option is correct (only for results view)
                                                                    const isCorrectOption =
                                                                        showResults &&
                                                                        Array.isArray(
                                                                            question.correctAnswer
                                                                        ) &&
                                                                        question.correctAnswer.includes(
                                                                            oIndex
                                                                        );

                                                                    return (
                                                                        <button
                                                                            key={
                                                                                oIndex
                                                                            }
                                                                            onClick={() =>
                                                                                handleSelect(
                                                                                    actualIndex,
                                                                                    oIndex
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isDisabled
                                                                            }
                                                                            className={`
                                      relative w-full p-4 text-left transition-all rounded-xl
                                      ${
                                          isDisabled
                                              ? "opacity-70 cursor-not-allowed"
                                              : "hover:transform hover:scale-[1.01]"
                                      }
                                      ${
                                          showResults && isCorrectOption
                                              ? "ring-2 ring-green-500 dark:ring-green-400"
                                              : ""
                                      }
                                      group
                                    `}
                                                                        >
                                                                            <div
                                                                                className={`
                                        absolute inset-0 rounded-xl transition-all duration-200
                                        ${
                                            isSelected
                                                ? isMultiple
                                                    ? "border-2 border-[hsl(var(--themed-blue))] bg-[hsl(var(--themed-blue))]/10 dark:border-[hsl(var(--themed-blue))] dark:bg-[hsl(var(--themed-blue))]/20"
                                                    : "bg-[hsl(var(--themed-blue))] dark:bg-[hsl(var(--themed-blue))]"
                                                : "border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        }
                                        ${
                                            showResults && isCorrectOption
                                                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                                                : ""
                                        }
                                      `}
                                                                            />

                                                                            <div className="relative flex items-center gap-3">
                                                                                <div
                                                                                    className={`
                                          flex items-center justify-center w-5 h-5 border rounded-md
                                          ${
                                              isSelected
                                                  ? isMultiple
                                                      ? "bg-[hsl(var(--themed-blue))] border-[hsl(var(--themed-blue))] text-white"
                                                      : "bg-[hsl(var(--themed-blue))] border-[hsl(var(--themed-blue))] text-white"
                                                  : "border-gray-300 dark:border-gray-600 text-transparent"
                                          }
                                          transition-colors
                                        `}
                                                                                >
                                                                                    <Check className="w-3 h-3" />
                                                                                </div>

                                                                                <span
                                                                                    className={`
                                          flex-1 text-sm
                                          ${
                                              isSelected
                                                  ? isMultiple
                                                      ? "font-medium text-gray-900 dark:text-white"
                                                      : "font-medium text-white dark:text-white"
                                                  : "font-normal text-gray-700 dark:text-gray-300"
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
                                                    </>
                                                )}

                                                {question.type ===
                                                    "true-false" && (
                                                    <div className="flex gap-3">
                                                        {[true, false].map(
                                                            (value) => {
                                                                const isSelected =
                                                                    selectedAnswers[
                                                                        actualIndex
                                                                    ] ===
                                                                    String(
                                                                        value
                                                                    );
                                                                // Determine if this option is correct (only for results view)
                                                                const isCorrectOption =
                                                                    showResults &&
                                                                    String(
                                                                        question.correctAnswer
                                                                    ).toLowerCase() ===
                                                                        String(
                                                                            value
                                                                        ).toLowerCase();

                                                                return (
                                                                    <button
                                                                        key={String(
                                                                            value
                                                                        )}
                                                                        onClick={() =>
                                                                            handleSelect(
                                                                                actualIndex,
                                                                                String(
                                                                                    value
                                                                                )
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            showResults
                                                                        }
                                                                        className={`
                                    flex-1 p-4 rounded-xl border-2 text-center transition-all relative overflow-hidden
                                    ${
                                        isSelected
                                            ? "border-[hsl(var(--themed-blue))] bg-[hsl(var(--themed-blue))] text-white"
                                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    }
                                    ${
                                        showResults && isCorrectOption
                                            ? "ring-2 ring-green-500 dark:ring-green-400"
                                            : ""
                                    }
                                    ${
                                        showResults
                                            ? "cursor-not-allowed opacity-80"
                                            : "hover:border-[hsl(var(--themed-blue))] hover:bg-[hsl(var(--themed-blue))]/10"
                                    }
                                  `}
                                                                    >
                                                                        {/* Decorative background for selected state */}
                                                                        {isSelected && (
                                                                            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-forest))]"></div>
                                                                        )}

                                                                        {/* Content */}
                                                                        <div className="relative z-10 flex items-center justify-center gap-2">
                                                                            {isSelected && (
                                                                                <Check className="w-4 h-4" />
                                                                            )}
                                                                            <span className="font-medium">
                                                                                {String(
                                                                                    value
                                                                                )
                                                                                    .charAt(
                                                                                        0
                                                                                    )
                                                                                    .toUpperCase() +
                                                                                    String(
                                                                                        value
                                                                                    ).slice(
                                                                                        1
                                                                                    )}
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                )}

                                                {question.type ===
                                                    "short-answer" && (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={
                                                                (selectedAnswers[
                                                                    actualIndex
                                                                ] as string) ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleSelect(
                                                                    actualIndex,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                showResults
                                                            }
                                                            placeholder="Type your answer here..."
                                                            className={`
                                w-full p-4 rounded-xl border-2 bg-white dark:bg-gray-800 
                                ${
                                    showResults
                                        ? "border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                        : "border-[hsl(var(--ghibli-cream))] dark:border-gray-700 focus:border-[hsl(var(--themed-blue))] focus:ring-2 focus:ring-[hsl(var(--themed-blue))]/30"
                                }
                                outline-none transition-colors
                              `}
                                                        />

                                                        {/* Character counter */}
                                                        {!showResults && (
                                                            <div className="flex justify-end">
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {
                                                                        (
                                                                            (selectedAnswers[
                                                                                actualIndex
                                                                            ] as string) ||
                                                                            ""
                                                                        ).length
                                                                    }{" "}
                                                                    characters
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Results feedback */}
                                            {showResults && (
                                                <div
                                                    className={`
                            mt-4 p-4 rounded-lg border 
                            ${
                                answerResults[actualIndex]
                                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                            }
                          `}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {answerResults[
                                                            actualIndex
                                                        ] ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                        )}
                                                        <span
                                                            className={`font-medium ${
                                                                answerResults[
                                                                    actualIndex
                                                                ]
                                                                    ? "text-green-700 dark:text-green-300"
                                                                    : "text-red-700 dark:text-red-300"
                                                            }`}
                                                        >
                                                            {answerResults[
                                                                actualIndex
                                                            ]
                                                                ? "Correct"
                                                                : "Incorrect"}
                                                            {question.type ===
                                                                "short-answer" &&
                                                                shortAnswerDetails[
                                                                    actualIndex
                                                                ]?.score !==
                                                                    null && (
                                                                    <span className="ml-2 text-sm font-normal">
                                                                        (
                                                                        {
                                                                            shortAnswerDetails[
                                                                                actualIndex
                                                                            ]
                                                                                ?.score
                                                                        }
                                                                        %)
                                                                    </span>
                                                                )}
                                                        </span>
                                                    </div>

                                                    {/* API reason for short answers */}
                                                    {question.type ===
                                                        "short-answer" &&
                                                        shortAnswerDetails[
                                                            actualIndex
                                                        ]?.reason && (
                                                            <p className="text-sm mb-2 italic text-gray-600 dark:text-gray-400">
                                                                {
                                                                    shortAnswerDetails[
                                                                        actualIndex
                                                                    ]?.reason
                                                                }
                                                            </p>
                                                        )}

                                                    {/* Show correct answer for incorrect responses */}
                                                    {!answerResults[
                                                        actualIndex
                                                    ] &&
                                                        question.type !==
                                                            "short-answer" && (
                                                            <div className="text-sm space-y-1 mb-2">
                                                                {question.type ===
                                                                    "multiple-choice" &&
                                                                    Array.isArray(
                                                                        question.correctAnswer
                                                                    ) && (
                                                                        <p>
                                                                            <span className="font-medium">
                                                                                Correct
                                                                                Answer(s):
                                                                            </span>
                                                                            <br />
                                                                            <span className="whitespace-pre-wrap">
                                                                                {getFormattedAnswers(
                                                                                    question,
                                                                                    question.correctAnswer as number[]
                                                                                )}
                                                                            </span>
                                                                        </p>
                                                                    )}
                                                                {question.type ===
                                                                    "true-false" && (
                                                                    <p>
                                                                        <span className="font-medium">
                                                                            Correct
                                                                            Answer:
                                                                        </span>{" "}
                                                                        {String(
                                                                            question.correctAnswer
                                                                        )}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                    {/* Explanation */}
                                                    {question.why && (
                                                        <div
                                                            className={`text-sm ${
                                                                !answerResults[
                                                                    actualIndex
                                                                ] ||
                                                                question.type ===
                                                                    "short-answer"
                                                                    ? "mt-2 pt-2 border-t border-gray-200 dark:border-gray-700"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-1">
                                                                <span className="font-medium">
                                                                    Explanation:
                                                                </span>
                                                                <span>
                                                                    {
                                                                        question.why
                                                                    }
                                                                </span>
                                                            </div>
                                                            {question.page && (
                                                                <div className="mt-1 inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                                                    Page{" "}
                                                                    {
                                                                        question.page
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Hint toggle */}
                                            {question.hint && !showResults && (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={() =>
                                                            toggleHint(
                                                                actualIndex
                                                            )
                                                        }
                                                        className="flex items-center gap-1 text-sm text-[hsl(var(--themed-blue))] hover:text-[hsl(var(--themed-blue))]/80"
                                                    >
                                                        <HelpCircle className="w-4 h-4" />
                                                        {showHint.includes(
                                                            actualIndex
                                                        )
                                                            ? "Hide Hint"
                                                            : "Show Hint"}
                                                    </button>
                                                    {showHint.includes(
                                                        actualIndex
                                                    ) && (
                                                        <div className="mt-2 p-3 text-sm bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300">
                                                            <div className="flex gap-2">
                                                                <svg
                                                                    width="16"
                                                                    height="16"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="flex-shrink-0 mt-0.5"
                                                                >
                                                                    <path
                                                                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                                                                        fill="currentColor"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    {
                                                                        question.hint
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Check answers button */}
            {!showResults && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleCheckAnswers}
                        disabled={
                            answeredCount !== questions.length || isChecking
                        }
                        className={`
              px-8 py-4 rounded-full font-medium text-white shadow-lg transition-all
              ${
                  answeredCount === questions.length
                      ? "bg-gradient-to-r from-[hsl(var(--themed-blue))] to-[hsl(var(--themed-green))] hover:opacity-90 transform hover:scale-105"
                      : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70"
              }
              flex items-center gap-2
            `}
                    >
                        {isChecking ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <CheckCircle className="h-5 w-5" />
                        )}
                        {dictionary.check_answers}
                    </button>
                </div>
            )}

            {/* Unanswered questions warning */}
            {!showResults && answeredCount < questions.length && (
                <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-2">
                    Please answer all {questions.length} questions before
                    checking.
                </p>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
