import { Question } from '@/types/types'
import { Download } from 'lucide-react'

interface ExportQuestionsProps {
    questions: Question[]
}

export function ExportQuestions({ questions }: ExportQuestionsProps) {
    const handleExport = () => {
        const content = questions.map((q, i) => q && `
${i + 1}. ${q.question}
${q.type === 'multiple-choice' && q.options 
    ? `Options:
${q.options.map((opt, j) => `   ${String.fromCharCode(97 + j)}) ${opt}`).join('\n')}`
    : ''
}
Correct answer: ${q.type === 'multiple-choice' && q.options 
    ? q.options[q.correctAnswer as number] 
    : q.correctAnswer}
-------------------
`).join('\n')

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'questions-and-answers.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
            <Download className="w-4 h-4" />
            Export questions
        </button>
    )
}
