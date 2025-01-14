'use client'

import { useState } from 'react'
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

export default function Home() {
  const [input, setInput] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false' | 'short-answer' | 'mixed'>('mixed')
  const [questionCount, setQuestionCount] = useState(5)
  const [maxQuestions, setMaxQuestions] = useState(20)

  const { isLoading, object: result, submit, stop } = useObject({
      api: "/api/chat",
      schema: QuestionSchema,
  });

  const handleSubmit = async () => {
    submit({ input, fileContent, questionType, questionCount })
  }

  const handleStop = () => {
    stop()
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
                    <Submit onClick={handleSubmit} loading={isLoading} disabled={!input && !fileContent}>
                        Generate Questions
                    </Submit>
                )}
              {result &&
                  Array.isArray(result.questions) &&
                  result.questions.length > 0 && (
                      <QuestionList
                          questions={result.questions as Question[]}
                      />
                  )}
          </div>
      </main>
  );
}
