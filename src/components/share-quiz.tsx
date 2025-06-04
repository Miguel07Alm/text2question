import { Question } from "@/types/types";
import { Share2 } from "lucide-react";
import { encodeQuiz } from "@/utils/share";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Locale } from "@/i18n.config";
import { Button } from "./ui/button";

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
        <Button
        variant="secondary"
            onClick={handleShare}
            disabled={isLoading || questions.length === 0}
            title={
                isLoading
                    ? dictionary?.share_quiz_button_title_loading
                    : dictionary?.share_quiz_button_title_ready
            }
        >
            <Share2 className="w-4 h-4" />
            {dictionary?.share_quiz_button_text || "Share Quiz"}
        </Button>
    );
}
