"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { decodeQuiz } from "@/utils/share";
import { Submit } from "@/components/submit";
import { FileUpload } from "@/components/file-upload";
import { QuestionList } from "@/components/question-list";
import { GenerateQuestionsParams, Question, QuestionSchema } from "@/types/types";
import { experimental_useObject as useObject } from "ai/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ExpandedTextarea } from "@/components/expanded-textarea";
import { NumberSelector } from "@/components/number-selector";
import { ModeToggle } from "@/components/ModeToggle";
import { GithubIcon } from "lucide-react";
import { ShareQuiz } from "@/components/share-quiz";
import { ExportQuestions } from "@/components/export-questions";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { SystemPromptDialog } from "@/components/system-prompt-dialog";
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { Switch } from "@/components/ui/switch";

// Separate component for quiz content
function QuizContent() {
    const [input, setInput] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [questionType, setQuestionType] = useState<
        "multiple-choice" | "true-false" | "short-answer" | "mixed"
    >("mixed");
    const [questionCount, setQuestionCount] = useState(5);
    const [maxQuestions, setMaxQuestions] = useState(20);
    const [sharedQuiz, setSharedQuiz] = useState<Question[] | null>(null);
    const [optionsCount, setOptionsCount] = useState(4);
    const [systemPrompt, setSystemPrompt] = useState<string>("");
    const [correctAnswersCount, setCorrectAnswersCount] = useState(1);
    const [isRandomCorrectAnswers, setIsRandomCorrectAnswers] = useState(false);
    const [minCorrectAnswers, setMinCorrectAnswers] = useState(1);
    const [maxCorrectAnswers, setMaxCorrectAnswers] = useState(2);
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const router = useRouter();

    const {
        isLoading,
        object: result,
        submit,
        stop,
    } = useObject({
        api: "/api/chat",
        schema: QuestionSchema,
    });

    useEffect(() => {
        const quizParam = searchParams.get("quiz");
        if (quizParam) {
            try {
                const decoded = decodeQuiz(quizParam);
                if (decoded && Array.isArray(decoded) && decoded.length > 0) {
                    const shuffledQuestions = shuffleArray([...decoded]);
                    const updatedShuffledQuestions = shuffledQuestions.map(
                        shuffleMultipleChoiceOptions
                    );
                    setSharedQuiz(updatedShuffledQuestions);
                } else {
                    throw new Error("Invalid quiz data");
                }
            } catch (error) {
                console.error("Error loading shared quiz:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description:
                        "Could not load the shared quiz. The link might be invalid or corrupted.",
                });
            }
        }
    }, [searchParams, toast]);

    const handleSubmit = async () => {

        const generateParams: GenerateQuestionsParams = {
            input,
            fileContent,
            questionType,
            questionCount,
            optionsCount,
            systemPrompt,
            correctAnswersCount,
            isRandomCorrectAnswers,
            minCorrectAnswers,
            maxCorrectAnswers,
            output: result?.questions,
        };
        submit(generateParams);
    };

    const handleStop = () => {
        stop();
    };

    if (sharedQuiz) {
        return (
            <main className="min-h-screen p-8 max-w-2xl mx-auto">
                <div className="flex w-full justify-between items-center mb-8">
                    <button
                        onClick={() => {
                            setSharedQuiz(null);
                            router.push("/");
                        }}
                        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Create New Quiz
                    </button>
                    <ModeToggle />
                </div>
                <h1 className="text-4xl font-bold mb-8 text-center">
                    Shared Quiz
                </h1>
                <QuestionList questions={sharedQuiz} />
            </main>
        );
    }

    return (
        <main className="min-h-screen p-8 max-w-2xl mx-auto">
            <div className="flex w-full justify-between items-center">
                <SystemPromptDialog onPromptChange={setSystemPrompt} />
                <ModeToggle />
            </div>

            <AIDisclaimer />

            <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
                AI-Powered Text To Quiz Generator
            </h1>
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-300">
                Generate quiz questions from any given text using AI.
            </h2>
            <div className="space-y-8">
                <FileUpload onFileContent={setFileContent} />
                <ExpandedTextarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe the topic you want to generate questions about..."
                />
                <div className="space-y-8">
                    <div className="space-y-2">
                        <Label className="text-gray-900 dark:text-gray-100">
                            Question Type
                        </Label>
                        <Select
                            onValueChange={(value) =>
                                setQuestionType(
                                    value as
                                        | "multiple-choice"
                                        | "true-false"
                                        | "short-answer"
                                        | "mixed"
                                )
                            }
                            value={questionType}
                        >
                            <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="multiple-choice">
                                    Multiple Choice
                                </SelectItem>
                                <SelectItem value="true-false">
                                    True/False
                                </SelectItem>
                                <SelectItem value="short-answer">
                                    Short Answer
                                </SelectItem>
                                <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {questionType === "multiple-choice" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-gray-900 dark:text-gray-100">
                                    Number of Options
                                </Label>
                                <NumberSelector
                                    value={optionsCount}
                                    onChange={(value) => {
                                        setOptionsCount(value);
                                        // Ajustar los límites cuando cambia el número de opciones
                                        if (isRandomCorrectAnswers) {
                                            if (maxCorrectAnswers >= value) {
                                                setMaxCorrectAnswers(value - 1);
                                            }
                                            if (minCorrectAnswers >= value) {
                                                setMinCorrectAnswers(value - 1);
                                            }
                                        } else if (correctAnswersCount >= value) {
                                            setCorrectAnswersCount(value - 1);
                                        }
                                    }}
                                    min={2}
                                    max={6}
                                />
                            </div>
                            
                            <div className="space-y-4 border-t pt-4 dark:border-gray-800">
                                <div className="flex justify-between items-center">
                                    <Label className="text-gray-900 dark:text-gray-100">
                                        Correct Answers
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="random-mode" className="text-sm text-gray-600 dark:text-gray-400">
                                            Random Mode
                                        </Label>
                                        <Switch
                                            id="random-mode"
                                            checked={isRandomCorrectAnswers}
                                            onCheckedChange={(checked) => {
                                                setIsRandomCorrectAnswers(checked);
                                                if (checked) {
                                                    setMinCorrectAnswers(correctAnswersCount);
                                                    setMaxCorrectAnswers(Math.min(correctAnswersCount + 1, optionsCount - 1));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {isRandomCorrectAnswers ? (
                                    <div className="space-y-2">
                                        <Label className="text-sm">Correct Answers Range [Min, Max]</Label>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <NumberSelector
                                                value={minCorrectAnswers}
                                                onChange={(value) => {
                                                    setMinCorrectAnswers(value);
                                                    if (value > maxCorrectAnswers) {
                                                        setMaxCorrectAnswers(value);
                                                    }
                                                }}
                                                min={1}
                                                max={optionsCount - 1}
                                            />
                                            <span className="self-center">to</span>
                                            <NumberSelector
                                                value={maxCorrectAnswers}
                                                onChange={(value) => {
                                                    if (value <= optionsCount - 1) {
                                                        setMaxCorrectAnswers(value);
                                                    }
                                                    if (value < minCorrectAnswers) {
                                                        setMinCorrectAnswers(value);
                                                    }
                                                }}
                                                min={minCorrectAnswers}
                                                max={optionsCount - 1}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label className="text-sm">Number of Correct Answers</Label>
                                        <NumberSelector
                                            value={correctAnswersCount}
                                            onChange={setCorrectAnswersCount}
                                            min={1}
                                            max={optionsCount - 1}
                                        />
                                        {correctAnswersCount > 1 && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                Multiple correct answers enabled
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="text-gray-900 dark:text-gray-100">
                            Number of Questions
                        </Label>
                        <NumberSelector
                            value={questionCount}
                            onChange={setQuestionCount}
                            min={1}
                            max={maxQuestions}
                            onMaxChange={setMaxQuestions}
                        />
                    </div>
                </div>
                {isLoading ? (
                    <Submit
                        onClick={handleStop}
                        loading={false}
                        primaryColor="red-600"
                        foregroundColor="white"
                    >
                        Stop Generation
                    </Submit>
                ) : (
                    <Submit
                        onClick={handleSubmit}
                        loading={isLoading}
                        disabled={!input && !fileContent}
                        primaryColor={"black"}
                        foregroundColor={"white"}
                    >
                        Generate Questions
                    </Submit>
                )}
                {result &&
                    Array.isArray(result.questions) &&
                    result.questions.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <ShareQuiz
                                    questions={result.questions as Question[]}
                                    isLoading={isLoading}
                                />
                                <ExportQuestions
                                    questions={result.questions as Question[]}
                                />
                            </div>
                            <QuestionList
                                questions={result.questions as Question[]}
                            />
                        </div>
                    )}
            </div>
            <footer className="mt-12 flex justify-center items-center">
                <a
                    href="https://github.com/Miguel07Alm/text2question"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 shadow-lg"
                >
                    <GithubIcon className="w-6 h-6" />
                    <span className="font-semibold">View on GitHub</span>
                </a>
            </footer>
        </main>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen p-8 max-w-2xl mx-auto">
            <div className="flex w-full justify-end">
                <ModeToggle />
            </div>
            <div className="space-y-8 mt-8">
                <div className="text-center space-y-4">
                    <div className="h-12 w-3/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-8 w-2/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                </div>

                {/* Simulated questions loading */}
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="space-y-4 p-6 border rounded-lg border-gray-200 dark:border-gray-800"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-8 bg-primary/30 rounded animate-pulse" />
                            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        </div>

                        {/* Simulated multiple choice options */}
                        <div className="space-y-3 pl-4 mt-4">
                            {[1, 2, 3, 4].map((j) => (
                                <div
                                    key={j}
                                    className="flex items-center space-x-3"
                                >
                                    <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Simulated progress bar */}
                <div className="relative h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-primary rounded-full animate-[loading_2s_ease-in-out_infinite]" />
                </div>
            </div>
        </div>
    );
}

// Main component with Suspense
export default function Home() {
    return (
        <Suspense fallback={<LoadingState />}>
            <QuizContent />
        </Suspense>
    );
}
