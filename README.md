# Vorex Mobile

English pronunciation practice app with self-assessment. Built with React Native and Expo.

## Features

- **Self-Assessment Practice** - Listen, record, compare, and rate your pronunciation
- **Swipeable Phrase Cards** - Tinder-style card interface for practicing phrases
- **Problem Word Tracking** - Tap words you struggled with; the app tracks patterns
- **OpenAI TTS** - High-quality text-to-speech for native pronunciation examples
- **Business Mode** - Toggle to practice professional/business English phrases
- **Progress Tracking** - Session history and problem word analytics

## How It Works

```
See Phrase → Listen (TTS) → Record → Playback → Self-Assess → Mark Problems
                                                    ↓              ↓
                                            "Good" / "Retry"   Tap words
```

## App Structure

| Tab | Purpose |
|-----|---------|
| **Home** | Daily practice prompt, problem words summary, streak |
| **Practice** | Swipeable phrase cards with self-assessment |
| **Profile** | Settings, Business Mode toggle |

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Router**: Expo Router (file-based routing)
- **UI**: Custom dark theme design system with Lucide icons
- **Audio**: expo-av for recording and playback
- **TTS**: OpenAI TTS via backend API
- **Auth**: Supabase
- **Backend**: FastAPI (Python) on Railway
- **State**: React Context with useReducer, AsyncStorage persistence

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
│   ├── (tabs)/            # Tab navigation (3 tabs)
│   │   ├── index.tsx      # Home - practice CTA, problem words
│   │   ├── practice.tsx   # Swipeable phrase cards
│   │   └── profile.tsx    # Settings, business mode toggle
│   ├── warm-up.tsx        # Quick warm-up exercises
│   ├── placement-test.tsx # Proficiency assessment
│   ├── login.tsx          # Authentication
│   └── signup.tsx         # Registration
├── src/
│   ├── components/        # UI components
│   │   ├── SwipeablePhraseCard.tsx  # Main practice card
│   │   ├── SelfAssessmentButtons.tsx # Good/Retry buttons
│   │   ├── ProblemWordChip.tsx      # Tappable word chip
│   │   ├── ProblemWordsSummary.tsx  # Home section
│   │   └── BusinessModeToggle.tsx   # Settings toggle
│   ├── context/           # React Context providers
│   │   └── PracticeContext.tsx # Practice state management
│   ├── data/              # Static content
│   │   └── phrases.ts     # Practice phrases (general + business)
│   ├── lib/               # API clients, utilities
│   └── theme/             # Design system (dark theme)
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
