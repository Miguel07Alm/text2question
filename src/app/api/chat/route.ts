import { GenerateQuestionsParams, QuestionSchema } from "@/types/types";
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { input, fileContent, questionType, questionCount }: GenerateQuestionsParams = await req.json();

        if (questionCount > 20) {
            return new Response("The maximum number of questions is 20.", { status: 400 });
        }

        const typePrompt = questionType === 'mixed' ? 
            'The questions can be multiple-choice, true-false, or short-answer.' : 
            `The questions must be ${questionType.replace('-', ' ')}.`;
        
        console.log("🚀 ~ POST ~ typePrompt:", typePrompt);

        const result = streamObject({
            model: openai("gpt-4o-mini"),
            schema: QuestionSchema,
            messages: [
                {
                    role: "system",
                    content: `You are an expert quiz creator with years of experience in educational assessment and instructional design.
              Follow these principles when generating ${questionCount} questions:
              
              1. Progressive difficulty: Start with foundational concepts and gradually increase complexity
              2. Cognitive levels: Include a mix of recall, understanding, application, and analysis questions
              3. Clear language: Use precise, unambiguous wording that focuses on key concepts
              4. Plausible options: For multiple choice, all distractors should be realistic and based on common misconceptions
              5. Learning value: Each question should reinforce important concepts from the content
              
              ${typePrompt}
              
              Use the same language as the language that is more repeated in the input content and maintain consistent terminology.
              For true/false, avoid absolute statements and focus on testing understanding.
              For multiple-choice, ensure all options are of similar length and grammatically consistent.
              For short answers, specify clearly what constitutes a complete response.

              You must strictly use this type of questions: ${questionType.replace(
                  "-",
                  " "
              )}

              If there is only a question type, you must avoid using other types of questions.
              
              Important: Ensure hints (when provided) guide thinking rather than give away answers.`,
                },
                {
                    role: "user",
                    content: `User input: ${input}\n\nAttached file: ${fileContent}`,
                },
            ],
            temperature: 0.7,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error generating questions:", error);
        return new Response("An error occurred while generating questions.", { status: 500 });
    }
}
