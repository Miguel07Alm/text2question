import { Question } from "@/types/types";
import { compress, decompress, compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const TYPE_MAP = {
    'm': 'multiple-choice',
    't': 'true-false',
    's': 'short-answer'
} as const;

const MAX_QUESTIONS = 20;
const MAX_OPTION_LENGTH = 1000; 
const MAX_QUESTION_LENGTH = 2000;

interface CompactQuestion {
    q: string;          // question
    t: keyof typeof TYPE_MAP;  // type
    o?: string[];       // options (opcional)
    a: number | string; // answer
    h?: string;         // hint (opcional)
}

function validateQuestion(question: Question): boolean {
    if (!question.question || !question.type) return false;
    if (question.question.length > MAX_QUESTION_LENGTH) return false;
    
    // Validar el tipo de pregunta
    if (!['multiple-choice', 'true-false', 'short-answer'].includes(question.type)) return false;

    // Validar opciones para multiple-choice
    if (question.type === 'multiple-choice') {
        if (!Array.isArray(question.options) || question.options.length === 0) return false;
        if (question.options.some(opt => typeof opt !== 'string' || opt.length > MAX_OPTION_LENGTH)) return false;
        if (typeof question.correctAnswer !== 'number' || question.correctAnswer >= question.options.length) return false;
    }

    // Validar respuesta para true-false
    if (question.type === 'true-false') {
        if (typeof question.correctAnswer !== 'string' && typeof question.correctAnswer !== 'boolean') return false;
    }

    return true;
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
    // Validaciones de seguridad
    if (!Array.isArray(questions) || questions.length > MAX_QUESTIONS) {
        throw new Error("Invalid quiz format or too many questions");
    }

    const validQuestions = questions.filter(validateQuestion);
    if (validQuestions.length === 0) {
        throw new Error("No valid questions to encode");
    }

    const compactQuiz = compactifyQuiz(validQuestions);
    const jsonString = JSON.stringify(compactQuiz);
    return compressToEncodedURIComponent(jsonString);
}

export function decodeQuiz(encoded: string): Question[] | null {
    try {
        // Validar longitud del string codificado
        if (!encoded || encoded.length > 50000) {
            throw new Error("Invalid encoded quiz length");
        }

        const decompressed = decompressFromEncodedURIComponent(encoded);
        if (!decompressed) {
            console.error("Failed to decompress data");
            return null;
        }
        
        try {
            const compactQuiz = JSON.parse(decompressed) as CompactQuestion[];
            if (!Array.isArray(compactQuiz) || compactQuiz.length > MAX_QUESTIONS) {
                return null;
            }

            const expanded = expandQuiz(compactQuiz);
            // Validar cada pregunta expandida
            const validQuestions = expanded.filter(validateQuestion);
            
            return validQuestions.length > 0 ? validQuestions : null;
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError);
            return null;
        }
    } catch (error) {
        console.error("Error decoding quiz:", error);
        return null;
    }
}
