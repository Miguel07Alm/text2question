"use client";

import type React from "react";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { FileText, Upload } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FileUploadProps {
    onFileContent: (content: string) => void;
    dictionary: any; // Added dictionary prop
}

export function FileUpload({ onFileContent, dictionary }: FileUploadProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const extractPDFText = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text +=
                content.items
                    .filter((item) => "str" in item)
                    .map((item) => `Page ${page.pageNumber}: ` + item.str)
                    .join(" ") + "\n";
        }

        return text.trim();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setError(null);
            setLoading(true);
            setFileName(file.name);

            if (file.type === "application/pdf") {
                const text = await extractPDFText(file);
                onFileContent(text);
            } else {
                const text = await file.text();
                onFileContent(text);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : dictionary?.fileUpload?.errorReadingFile || "Failed to read file"
            );
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                {dictionary?.fileUpload?.title || "Upload File (PDF or Text)"}
            </label>

            <div className="relative">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[hsl(var(--ghibli-cream))] dark:border-gray-700 rounded-xl cursor-pointer bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {fileName ? (
                            <>
                                <FileText className="w-8 h-8 mb-2 text-[hsl(var(--themed-blue))]" />
                                <p className="mb-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {fileName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {dictionary?.fileUpload?.changeFile || "Click to change file"}
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">
                                        {dictionary?.fileUpload?.clickToUpload || "Click to upload"}
                                    </span>{" "}
                                    {dictionary?.fileUpload?.dragAndDrop || "or drag and drop"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {dictionary?.fileUpload?.fileTypes || "PDF, TXT or MD files"}
                                </p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".txt,.md,.pdf"
                        disabled={loading}
                    />
                </label>
            </div>

            {loading && (
                <div className="mt-2 flex items-center text-blue-600 dark:text-blue-400">
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                    {dictionary?.fileUpload?.processing || "Processing file..."}
                </div>
            )}

            {error && (
                <p className="text-red-600 mt-2 text-sm flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
