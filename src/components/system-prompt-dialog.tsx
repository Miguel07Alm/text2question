"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import {Settings } from "lucide-react"

const defaultPrompt = `You are an expert quiz creator with years of experience in educational assessment and instructional design...`; // Your existing prompt

export function SystemPromptDialog({ 
    onPromptChange 
}: { 
    onPromptChange: (prompt: string) => void 
}) {
    const [prompt, setPrompt] = useState(defaultPrompt);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Customize AI Behavior">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Customize AI Behavior</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Customize AI Behavior</DialogTitle>
                    <DialogDescription>
                        Fine-tune how the AI generates questions. Note that the AI might occasionally deviate from these instructions or generate unexpected content.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium leading-none">System Prompt</p>
                        <p className="text-sm text-muted-foreground">
                            Customize the instructions given to the AI. Be specific but concise.
                        </p>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Enter system prompt..."
                        />
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                            ⚠️ AI Behavior Notice
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            The AI may occasionally:
                            • Ignore some instructions
                            • Generate unexpected content
                            • Provide incorrect information
                            • Hallucinate nonexistent details
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onPromptChange(prompt)}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
