# Vorex Mobile

AI-powered English language learning mobile application built with React Native and Expo.

## Features

- **AI Conversation Practice** - Real-time voice conversations with AI tutor
- **Speech Recognition** - OpenAI Whisper for accurate transcription
- **Text-to-Speech** - Natural AI voice responses using OpenAI TTS
- **Pronunciation Feedback** - Detailed analysis of your speaking
- **Placement Test** - Initial assessment to determine proficiency level
- **Structured Lessons** - Progressive learning path
- **Progress Tracking** - Analytics dashboard showing improvement

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Router**: Expo Router (file-based routing)
- **UI**: Custom design system with Lucide icons
- **Audio**: expo-av for recording
- **Auth**: Supabase
- **Backend**: FastAPI (Python) on Railway
- **AI**: OpenAI GPT-4, Whisper, TTS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd vorex-mobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical device (scan QR code)
npx expo start
```

## Project Structure

```
vorex-mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home - daily goals, quick actions
│   │   ├── conversation.tsx # AI conversation practice
│   │   ├── review.tsx     # Review past conversations
│   │   ├── progress.tsx   # Analytics dashboard
│   │   └── profile.tsx    # User settings
│   ├── lesson.tsx         # Structured lesson flow
│   ├── placement-test.tsx # Proficiency assessment
│   ├── login.tsx          # Authentication
│   └── signup.tsx         # Registration
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx     # Primary button component
│   │   └── Card.tsx       # Card container component
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # API clients, utilities
│   ├── theme/             # Design system
│   │   ├── colors.ts      # Color palette
│   │   ├── spacing.ts     # Spacing & layout tokens
│   │   ├── typography.ts  # Font styles
│   │   └── shadows.ts     # Elevation system
│   └── types/             # TypeScript definitions
└── assets/                # Images, icons, fonts
```

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6366f1` | Main brand color (indigo) |
| Accent | `#fbbf24` | Highlights, achievements (amber) |
| Success | `#22c55e` | Correct answers |
| Error | `#ef4444` | Errors, warnings |
| Background | `#0a0a0a` | App background |
| Card | `#1a1a1a` | Elevated surfaces |

### Typography

- **Display**: 48px bold - Hero text
- **Headline**: 24-28px semibold - Section headers
- **Body**: 15-16px regular - Content
- **Caption**: 11-12px - Labels, metadata

## Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## API Integration

The app connects to a FastAPI backend for:

- `/api/conversation/*` - AI conversation management
- `/api/speech/transcribe` - Speech-to-text (Whisper)
- `/api/speech/synthesize` - Text-to-speech (OpenAI TTS)
- `/api/speech/analyze` - Pronunciation analysis
- `/api/lessons/*` - Lesson content
- `/api/progress/*` - User progress

## Development

### Clear Cache

```bash
# Clear Metro bundler cache
npx expo start --clear

# Full clean
rm -rf .expo node_modules/.cache
npm install
npx expo start --clear
```

### Type Checking

```bash
npx tsc --noEmit
```

## Related Projects

- **vorex-backend** - FastAPI backend server
- **vorex-frontend** - Next.js marketing website

## Documentation

- [ChatGPT Agent Prompt](./CHATGPT_AGENT_PROMPT.md) - Use this to get strategic advice about the product

## License

Private - All rights reserved
