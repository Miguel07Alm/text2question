# Text2Question - AI-Powered Quiz Generator

Text2Question is an open-source application that automatically generates quizzes from textual content using AI. It supports multiple question types and provides an interactive interface for taking and grading quizzes.

## What Does This App Do?

Text2Question generates quiz questions from any given text. Users can upload text files or input text directly, and the app will create a variety of question types such as multiple-choice, true/false, and short-answer. The app also includes features like real-time answer verification, hints, and the ability to export quizzes.

## Features

- 🤖 AI-powered question generation
- 📝 Multiple question types:
  - Multiple choice
  - True/False
  - Short answer
  - Mixed mode
- 📚 File upload support
- 🎨 Dark/Light mode
- 💡 Hint system for questions
- ✨ Real-time answer verification
- 📤 Export functionality

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

