"use client";

import { useState } from "react";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FileUploadProps {
    onFileContent: (content: string) => void;
}

export function FileUpload({ onFileContent }: FileUploadProps) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const extractPDFText = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.filter((item) => "str" in item).map((item) => `Page ${page.pageNumber}: ` + item.str).join(" ") + "\n";
        }

        return text.trim();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setError(null);
            setLoading(true);

            if (file.type === "application/pdf") {
                const text = await extractPDFText(file);
                onFileContent(text);
            } else {
                const text = await file.text();
                onFileContent(text);
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to read file"
            );
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Upload File (PDF or Text)
            </label>
            <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.md,.pdf"
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                 file:rounded-full file:border-0 file:text-sm file:font-medium
                 file:bg-gray-200 file:text-gray-900 hover:file:opacity-90
                 dark:file:bg-gray-700 dark:file:text-gray-100
                 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {loading && (
                <p className="text-blue-600 mt-2 text-sm">Processing file...</p>
            )}
            {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
        </div>
    );
}
