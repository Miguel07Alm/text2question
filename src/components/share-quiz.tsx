import { Question } from "@/types/types";
import { Share2 } from "lucide-react";
import { encodeQuiz } from "@/utils/share";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Locale } from "@/i18n.config";

interface ShareQuizProps {
    questions: Question[];
    isLoading: boolean;
    dictionary: any;
    lang: Locale;
}

export function ShareQuiz({ questions, isLoading, dictionary, lang }: ShareQuizProps) {
    const { toast } = useToast();


    const handleShare = () => {
        const encoded = encodeQuiz(questions);
        const url = `${window.location.origin}/${lang}?quiz=${encoded}`;
        
        navigator.clipboard.writeText(url);
        
        toast({
            description:
                dictionary?.share_quiz_toast_message ||
                "Quiz link copied to clipboard!",
        });
    };

    return (
        <button
            onClick={handleShare}
            disabled={isLoading || questions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title={
                isLoading
                    ? dictionary?.share_quiz_button_title_loading
                    : dictionary?.share_quiz_button_title_ready
            }
        >
            <Share2 className="w-4 h-4" />
            {dictionary?.share_quiz_button_text || "Share Quiz"}
        </button>
    );
}
