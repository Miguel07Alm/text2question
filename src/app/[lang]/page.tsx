"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Question, QuestionSchema, GenerateQuestionsParams, Model } from "@/types/types";
import { decodeQuiz } from "@/utils/share";
import { shuffleArray, shuffleMultipleChoiceOptions } from "@/utils/array";
// import { useObject } from 'ai/react'; // Assuming useObject is from Vercel AI SDK - Commented out as it's causing an error
import Link from 'next/link'; // Added import for Link

// UI Components
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Added import for Switch
import { Button } from "@/components/ui/button"; // Assuming Button is used or can be added
import { Input } from "@/components/ui/input"; // Assuming Input is used or can be added

// Icons from lucide-react
import { Sparkles, GithubIcon, BookOpen, Wand2, Lightbulb, HeartIcon, FileText, Settings, Brain, CheckCircle, XCircle, Clock, Calendar, Users, MessageSquare, Download, Share2, Trash2, Edit3, PlusCircle, MinusCircle, AlertTriangle, Info, Copy, ExternalLink, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, EyeOff, Filter, ListChecks, Palette, Moon, Sun, Menu, X, Search, UploadCloud, Zap, ThumbsUp, ThumbsDown, Repeat, RotateCcw, Save, SlidersHorizontal, Terminal, UserCircle, Bot, BrainCircuit, Leaf } from 'lucide-react';
import { getDictionary } from "./dictionaries";
import { Locale } from "@/i18n.config";
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { AIDisclaimer } from "@/components/ai-disclaimer";
import { DecorativeAccents } from "@/components/decorative-accents";
import { ExpandedTextarea } from "@/components/expanded-textarea";
import { ExportQuestions } from "@/components/export-questions";
import { FileUpload } from "@/components/file-upload";
import { InteractiveBackground } from "@/components/interactive-background";
import { LoadingState } from "@/components/loading-state";
import { ModeToggle } from "@/components/ModeToggle";
import { NumberSelector } from "@/components/number-selector";
import { QuestionList } from "@/components/question-list";
import { RateLimitError } from "@/components/rate-limit-error";
import { ShareQuiz } from "@/components/share-quiz";
import { Submit } from "@/components/submit";
import { ThemedCard } from "@/components/themed-card";
import { ThemedSectionTitle } from "@/components/themed-section-title";


