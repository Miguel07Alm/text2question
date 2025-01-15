import { Question } from "@/types/types";
import { compress, decompress, compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const TYPE_MAP = {
    'm': 'multiple-choice',
    't': 'true-false',
    's': 'short-answer'
} as const;

interface CompactQuestion {
    q: string;          // question
    t: keyof typeof TYPE_MAP;  // type
    o?: string[];       // options (opcional)
    a: number | string; // answer
    h?: string;         // hint (opcional)
}

function compactifyQuiz(questions: Question[]): CompactQuestion[] {
    return questions.map(q => {
        if (!q?.question || !q?.type) return null;
        
        const type = Object.entries(TYPE_MAP).find(([_, v]) => v === q.type)?.[0] as keyof typeof TYPE_MAP;
        if (!type) return null;
        
        const compact: CompactQuestion = {
            q: q.question,
            t: type,
            a: q.correctAnswer!
        };

        if (q.options) {
            compact.o = q.options;
        }

        if (q.hint) {
            compact.h = q.hint;
        }

        return compact;
    }).filter((q): q is CompactQuestion => q !== null);
}

function expandQuiz(compact: CompactQuestion[]): Question[] {
    return compact.map(c => {
        const expanded: Question = {
            question: c.q,
            type: TYPE_MAP[c.t],
            correctAnswer: c.a
        };

        if (c.o) {
            expanded.options = c.o;
        }

        if (c.h) {
            expanded.hint = c.h;
        }

        return expanded;
    });
}

export function encodeQuiz(questions: Question[]): string {
    const compactQuiz = compactifyQuiz(questions);
    const jsonString = JSON.stringify(compactQuiz);
    return compressToEncodedURIComponent(jsonString);
}

export function decodeQuiz(encoded: string): Question[] | null {
    try {
        const decompressed = decompressFromEncodedURIComponent(encoded);
        if (!decompressed) {
            console.error("Failed to decompress data");
            return null;
        }
        
        try {
            const compactQuiz = JSON.parse(decompressed) as CompactQuestion[];
            if (!Array.isArray(compactQuiz)) {
                console.error("Decompressed data is not an array");
                return null;
            }
            return expandQuiz(compactQuiz);
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError);
            return null;
        }
    } catch (error) {
        console.error("Error decoding quiz:", error);
        return null;
    }
}
