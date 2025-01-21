import { Question } from "@/types/types";
import { Share2 } from "lucide-react";
import { encodeQuiz } from "@/utils/share";
import { useToast } from "@/hooks/use-toast";

interface ShareQuizProps {
    questions: Question[];
    isLoading: boolean;
}

export function ShareQuiz({ questions, isLoading }: ShareQuizProps) {
  const { toast } = useToast();


    const handleShare = () => {
        const encoded = encodeQuiz(questions);
        const url = `${window.location.origin}?quiz=${encoded}`;
        
        navigator.clipboard.writeText(url);
        
        toast({description: "Quiz link copied to clipboard!"});
    };

    return (
        <button
            onClick={handleShare}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title={isLoading ? "Wait for sharing the quiz after loading all the questions" : "Share Quiz"}
        >
            <Share2 className="w-4 h-4" />
            Share Quiz
        </button>
    );
}
