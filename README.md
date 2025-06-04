# Text2Question - AI-Powered Quiz Generator

Text2Question is an open-source application that automatically generates quizzes from textual content using AI. It supports multiple question types and provides an interactive interface for taking and grading quizzes.

## What Does This App Do?

Text2Question generates quiz questions from any given text. Users can upload text files or input text directly, and the app will create a variety of question types such as multiple-choice, true/false, and short-answer. The app also includes features like real-time answer verification, hints, and the ability to export quizzes in multiple formats.

## Features

- 🤖 AI-powered question generation
  - Multiple AI model support:
    - Gemini 2.0 flash (default)
    - Deepseek Chat
    - OpenAI GPT-4o-mini
  - Configurable model selection
- 🔑 **User Authentication:**
  - Sign in with Google (OAuth)
  - Increased daily generation limits for registered users
- 📝 Multiple question types:
  - Multiple choice (with configurable number of options):
    - Support for multiple correct answers
    - Random correct answers mode
    - Configurable range for random answers
    - Smart answer distribution
    - Visual feedback for multiple selections
  - True/False
  - Short answer with intelligent evaluation
  - Mixed mode
- ⏱️ Quiz Timer Features:
  - Optional time limits for quizzes
  - Configurable duration (5-120 minutes)
  - Visual countdown timer
  - Auto-submit when time expires
  - Time penalties (-10% score)
  - Warning notifications
  - Time tracking and reporting
- 📊 Advanced Results:
  - Detailed scoring analysis
  - Time spent tracking
  - Penalties visualization
  - Progress indicators
  - Beautiful exports in multiple formats
- 📚 File upload support with page reference tracking
- 🎨 Dark/Light mode
- 💡 Hint system for questions
- 📖 Detailed explanations for each answer
- 📄 Page references for questions from PDFs
- ✨ Real-time answer verification with AI-powered grading for short answers
- 📤 **Advanced Export Functionality:**
  - **PDF Export:**
    - Professional styling with modern typography
    - Fully selectable text (not image-based)
    - Intelligent page break handling
    - Color-coded correct/incorrect answers
    - Page footers with generation info
    - Proper character encoding (UTF-8 compatible)
    - Theme-aware design elements
  - **Markdown Export:**
    - Clean, readable markdown format
    - Structured with headings and formatting
    - Includes all question metadata
    - Perfect for documentation or sharing
  - **Flexible Export Options:**
    - Dropdown menu for format selection
    - Export progress indicators
    - Disabled state during processing
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
  - Timer configuration
  - Export settings
- 🐛 **Bug Fixes & Improvements:**
  - Fixed short-answer evaluation showing incorrect "0" responses
  - Improved question generation reliability
  - Better error handling for edge cases

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
- **Rate Limiting:** Anonymous users have a lower daily generation limit compared to registered users. Sign in with Google to increase your limit.

### Quiz Taking
- Questions are presented in random order
- Multiple choice options are shuffled for better learning
- Immediate feedback includes:
  - Correct/incorrect indication
  - Detailed explanation of the correct answer
  - Page reference for further reading (when available)
- **Smart Answer Evaluation:**
  - Multiple choice: Instant verification with visual feedback
  - True/False: Immediate correct/incorrect indication
  - Short answer: AI-powered evaluation with detailed reasoning
- Option to retake quiz with reshuffled questions

### Export & Sharing
- **Multiple Export Formats:**
  - **PDF Export:** Professional documents with selectable text, proper formatting, and modern styling
  - **Markdown Export:** Clean, structured format perfect for documentation
- **Export Features:**
  - Intelligent dropdown menu for format selection
  - Real-time export progress indicators
  - Professional styling with proper character encoding
  - Color-coded answers and explanations
- Generate shareable links for your quizzes
- Recipients get randomized question order
- Perfect for classroom or study group use

## Advanced Features

### Multiple Answer Support
- Configure exact number of correct answers (1 to n-1 options)
- Enable random mode for varying correct answers
- Set minimum and maximum correct answers range
- Smart distribution of correct answers across questions
- Intelligent UI feedback for selection limits

### Random Answer Mode
- Automatically varies number of correct answers
- Ensures diverse answer patterns
- Prevents consecutive questions from having same number of answers
- Even distribution across specified range
- Real-time selection counter and limits

### Timer System

The quiz system includes a comprehensive timer feature:

1. Configuration:
   - Enable/disable timer for each quiz
   - Set custom duration (5-120 minutes)
   - Visual countdown display

2. During Quiz:
   - Real-time countdown
   - Progress tracking
   - Warning notifications
   - Auto-submit functionality

3. Scoring System:
   - Time-based penalties
   - -10% score reduction for timeout
   - Time spent tracking
   - Detailed time statistics in results

4. User Experience:
   - Visual countdown timer
   - Last minute warnings
   - Graceful timeout handling
   - Time tracking in exports

### AI Behavior

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
- An OpenAI API key (or Deepseek API key)
- Google OAuth Credentials (Client ID and Secret)

## Environment Variables

Create a `.env.local` file in the root directory with the following content. You can get Google credentials from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

```dotenv
# AI API Keys (at least one is required)
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_api_key
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth.js Secret (generate a random string, e.g., using `openssl rand -base64 32`)
AUTH_SECRET=your_secure_random_string

# Redis connection URL (for session storage and rate limiting)
# Example for Upstash: redis://default:<password>@<region>.<id>.upstash.io:<port>
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PRICE_ID=price_... # Price ID for the '5 Extra Generations' product
STRIPE_WEBHOOK_SECRET=whsec_... # Get this from your Stripe webhook settings
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_... # Your Stripe publishable key

# Base URL of your application (important for NextAuth redirects and Stripe redirects)
# Example: http://localhost:3000 for development
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Also needed for Stripe redirects
```

**Important:** Add `.env*.local` to your `.gitignore` file to avoid committing your secrets.

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

Open [http://localhost:3000](http://localhost:3000) (or your configured `NEXTAUTH_URL`) in your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## App URL

You can access the deployed application at the following URL:

[https://text2question.miguel07code.dev](https://text2question.miguel07code.dev)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.