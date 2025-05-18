"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Question, QuestionSchema, GenerateQuestionsParams } from "@/types/types";
import { decodeQuiz } from "@/utils/share";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";
// import { useObject } from 'ai/react'; // Assuming useObject is from Vercel AI SDK - Commented out as it's causing an error
import Link from 'next/link'; // Added import for Link

// UI Components
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Added import for Switch

// Custom Components
import { ModeToggle } from "@/components/ModeToggle";
import { SystemPromptDialog } from "@/components/system-prompt-dialog";
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { FileUpload } from "@/components/file-upload";
import { ExpandedTextarea } from "@/components/expanded-textarea";
import { NumberSelector } from "@/components/number-selector";
import { Submit } from "@/components/submit";
import { RateLimitError } from "@/components/rate-limit-error";
import { ShareQuiz } from "@/components/share-quiz";
import { ExportQuestions } from "@/components/export-questions";
import { QuestionList } from "@/components/question-list";
// Icons from lucide-react
import { BrainCircuit, BookOpen, Wand2, Sparkles, Leaf, Lightbulb, GithubIcon } from "lucide-react";
import { experimental_useObject as useObject } from '@ai-sdk/react';

// Import renamed components
import { InteractiveBackground } from "@/components/interactive-background";
import { DecorativeAccents } from "@/components/decorative-accents";
import { ThemedCard } from "@/components/themed-card";
import { ThemedSectionTitle } from "@/components/themed-section-title";
import { LoadingState } from "@/components/loading-state";



