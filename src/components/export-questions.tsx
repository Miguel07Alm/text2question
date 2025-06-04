import { Question } from "@/types/types";
import { Download, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExportQuestionsProps {
    questions: Question[];
    dictionary: any;
}

export function ExportQuestions({ questions, dictionary }: ExportQuestionsProps) {
    const { theme } = useTheme();
    const [isExporting, setIsExporting] = useState(false);

    const generateMarkdown = (questions: Question[]): string => {
        let markdown = "# Quiz Questions\n\n";
        
        questions.forEach((question, index) => {
            markdown += `## ${index + 1}. ${question.question}\n\n`;
            
            if (question.type === "multiple-choice" && question.options) {
                question.options.forEach((option, optionIndex) => {
                    const isCorrect = Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.includes(optionIndex)
                        : false;
                    
                    const prefix = isCorrect ? "✅" : "❌";
                    markdown += `${prefix} **${String.fromCharCode(65 + optionIndex)}.** ${option}\n\n`;
                });
            } else if (question.type === "true-false") {
                markdown += `✅ **Correct Answer:** ${question.correctAnswer}\n\n`;
            } else if (question.type === "short-answer") {
                markdown += `✅ **Expected Answer:** ${question.correctAnswer}\n\n`;
            }
            
            if (question.why) {
                markdown += `📖 **Explanation:** ${question.why}\n\n`;
            }
            
            if (question.page) {
                markdown += `📄 **Reference:** Page ${question.page}\n\n`;
            }
            
            if (question.hint) {
                markdown += `💡 **Hint:** ${question.hint}\n\n`;
            }
            
            markdown += "---\n\n";
        });
        
        return markdown;
    };

    const downloadMarkdown = () => {
        setIsExporting(true);
        try {
            const markdown = generateMarkdown(questions);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'quiz-questions.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating markdown:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handlePDFExport = async () => {
        setIsExporting(true);
        
        try {
            const pdf = new jsPDF({
                format: 'a4',
                unit: 'mm',
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // Helper function to check if we need a new page
            const checkNewPage = (requiredHeight: number) => {
                if (yPosition + requiredHeight > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                    return true;
                }
                return false;
            };

            // Helper function to add text with proper line breaks
            const addText = (text: string, x: number, y: number, options: any = {}) => {
                const lines = pdf.splitTextToSize(text, maxWidth - (x - margin));
                const lineHeight = options.lineHeight || 6;
                
                // Check if all lines fit on current page
                checkNewPage(lines.length * lineHeight);
                
                pdf.text(lines, x, yPosition);
                yPosition += lines.length * lineHeight;
                return lines.length;
            };

            // Title with modern styling
            pdf.setFontSize(24);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(51, 51, 51); // Dark gray similar to web
            pdf.text("Quiz Questions", pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 20;

            // Add a subtle line under title
            pdf.setDrawColor(229, 231, 235); // Light gray
            pdf.setLineWidth(0.5);
            pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
            yPosition += 10;

            // Questions
            questions.forEach((question, index) => {
                // Ensure minimum space for question header
                checkNewPage(25);

                // Question number and text with better styling
                pdf.setFontSize(16);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(37, 99, 235); // Blue color similar to web primary
                
                const questionNumber = `${index + 1}.`;
                pdf.text(questionNumber, margin, yPosition);
                
                // Question text with proper wrapping
                pdf.setTextColor(51, 51, 51);
                const questionTextWidth = maxWidth - 15; // Account for question number
                const questionLines = pdf.splitTextToSize(question.question || 'No question text', questionTextWidth);
                
                // Ensure question fits on page
                if (yPosition + (questionLines.length * 7) > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                    pdf.text(questionNumber, margin, yPosition);
                }
                
                pdf.text(questionLines, margin + 15, yPosition);
                yPosition += questionLines.length * 7 + 8;

                // Options for multiple choice with better formatting
                if (question.type === "multiple-choice" && question.options) {
                    pdf.setFontSize(12);
                    
                    question.options.forEach((option, optionIndex) => {
                        const isCorrect = Array.isArray(question.correctAnswer)
                            ? question.correctAnswer.includes(optionIndex)
                            : false;
                        
                        // Check space for option
                        const optionLines = pdf.splitTextToSize(`${String.fromCharCode(65 + optionIndex)}. ${option}`, maxWidth - 25);
                        checkNewPage(optionLines.length * 5 + 3);
                        
                        // Styling for correct/incorrect answers
                        if (isCorrect) {
                            pdf.setFont("helvetica", "bold");
                            pdf.setTextColor(34, 197, 94); // Green for correct
                            pdf.text("✓", margin + 5, yPosition);
                        } else {
                            pdf.setFont("helvetica", "normal");
                            pdf.setTextColor(107, 114, 128); // Gray for incorrect
                            pdf.text("○", margin + 5, yPosition);
                        }
                        
                        pdf.setTextColor(51, 51, 51);
                        pdf.text(optionLines, margin + 15, yPosition);
                        yPosition += optionLines.length * 5 + 3;
                    });
                    
                    yPosition += 5; // Extra space after options
                    
                } else if (question.type === "true-false") {
                    checkNewPage(15);
                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(34, 197, 94); // Green
                    pdf.text("✓", margin + 5, yPosition);
                    pdf.setTextColor(51, 51, 51);
                    addText(`Correct Answer: ${question.correctAnswer?.toString() || 'N/A'}`, margin + 15, yPosition, { lineHeight: 6 });
                    yPosition += 8;
                    
                } else if (question.type === "short-answer") {
                    checkNewPage(15);
                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(34, 197, 94); // Green
                    pdf.text("✓", margin + 5, yPosition);
                    pdf.setTextColor(51, 51, 51);
                    addText(`Expected Answer: ${question.correctAnswer || 'N/A'}`, margin + 15, yPosition, { lineHeight: 6 });
                    yPosition += 8;
                }

                // Explanation with modern styling
                if (question.why) {
                    checkNewPage(20);
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(107, 114, 128); // Medium gray
                    pdf.text("Explanation:", margin + 5, yPosition);
                    pdf.setFont("helvetica", "italic");
                    addText(`${question.why ?? 'N/A'}`, margin + 35, yPosition, { lineHeight: 6 });
                    yPosition += 5;
                }

                // Page reference with badge-like styling
                if (question.page) {
                    checkNewPage(10);
                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(99, 102, 241); // Indigo
                    pdf.text("Reference:", margin + 5, yPosition);
                    addText(`Page ${question.page}`, margin + 35, yPosition, { lineHeight: 5 });
                    yPosition += 3;
                }

                // Hint with subtle styling
                if (question.hint) {
                    checkNewPage(15);
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(245, 158, 11); // Amber
                    pdf.text("Hint:", margin + 5, yPosition);
                    pdf.setTextColor(107, 114, 128);
                    pdf.setFont("helvetica", "italic");
                    addText(`${question.hint ?? 'N/A'}`, margin + 25, yPosition, { lineHeight: 6 });
                    yPosition += 5;
                }

                // Modern separator with proper spacing
                yPosition += 8;
                checkNewPage(15);
                
                if (index < questions.length - 1) { // Don't add separator after last question
                    pdf.setDrawColor(229, 231, 235); // Light gray
                    pdf.setLineWidth(0.3);
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 15;
                }
            });

            // Footer on each page
            const pageCount = (pdf as any).internal.pages.length - 1;
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(156, 163, 175); // Light gray
                pdf.text(
                    `Generated by Text2Question | Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }

            pdf.save('quiz-questions.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSelection = (value: string) => {
        if (value === "pdf") {
            handlePDFExport();
        } else if (value === "markdown") {
            downloadMarkdown();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Download className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" className={isExporting ? "animate-bounce" : ""}>
                        {isExporting ? (dictionary.export_loading || "Exporting...") : (dictionary.export_button || "Export")}
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExportSelection("pdf")} disabled={isExporting}>
                        {dictionary.export_pdf || "Export as PDF"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportSelection("markdown")} disabled={isExporting}>
                        {dictionary.export_markdown || "Export as Markdown"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
