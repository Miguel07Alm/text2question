import { Question } from "@/types/types";
import { Share2 } from "lucide-react";
import { encodeQuiz } from "@/utils/share";
import { useToast } from "@/hooks/use-toast";

interface ShareQuizProps {
    questions: Question[];
}

export function ShareQuiz({ questions }: ShareQuizProps) {
  const { toast } = useToast();


    const handleShare = () => {
        const encoded = encodeQuiz(questions);
        const url = `${window.location.origin}?quiz=${encoded}`;
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(url);
        
        // Mostrar mensaje de copiado (puedes usar una librería de toast)
        toast({description: "Quiz link copied to clipboard!"});
    };

    return (
        <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
            <Share2 className="w-4 h-4" />
            Share Quiz
        </button>
    );
}