// Separate component for quiz content
function QuizContent() {
  const [input, setInput] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [questionType, setQuestionType] = useState<"multiple-choice" | "true-false" | "short-answer" | "mixed">("mixed");
  const [selectedModel, setSelectedModel] = useState<"deepseek" | "openai">("openai");
  const [questionCount, setQuestionCount] = useState(5);
  const [maxQuestions, setMaxQuestions] = useState(20);
  const [sharedQuiz, setSharedQuiz] = useState<Question[] | null>(null);
  const [optionsCount, setOptionsCount] = useState(4);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [correctAnswersCount, setCorrectAnswersCount] = useState(1);
  const [isRandomCorrectAnswers, setIsRandomCorrectAnswers] = useState(false);
  const [minCorrectAnswers, setMinCorrectAnswers] = useState(1);
  const [maxCorrectAnswers, setMaxCorrectAnswers] = useState(2);
  const [isTimeLimitEnabled, setIsTimeLimitEnabled] = useState(false);
  const [quizTimeLimit, setQuizTimeLimit] = useState(30);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession(); // Get session status
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);
  const [priceInfo, setPriceInfo] = useState<{
    formattedPrice: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');

  const {
    isLoading,
    object: result,
    submit,
    stop,
    error,
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
          const updatedShuffledQuestions = shuffledQuestions.map(shuffleMultipleChoiceOptions);
          setSharedQuiz(updatedShuffledQuestions);
        } else {
          throw new Error("Invalid quiz data");
        }
      } catch (error) {
        console.error("Error loading shared quiz:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load the shared quiz. The link might be invalid or corrupted.",
        });
      }
    }
  }, [searchParams, toast]);
  // Fetch price info on mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch("/api/stripe/price-info");
        if (response.ok) {
          const data = await response.json();
          setPriceInfo({ formattedPrice: data.formattedPrice });
        } else {
          console.error("Failed to fetch price info:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching price info:", error);
      }
    };
    fetchPrice();
  }, []);
  const fetchRemainingGenerations = async () => {
    if (sessionStatus !== "loading") {
      try {
        const response = await fetch("/api/user/credits");
        if (response.ok) {
          const data = await response.json();
          setRemainingGenerations(data.remainingGenerations);
        } else {
          console.error("Failed to fetch remaining generations:", response.statusText);
          setRemainingGenerations(0);
        }
      } catch (error) {
        console.error("Error fetching remaining generations:", error);
        setRemainingGenerations(0);
      }
    }
  };
  useEffect(() => {
    fetchRemainingGenerations();
  }, [sessionStatus]);
  useEffect(() => {
    const paymentSuccess = searchParams.get("payment_success");
    const paymentCancel = searchParams.get("payment_cancel");

    if (paymentSuccess === "true") {
      toast({
        title: "Payment Successful!",
        description: "5 credits have been added to your account.",
        variant: "default", // Or use a specific success variant if defined
      });
      fetchRemainingGenerations(); // Re-fetch credits after successful purchase
      // Remove query params from URL without reload
      router.replace("/", undefined); // Use router.replace
    }
    if (paymentCancel === "true") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment process was cancelled.",
        variant: "destructive", // Or 'default'
      });
      // Remove query params from URL without reload
      router.replace("/", undefined); // Use router.replace
    }
  }, [searchParams, toast, router]); // Add router to dependencies

  const handleSubmit = async () => {
    console.log("Handle submit");
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
      model: selectedModel, // Add model selection
    };
    submit(generateParams);
    setRemainingGenerations(remainingGenerations ? remainingGenerations - 1 : 0);
  };
  // Function to handle purchasing credits
  const handlePurchaseCredits = async () => {
    setIsCheckoutLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout-session", {
        method: "POST",
      });

      const checkoutSession = await response.json();

      if (!response.ok || !checkoutSession.url) {
        console.error("Failed to create checkout session:", checkoutSession);
        toast({
          // Use toast for better UX
          variant: "destructive",
          title: "Payment Error",
          description: checkoutSession.error || "Could not initiate payment.",
        });
        setIsCheckoutLoading(false);
        return;
      }

      window.location.href = checkoutSession.url;
    } catch (err) {
      console.error("Error purchasing credits:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setIsCheckoutLoading(false);
    }
  };

  const handleStop = () => {
    stop();
  };

  if (sharedQuiz) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto relative">
        <InteractiveBackground />
        <DecorativeAccents />
        
        <div className="flex w-full justify-between items-center mb-8">
          <button
            onClick={() => {
              setSharedQuiz(null)
              router.push("/")
            }}
            className="px-6 py-3 rounded-full bg-[hsl(var(--themed-blue))] text-white hover:bg-[hsl(var(--themed-blue))] hover:opacity-90 transition-all shadow-md"
          >
            Create New Quiz
          </button>
          <ModeToggle />
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 text-center relative inline-block">
            <span className="relative z-10">Shared Quiz</span>
            <div className="absolute bottom-0 left-0 h-4 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
          </h1>
          <p className="text-muted-foreground">Answer the questions below to test your knowledge</p>
        </div>
        
        <QuestionList questions={sharedQuiz} />
      </main>
    )
  }

  return (
      <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto relative">
          <InteractiveBackground />
          <DecorativeAccents />
          <div className="flex w-full justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                  <SystemPromptDialog onPromptChange={setSystemPrompt} />
                  {sessionStatus !== "loading" &&
                      remainingGenerations !== null && (
                          <div
                              className="flex items-center gap-1 text-sm text-muted-foreground border px-3 py-1.5 rounded-full shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                              title="Remaining Generations"
                          >
                              <BrainCircuit className="h-4 w-4 text-[hsl(var(--themed-blue))]" />
                              <span className="font-medium">
                                  {remainingGenerations}
                              </span>
                          </div>
                      )}
              </div>
              <ModeToggle />
          </div>
          <AIDisclaimer />
          <div className="text-center mb-12">
              <div className="inline-block relative">
                  <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-center relative z-10">
                      Text2Question
                  </h1>
                  <div className="absolute bottom-1 left-0 h-4 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
              </div>
              <h2 className="text-xl sm:text-2xl font-medium text-center text-gray-700 dark:text-gray-300">
                  Generate quiz questions from any given text using AI.
              </h2>
          </div>
          <div className="mb-8">
              <div className="flex rounded-full p-1 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-sm shadow-inner mb-6">
                  <button
                      onClick={() => setActiveTab("content")}
                      className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
                          activeTab === "content"
                              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                      <span className="flex items-center justify-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>Content</span>
                      </span>
                  </button>
                  <button
                      onClick={() => setActiveTab("settings")}
                      className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
                          activeTab === "settings"
                              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                      <span className="flex items-center justify-center gap-2">
                          <Wand2 className="h-4 w-4" />
                          <span>Quiz Settings</span>
                      </span>
                  </button>
              </div>

              {activeTab === "content" && (
                  <ThemedCard className="mb-6">
                      <ThemedSectionTitle>
                          <span className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-[hsl(var(--themed-blue))]" />
                              AI Model
                          </span>
                      </ThemedSectionTitle>
                      <Select
                          onValueChange={(value) =>
                              setSelectedModel(value as "deepseek" | "openai")
                          }
                          value={selectedModel}
                      >
                          <SelectTrigger className="w-full sm:w-[220px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-[hsl(var(--ghibli-cream))] dark:border-gray-700 rounded-xl">
                              <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="deepseek">
                                  Deepseek Chat
                              </SelectItem>
                              <SelectItem value="openai">
                                  GPT-4o-mini
                              </SelectItem>
                          </SelectContent>
                      </Select>

                      <div className="mt-8">
                          <ThemedSectionTitle>
                              <span className="flex items-center gap-2">
                                  <Leaf className="h-5 w-5 text-[hsl(var(--themed-green))]" />
                                  Your Content
                              </span>
                          </ThemedSectionTitle>
                          <FileUpload onFileContent={setFileContent} />
                          <div className="mt-6">
                              <ExpandedTextarea
                                  value={input}
                                  onChange={(e) => setInput(e.target.value)}
                                  placeholder="Describe the topic you want to generate questions about..."
                              />
                          </div>
                      </div>
                  </ThemedCard>
              )}

              {activeTab === "settings" && (
                  <ThemedCard className="mb-6">
                      <ThemedSectionTitle>
                          <span className="flex items-center gap-2">
                              <Lightbulb className="h-5 w-5 text-[hsl(var(--themed-yellow))]" />
                              Question Settings
                          </span>
                      </ThemedSectionTitle>

                      <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                      <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-[hsl(var(--ghibli-cream))] dark:border-gray-700 rounded-xl">
                                          <SelectValue placeholder="Select question type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="mixed">
                                              Mixed
                                          </SelectItem>
                                          <SelectItem value="multiple-choice">
                                              Multiple Choice
                                          </SelectItem>
                                          <SelectItem value="true-false">
                                              True/False
                                          </SelectItem>
                                          <SelectItem value="short-answer">
                                              Short Answer
                                          </SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-2">
                                  <Label className="text-gray-900 dark:text-gray-100">
                                      Number of Questions
                                  </Label>
                                  <NumberSelector
                                      value={questionCount}
                                      onChange={setQuestionCount}
                                      min={1}
                                      max={maxQuestions}
                                  />
                              </div>
                          </div>

                          {questionType === "multiple-choice" && (
                              <div className="space-y-6 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                  {/* Content for multiple choice settings */}
                                  <div className="space-y-2">
                                      <Label className="text-gray-900 dark:text-gray-100">
                                          Number of Options
                                      </Label>
                                      <NumberSelector
                                          value={optionsCount}
                                          onChange={setOptionsCount}
                                          min={2}
                                          max={6}
                                      />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <Switch
                                          id="random-correct-answers"
                                          checked={isRandomCorrectAnswers}
                                          onCheckedChange={
                                              setIsRandomCorrectAnswers
                                          }
                                      />
                                      <Label
                                          htmlFor="random-correct-answers"
                                          className="text-gray-900 dark:text-gray-100"
                                      >
                                          Randomize Number of Correct Answers
                                      </Label>
                                  </div>
                                  {isRandomCorrectAnswers ? (
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label className="text-gray-900 dark:text-gray-100">
                                                  Min Correct
                                              </Label>
                                              <NumberSelector
                                                  value={minCorrectAnswers}
                                                  onChange={
                                                      setMinCorrectAnswers
                                                  }
                                                  min={1}
                                                  max={optionsCount - 1}
                                              />
                                          </div>
                                          <div className="space-y-2">
                                              <Label className="text-gray-900 dark:text-gray-100">
                                                  Max Correct
                                              </Label>
                                              <NumberSelector
                                                  value={maxCorrectAnswers}
                                                  onChange={
                                                      setMaxCorrectAnswers
                                                  }
                                                  min={minCorrectAnswers}
                                                  max={optionsCount - 1}
                                              />
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="space-y-2">
                                          <Label className="text-gray-900 dark:text-gray-100">
                                              Number of Correct Answers
                                          </Label>
                                          <NumberSelector
                                              value={correctAnswersCount}
                                              onChange={setCorrectAnswersCount}
                                              min={1}
                                              max={optionsCount - 1}
                                          />
                                      </div>
                                  )}
                              </div>
                          )}

                          <div className="space-y-2">
                              <Label className="text-gray-900 dark:text-gray-100">
                                  Quiz Time Limit (minutes)
                              </Label>
                              <div className="flex items-center space-x-2">
                                  <Switch
                                      id="enable-time-limit"
                                      checked={isTimeLimitEnabled}
                                      onCheckedChange={setIsTimeLimitEnabled}
                                  />
                                  <Label
                                      htmlFor="enable-time-limit"
                                      className="text-gray-900 dark:text-gray-100"
                                  >
                                      Enable Time Limit
                                  </Label>
                              </div>
                              {isTimeLimitEnabled && (
                                  <NumberSelector
                                      value={quizTimeLimit}
                                      onChange={setQuizTimeLimit}
                                      min={1}
                                      max={180}
                                  />
                              )}
                          </div>
                      </div>
                  </ThemedCard>
              )}
          </div>{" "}
          {/* This closes the div with className="mb-8" */}
          {isLoading ? (
              <Submit
                  onClick={handleStop}
                  loading={false}
                  primaryColor="red-600"
                  foregroundColor="white"
                  className="themed-button bg-red-500 hover:bg-red-600"
              >
                  Stop Generation
              </Submit>
          ) : (
              <>
                  {error && (
                      <div className="p-4 mb-4 text-sm border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                          <div className="opacity-90">
                              <RateLimitError
                                  error={error}
                                  session={session}
                                  handlePurchaseCredits={handlePurchaseCredits}
                                  isCheckoutLoading={isCheckoutLoading}
                                  priceString={priceInfo?.formattedPrice}
                              />
                          </div>
                      </div>
                  )}
                  <button
                      onClick={handleSubmit}
                      disabled={(!input && !fileContent) || isLoading}
                      className="themed-button w-full py-4 px-6 text-lg font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                              <svg
                                  className="animate-spin h-5 w-5"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                              >
                                  <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                  ></circle>
                                  <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                              </svg>
                              Generating...
                          </span>
                      ) : (
                          <span className="flex items-center justify-center gap-2">
                              <Sparkles className="h-5 w-5" />
                              Generate Questions
                          </span>
                      )}
                  </button>
              </>
          )}
          {result &&
              Array.isArray(result.questions) &&
              result.questions.length > 0 && (
                  <div className="space-y-8 mt-8">
                      <div className="flex justify-between items-center">
                          <ShareQuiz
                              questions={result.questions as Question[]}
                              isLoading={isLoading}
                          />
                          <ExportQuestions
                              questions={result.questions as Question[]}
                          />
                      </div>

                      <ThemedCard className="p-0 overflow-hidden">
                          <div className="p-4 bg-[hsl(var(--ghibli-cream))] dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                  Your Generated Quiz
                              </h3>
                          </div>
                          <div className="p-6">
                              <QuestionList
                                  questions={result.questions as Question[]}
                                  timeLimit={
                                      isTimeLimitEnabled ? quizTimeLimit : null
                                  }
                              />
                          </div>
                      </ThemedCard>
                  </div>
              )}
          <footer className="mt-12 text-center text-sm text-muted-foreground">
              <div className="flex justify-center items-center gap-4 mb-4">
                  <a
                      href="https://github.com/Miguel07Alm/text2question"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 shadow-md text-sm"
                  >
                      <GithubIcon className="w-5 h-5" />
                      <span>View on GitHub</span>
                  </a>
                  <a
                      href="https://buymeacoffee.com/miguelangeyx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF5E5B] hover:bg-[#FF5E5B]/90 text-white transition-colors duration-200 shadow-md text-sm"
                  >
                      <span>☕ Buy me a coffee</span>
                  </a>
              </div>
              <div className="space-x-4">
                  <Link href="/terms-of-service" className="hover:underline">
                      Terms of Service
                  </Link>
                  <span>|</span>
                  <Link href="/privacy-policy" className="hover:underline">
                      Privacy Policy
                  </Link>
              </div>
          </footer>
      </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingState />}>
      <QuizContent />
    </Suspense>
  );
}
