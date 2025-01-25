import { Question } from "@/types/types";
import { Download } from "lucide-react";
import { useTheme } from "next-themes";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useState } from "react";

interface ExportQuestionsProps {
    questions: Question[];
}

export function ExportQuestions({ questions }: ExportQuestionsProps) {
    const { theme } = useTheme();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const width = 768;
        
        const element = document.createElement('div');
        element.innerHTML = `
            <div id="pdf-content" style="
                padding: 20px;
                font-family: system-ui, -apple-system, sans-serif;
                background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
                color: ${theme === 'dark' ? '#ffffff' : '#000000'};
                width: ${width}px;
                margin: 0 auto;
            ">
                <h1 style="
                    text-align: center;
                    font-size: 24px;
                    margin-bottom: 24px;
                    color: ${theme === 'dark' ? '#ffffff' : '#000000'};
                ">Quiz Results</h1>
                ${questions.map((q, i) => `
                    <div style="
                        margin-bottom: 32px;
                        padding: 16px;
                        border-radius: 12px;
                        background: ${theme === 'dark' ? '#2a2a2a' : '#f8f8f8'};
                        border: 1px solid ${theme === 'dark' ? '#404040' : '#e5e5e5'};
                    ">
                        <div style="
                            display: flex;
                            gap: 12px;
                            margin-bottom: 16px;
                        ">
                            <span style="font-weight: 600;">${i + 1}.</span>
                            <div style="flex: 1;">
                                <h3 style="
                                    font-size: 16px;
                                    font-weight: 600;
                                    margin: 0;
                                    color: ${theme === 'dark' ? '#ffffff' : '#000000'};
                                ">${q.question}</h3>
                            </div>
                        </div>
                        
                        ${q.type === 'multiple-choice' && q.options ? `
                            <div style="
                                margin-left: 24px;
                                margin-bottom: 16px;
                            ">
                                ${q.options.map((opt, j) => `
                                    <div style="
                                        padding: 8px;
                                        margin-bottom: 8px;
                                        border-radius: 8px;
                                        background: ${Array.isArray(q.correctAnswer) 
                                            ? q.correctAnswer.includes(j)
                                                ? theme === 'dark' ? '#134e4a' : '#dcfce7'
                                                : 'transparent'
                                            : typeof q.correctAnswer === 'number' && q.correctAnswer === j
                                                ? theme === 'dark' ? '#134e4a' : '#dcfce7'
                                                : 'transparent'
                                        };
                                        border: 1px solid ${theme === 'dark' ? '#404040' : '#e5e5e5'};
                                    ">
                                        ${opt}
                                        ${Array.isArray(q.correctAnswer)
                                            ? q.correctAnswer.includes(j)
                                                ? ' ✓'
                                                : ''
                                            : typeof q.correctAnswer === 'number' && q.correctAnswer === j
                                                ? ' ✓'
                                                : ''
                                        }
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${q.why ? `
                            <div style="
                                margin-top: 16px;
                                padding: 12px;
                                border-radius: 8px;
                                background: ${theme === 'dark' ? '#404040' : '#f3f4f6'};
                                font-style: italic;
                                font-size: 14px;
                            ">
                                <strong>Explanation:</strong> ${q.why}
                                ${q.page ? `<span style="margin-left: 8px; font-weight: 600;">(Page ${q.page})</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(element);

        try {
            const scale = 2;
            const canvas = await html2canvas(element.querySelector('#pdf-content')!, {
                scale,
                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            });

            const pdf = new jsPDF({
                format: 'a4',
                unit: 'px',
            });


            const imgWidth = width / scale; 
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            let page = 1;

            pdf.addImage(canvas, 'PNG', 20, position, imgWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.height;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(canvas, 'PNG', 20, position, imgWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.height;
                page++;
            }

            pdf.save('quiz-results.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            document.body.removeChild(element);
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export as PDF'}
        </button>
    );
}
