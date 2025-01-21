# Text2Question - AI-Powered Quiz Generator

Text2Question is an open-source application that automatically generates quizzes from textual content using AI. It supports multiple question types and provides an interactive interface for taking and grading quizzes.

## What Does This App Do?

Text2Question generates quiz questions from any given text. Users can upload text files or input text directly, and the app will create a variety of question types such as multiple-choice, true/false, and short-answer. The app also includes features like real-time answer verification, hints, and the ability to export quizzes.

## Features

- 🤖 AI-powered question generation
- 📝 Multiple question types:
  - Multiple choice (with configurable number of options)
  - True/False
  - Short answer
  - Mixed mode
- 📚 File upload support with page reference tracking
- 🎨 Dark/Light mode
- 💡 Hint system for questions
- 📖 Detailed explanations for each answer
- 📄 Page references for questions from PDFs
- ✨ Real-time answer verification
- 📤 Export functionality
- 🔀 Random question and answer shuffling
- 🔗 Share quizzes via URL
- 🔄 Retake quizzes with new random order
- 📱 Fully responsive design
- 🎛️ Customizable AI Behavior:
  - Modify system prompts directly
  - Fine-tune AI question generation
- 🛠️ Enhanced Configuration:
  - Custom number of options (2-6) for multiple choice
  - Advanced system prompt editing
  - Persistent user preferences


## How It Works

### Quiz Generation
- Input your text or upload a file
- Select question type and customize options:
  - Choose number of questions
  - Configure number of options for multiple choice questions (2-6 options)
- AI generates relevant questions with:
  - Detailed explanations for correct answers
  - Page references for PDF content
  - Helpful hints

### Quiz Taking
- Questions are presented in random order
- Multiple choice options are shuffled for better learning
- Immediate feedback includes:
  - Correct/incorrect indication
  - Detailed explanation of the correct answer
  - Page reference for further reading (when available)
- Option to retake quiz with reshuffled questions

### Sharing
- Generate shareable links for your quizzes
- Recipients get randomized question order
- Perfect for classroom or study group use

## Customizing AI Behavior

You can customize how the AI generates questions by:

1. Clicking the settings icon in the top-right corner
2. Modifying the system prompt
3. Testing different instructions
4. Saving your preferred configuration

The AI will remember your settings between sessions, but be aware that it may occasionally:
- Generate unexpected content
- Deviate from instructions
- Produce inaccurate information

## Prerequisites

Before running this application, you will need:

- Node.js 18+ installed
- An OpenAI API key

## Environment Variables

Create a `.env.local` file in the root directory with the following content:

```
OPENAI_API_KEY=your_openai_api_key
```

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## App URL

You can access the deployed application at the following URL:

[https://text2question.vercel.app](https://text2question.vercel.app)

