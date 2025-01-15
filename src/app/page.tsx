'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { decodeQuiz } from '@/utils/share'
import { Submit } from '@/components/submit'
import { FileUpload } from '@/components/file-upload'
import { QuestionList } from '@/components/question-list'
import { Question, QuestionSchema } from '@/types/types'
import { experimental_useObject as useObject } from "ai/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ExpandedTextarea } from '@/components/expanded-textarea'
import { NumberSelector } from '@/components/number-selector'
import { ModeToggle } from '@/components/ModeToggle'
import { GithubIcon } from 'lucide-react'
import { ShareQuiz } from '@/components/share-quiz'
import { ExportQuestions } from '@/components/export-questions'

export default function Home() {
  const [input, setInput] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false' | 'short-answer' | 'mixed'>('mixed')
  const [questionCount, setQuestionCount] = useState(5)
  const [maxQuestions, setMaxQuestions] = useState(20)
  const [sharedQuiz, setSharedQuiz] = useState<Question[] | null>(null);
  const searchParams = useSearchParams();

  const { isLoading, object: result, submit, stop } = useObject({
      api: "/api/chat",
      schema: QuestionSchema,
  });

  useEffect(() => {
    const quizParam = searchParams.get('quiz');
    if (quizParam) {
        console.log("Raw quiz param:", quizParam);
        const decoded = decodeQuiz(quizParam);
        console.log("Decoded quiz:", decoded);
        if (decoded && Array.isArray(decoded) && decoded.length > 0) {
            setSharedQuiz(decoded);
        } else {
            console.error("Invalid decoded quiz data");
            // Opcional: mostrar un mensaje de error al usuario
        }
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    submit({ input, fileContent, questionType, questionCount })
  }

  const handleStop = () => {
    stop()
  }

  if (sharedQuiz) {
    return (
        <main className="min-h-screen p-8 max-w-2xl mx-auto">
            <div className="flex w-full justify-between items-center mb-8">
                <button 
                    onClick={() => setSharedQuiz(null)}
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
          <div className="flex w-full justify-end">
              <ModeToggle />
          </div>
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
              Text2Question AI Generator
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
              <div className="space-y-6">
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
                  <Submit onClick={handleStop} loading={false}>
                      Stop Generation
                  </Submit>
              ) : (
                  <Submit
                      onClick={handleSubmit}
                      loading={isLoading}
                      disabled={!input && !fileContent}
                  >
                      Generate Questions
                  </Submit>
              )}
              {result &&
                  Array.isArray(result.questions) &&
                  result.questions.length > 0 && (
                      <div className="space-y-8">
                          <div className="flex justify-between items-center">
                              <ShareQuiz questions={result.questions as Question[]} />
                              <ExportQuestions questions={result.questions as Question[]} />
                          </div>
                          <QuestionList questions={result.questions as Question[]} />
                      </div>
                  )}
          </div>
          <footer className="mt-12 text-center">
              <a
                  href="https://github.com/Miguel07Alm/text2question"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                  <GithubIcon className="w-6 h-6 inline-block text-gray-900 dark:text-gray-100" />
              </a>
          </footer>
      </main>
  );
}