// Separate component for quiz content
function QuizContent() {
    const { lang } = useParams();
    const [dictionary, setDictionary] = useState<any>(null);
    const [translationLoading, setTranslationLoading] = useState(true);

    useEffect(() => {
        const fetchDict = async () => {
            if (lang) {
                const d = await getDictionary(lang as Locale);
                setDictionary(d);
                setTranslationLoading(false);
            } else {
                // Fallback or error handling if lang is not available
                const d = await getDictionary('en'); // Default to 'en' or handle error
                setDictionary(d);
                setTranslationLoading(false);
            }
        };
        fetchDict();
    }, [lang]);

  const [input, setInput] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [questionType, setQuestionType] = useState<"multiple-choice" | "true-false" | "short-answer" | "mixed">("mixed");
  const [selectedModel, setSelectedModel] = useState<Model>("gemini-2.0-flash");
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
        title: dictionary?.payment_successful_title || "Payment Successful!",
        description: dictionary?.payment_successful_description || "5 credits have been added to your account.",
        variant: "default", // Or use a specific success variant if defined
      });
      fetchRemainingGenerations(); // Re-fetch credits after successful purchase
      // Remove query params from URL without reload
      router.replace(`/${lang}`, undefined); // Use router.replace, ensure lang is included
    }
    if (paymentCancel === "true") {
      toast({
        title: dictionary?.payment_cancelled_title || "Payment Cancelled",
        description: dictionary?.payment_cancelled_description || "Your payment process was cancelled.",
        variant: "destructive", // Or 'default'
      });
      // Remove query params from URL without reload
      router.replace(`/${lang}`, undefined); // Use router.replace, ensure lang is included
    }
  }, [searchParams, toast, router, lang, dictionary]); // Add lang and dictionary to dependencies

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
          title: dictionary?.payment_error_title || "Payment Error",
          description: checkoutSession.error || dictionary?.payment_initiate_error || "Could not initiate payment.",
        });
        setIsCheckoutLoading(false);
        return;
      }

      window.location.href = checkoutSession.url;
    } catch (err) {
      console.error("Error purchasing credits:", err);
      toast({
        variant: "destructive",
        title: dictionary?.error_title || "Error",
        description: dictionary?.unexpected_error_description || "An unexpected error occurred. Please try again.",
      });
      setIsCheckoutLoading(false);
    }
  };

  const handleStop = () => {
    stop();
  };


  if (!dictionary) {
    return <LoadingState />;
  }

  if (sharedQuiz) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto relative">
        <InteractiveBackground />
        <DecorativeAccents />
        
        <div className="flex w-full justify-between items-center mb-8">
          <button
            onClick={() => {
              setSharedQuiz(null)
              router.push(`/${lang}`)
            }}
            className="px-6 py-3 rounded-full bg-[hsl(var(--themed-blue))] text-white hover:bg-[hsl(var(--themed-blue))] hover:opacity-90 transition-all shadow-md"
          >
            {dictionary.create_new_quiz_button}
          </button>
          <ModeToggle />
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 text-center relative inline-block">
            <span className="relative z-10">{dictionary.shared_quiz_title}</span>
            <div className="absolute bottom-0 left-0 h-4 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
          </h1>
          <p className="text-muted-foreground">{dictionary.shared_quiz_description}</p>
        </div>
        
        <QuestionList questions={sharedQuiz} lang={lang?.toString() as Locale ?? "en"} />
      </main>
    )
  }

  return (
      <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto relative">
          <InteractiveBackground />
          <DecorativeAccents />
          <div className="flex w-full justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                  {sessionStatus !== "loading" &&
                      remainingGenerations !== null && (
                          <div
                              className="flex items-center gap-1 text-sm text-muted-foreground border px-3 py-1.5 rounded-full shadow-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                              title={dictionary.remaining_generations_tooltip}
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
                      {dictionary.app_title}
                  </h1>
                  <div className="absolute bottom-1 left-0 h-4 w-full bg-[hsl(var(--themed-yellow))] opacity-30 -z-0 rounded-full"></div>
              </div>
              <h2 className="text-xl sm:text-2xl font-medium text-center text-gray-700 dark:text-gray-300">
                  {dictionary.app_subtitle}
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
                          <span>{dictionary.tab_content}</span>
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
                          <span>{dictionary.tab_quiz_settings}</span>
                      </span>
                  </button>
              </div>

              {activeTab === "content" && (
                  <ThemedCard className="mb-6">
                      <ThemedSectionTitle>
                          <span className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-[hsl(var(--themed-blue))]" />
                              {dictionary.ai_model_title}
                          </span>
                      </ThemedSectionTitle>
                      <Select
                          onValueChange={(value) =>
                              setSelectedModel(value as Model)
                          }
                          value={selectedModel}
                      >
                          <SelectTrigger className="w-full sm:w-[220px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-[hsl(var(--ghibli-cream))] dark:border-gray-700 rounded-xl">
                              <SelectValue
                                  placeholder={
                                      dictionary.select_model_placeholder
                                  }
                              />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="gemini-2.0-flash">
                                  Gemini 2.0 Flash
                              </SelectItem>
                              <SelectItem value="deepseek-chat">
                                  Deepseek Chat
                              </SelectItem>
                              <SelectItem value="gpt-4o-mini">
                                  GPT-4o-mini
                              </SelectItem>
                          </SelectContent>
                      </Select>

                      <div className="mt-8">
                          <ThemedSectionTitle>
                              <span className="flex items-center gap-2">
                                  <Leaf className="h-5 w-5 text-[hsl(var(--themed-green))]" />
                                  {dictionary.your_content_title}
                              </span>
                          </ThemedSectionTitle>
                          <FileUpload
                              onFileContent={setFileContent}
                              dictionary={dictionary}
                          />
                          <div className="mt-6">
                              <ExpandedTextarea
                                  value={input}
                                  onChange={(e) => setInput(e.target.value)}
                                  placeholder={dictionary.content_placeholder}
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
                              {dictionary.question_settings_title}
                          </span>
                      </ThemedSectionTitle>

                      <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <Label className="text-gray-900 dark:text-gray-100">
                                      {dictionary.question_type_label}
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
                                          <SelectValue
                                              placeholder={
                                                  dictionary.select_question_type_placeholder
                                              }
                                          />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="mixed">
                                              {dictionary.q_type_mixed}
                                          </SelectItem>
                                          <SelectItem value="multiple-choice">
                                              {
                                                  dictionary.q_type_multiple_choice
                                              }
                                          </SelectItem>
                                          <SelectItem value="true-false">
                                              {dictionary.q_type_true_false}
                                          </SelectItem>
                                          <SelectItem value="short-answer">
                                              {dictionary.q_type_short_answer}
                                          </SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>

                              <div className="space-y-2">
                                  <Label className="text-gray-900 dark:text-gray-100">
                                      {dictionary.number_of_questions_label}
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
                                          {dictionary.mc_options_count_label}
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
                                          {dictionary.mc_random_correct_label}
                                      </Label>
                                  </div>
                                  {isRandomCorrectAnswers ? (
                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                              <Label className="text-gray-900 dark:text-gray-100">
                                                  {
                                                      dictionary.mc_min_correct_label
                                                  }
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
                                                  {
                                                      dictionary.mc_max_correct_label
                                                  }
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
                                              {
                                                  dictionary.mc_correct_count_label
                                              }
                                          </Label>
                                          <NumberSelector
                                              value={correctAnswersCount}
                                              onChange={setCorrectAnswersCount}
                                              min={1}
                                              max={optionsCount - 1}
                                          />
                                      </div>
                                  )}
                                  <div className="flex items-center space-x-2 pt-4">
                                      <Switch
                                          id="time-limit"
                                          checked={isTimeLimitEnabled}
                                          onCheckedChange={
                                              setIsTimeLimitEnabled
                                          }
                                      />
                                      <Label
                                          htmlFor="time-limit"
                                          className="text-gray-900 dark:text-gray-100"
                                      >
                                          {dictionary.enable_time_limit_label}
                                      </Label>
                                  </div>
                                  {isTimeLimitEnabled && (
                                      <div className="space-y-2">
                                          <Label className="text-gray-900 dark:text-gray-100">
                                              {dictionary.quiz_time_limit_label}
                                          </Label>
                                          <NumberSelector
                                              value={quizTimeLimit}
                                              onChange={setQuizTimeLimit}
                                              min={1}
                                              max={180} // Example max, adjust as needed
                                          />
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </ThemedCard>
              )}
          </div>{" "}
          {/* This closes the div with className="mb-8" */}
          <div className="mt-12 mb-8">
              {isLoading ? (
                  <Submit
                      onClick={handleStop}
                      loading={false} // The button itself is not in a loading state
                      primaryColor="red-600"
                      foregroundColor="white"
                      className="themed-button w-full py-4 px-6 text-lg font-medium rounded-xl bg-red-500 hover:bg-red-600"
                  >
                      {dictionary?.stop_generation_button || "Stop Generation"}
                  </Submit>
              ) : (
                  <>
                      {error && (
                          <div className="p-4 mb-4 text-sm border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                              <div className="opacity-90">
                                  <RateLimitError
                                      error={error}
                                      session={session}
                                      handlePurchaseCredits={
                                          handlePurchaseCredits
                                      }
                                      isCheckoutLoading={isCheckoutLoading}
                                      priceString={priceInfo?.formattedPrice}
                                      dictionary={dictionary}
                                  />
                              </div>
                          </div>
                      )}
                      <button
                          onClick={handleSubmit}
                          disabled={(!input && !fileContent) || isLoading} // isLoading will be false here
                          className="themed-button w-full py-4 px-6 text-lg font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <span className="flex items-center justify-center gap-2">
                              <Sparkles className="h-5 w-5" />
                              {dictionary?.generate_questions_button ||
                                  "Generate Questions"}
                          </span>
                      </button>
                  </>
              )}

              {/* "No generations left" and "Buy credits" messages */}
              {sessionStatus !== "authenticated" &&
                  remainingGenerations === 0 && (
                      <p className="text-center text-sm text-red-500 mt-4">
                          {dictionary?.no_generations_left_guest}
                      </p>
                  )}
              {sessionStatus === "authenticated" &&
                  remainingGenerations === 0 &&
                  priceInfo && (
                      <div className="text-center mt-4">
                          <p className="text-sm text-red-500 mb-2">
                              {dictionary?.no_generations_left_auth}
                          </p>
                          <button
                              onClick={handlePurchaseCredits}
                              disabled={isCheckoutLoading}
                              className="px-6 py-3 rounded-full bg-[hsl(var(--themed-blue))] text-white hover:bg-[hsl(var(--themed-blue))] hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                          >
                              {isCheckoutLoading
                                  ? dictionary?.loading_button
                                  : dictionary?.buy_credits_button?.replace(
                                        "{price}",
                                        priceInfo.formattedPrice
                                    ) ||
                                    `Buy Credits (${priceInfo.formattedPrice})`}
                          </button>
                      </div>
                  )}
          </div>
          {error &&
              !isLoading && ( // General error display, only if not loading (as RateLimitError handles errors when !isLoading)
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
                      <p className="font-semibold mb-1">
                          {dictionary.error_title}
                      </p>
                      <p>
                          {error.message ||
                              dictionary.unexpected_error_description}
                      </p>
                  </div>
              )}
          {result?.questions && result.questions.length > 0 && (
              <div className="mt-12">
                  <ThemedSectionTitle>
                      <span className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-[hsl(var(--themed-yellow))]" />
                          {dictionary.your_generated_quiz_title}
                      </span>
                  </ThemedSectionTitle>
                  <div className="flex justify-end gap-2 mb-4">
                      <ShareQuiz
                          questions={result.questions as Question[]}
                          lang={(lang?.toString() as Locale) ?? "en"}
                          dictionary={dictionary}
                          isLoading={isLoading}
                      />
                      <ExportQuestions
                          questions={result.questions as Question[]}
                          dictionary={dictionary}
                      />
                  </div>
                  <QuestionList
                      questions={result.questions as Question[]}
                      lang={(lang?.toString() as Locale) ?? "en"}
                  />
              </div>
          )}
          <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                  <a
                      href="https://github.com/miguel07alm/text2question"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-[hsl(var(--themed-blue))] transition-colors"
                  >
                      <GithubIcon className="h-5 w-5" />
                      {dictionary?.view_on_github_button}
                  </a>
                  <a
                      href="https://buymeacoffee.com/miguelangeyx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-yellow-500 transition-colors"
                  >
                      <HeartIcon className="h-5 w-5" />{" "}
                      {/* Assuming HeartIcon for buymeacoffee */}
                      {dictionary?.buy_me_a_coffee_button}
                  </a>
              </div>
              <div className="space-x-4 mb-2">
                  <Link
                      href={`/${lang}/terms-of-service`}
                      className="hover:underline"
                  >
                      {dictionary.terms_of_service_link}
                  </Link>
                  <Link
                      href={`/${lang}/privacy-policy`}
                      className="hover:underline"
                  >
                      {dictionary.privacy_policy_link}
                  </Link>
              </div>
              <p>
                  &copy; {new Date().getFullYear()} Text2Question.{" "}
                  {dictionary.all_rights_reserved}
              </p>
          </footer>
      </main>
  );
}

// Suspense Boundary for the main content
export default function Page() {
    return (
        <Suspense fallback={<LoadingState />}> {/* Removed text prop if LoadingState doesn't accept it */}
            <QuizContent />
        </Suspense>
    );
}
