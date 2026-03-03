# CLAUDE.md — Dreamwright (Dreamcatcher)

Comprehensive reference for AI assistants working in this repository.

---

## Project Overview

**Dreamwright** is an AI-powered career guidance mobile app with a mystical/steampunk aesthetic. Users answer a multi-step questionnaire, receive an AI-generated "fortune" (career guidance), and can unlock detailed action plans through a premium subscription.

- **App Name**: Dreamwright (package/repo slug: dreamcatcher)
- **Owner**: trelarson (Thomas Larson)
- **Platforms**: iOS (primary), Android, Web
- **Bundle IDs**: iOS `com.anonymous.dreamcatcher`, Android `com.trelarson.dreamwright`
- **EAS Owner**: `trelarson`, project slug: `dreamcatcher`

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19.1.0 + React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript 5.9.2 (strict mode) |
| Navigation | Expo Router 6 (file-based routing) |
| Backend | Firebase (Firestore, Auth, Cloud Functions) |
| AI | Anthropic Claude API via Firebase Cloud Functions |
| Monetization | RevenueCat 8.x (`react-native-purchases`) |
| Animations | Lottie React Native 7.x |
| Build | EAS (Expo Application Services) |
| CI/CD | GitHub Actions → TestFlight |

---

## Repository Structure

```
dreamcatcher/
├── app/                    # Expo Router screens (file-based routes)
│   ├── (tabs)/             # Bottom-tab navigation group
│   │   ├── _layout.tsx     # Tab navigator config
│   │   ├── index.tsx       # Home "Parlor" screen
│   │   ├── questionnaire.tsx  # Multi-step career discovery form
│   │   └── profile.tsx     # User "Vault" (saved fortunes & plans)
│   ├── _layout.tsx         # Root layout (fonts, theme, auth setup)
│   ├── action-plan.tsx     # AI-generated action plan display
│   ├── career-path-choice.tsx  # New career vs. pivot selector
│   ├── fortune-paths.tsx   # AI-suggested career path cards
│   ├── fortune-viewer.tsx  # View a saved fortune
│   ├── paywall.tsx         # RevenueCat subscription screen
│   └── modal.tsx           # Generic modal stub
├── functions/              # Firebase Cloud Functions (Node.js 22)
│   └── src/index.ts        # askOracle HTTP callable function
├── components/             # Reusable React Native components
│   ├── ui/                 # Generic UI primitives
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   ├── haptic-tab.tsx
│   └── parallax-scroll-view.tsx
├── services/               # Business logic & external integrations
│   ├── claude.ts           # Firebase Cloud Function client wrapper
│   ├── firestore.ts        # Firestore CRUD helpers
│   ├── purchases.ts        # RevenueCat SDK wrapper
│   └── actionPlanPrompts.ts  # System/user prompts for Claude
├── hooks/                  # Custom React hooks
│   ├── usePremium.ts       # Real-time premium entitlement check
│   ├── useFonts.tsx        # Custom font loader
│   └── use-color-scheme.ts # Dark/light mode
├── config/
│   └── firebase.ts         # Firebase app initialization (keys embedded)
├── constants/
│   └── theme.ts            # Brand colors, fonts, spacing
├── data/
│   └── careerPaths.ts      # Static career path definitions
├── assets/                 # Fonts, images, Lottie animations
├── scripts/                # Node.js dev utilities
├── metadata/en-US/         # App Store listing text
├── .github/workflows/
│   └── eas-build.yml       # CI: iOS build + TestFlight submission
├── app.json                # Expo configuration
├── eas.json                # EAS build profiles
├── firebase.json           # Firebase project config
├── tsconfig.json           # TypeScript config
└── eslint.config.js        # ESLint flat config
```

---

## Core User Flow

```
Parlor (/) ──→ Questionnaire (/questionnaire)
                    │
                    ▼
             Fortune Generation (Claude AI)
                    │
                    ├──→ Career Path Choice (/career-path-choice)
                    │           │
                    │           ▼
                    │    Fortune Paths (/fortune-paths)
                    │           │
                    │           ▼ (premium check)
                    │    Action Plan (/action-plan) ─── [if not premium] → Paywall
                    │
                    └──→ Profile/Vault → Fortune Viewer / Saved Action Plans
```

---

## Development Workflows

### Local Development

```bash
npm install           # Install all dependencies
npm start             # Start Expo dev server (opens metro bundler)
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run in browser
npm run lint          # Run ESLint
```

### Firebase Functions

```bash
cd functions
npm install
npm run build         # Compile TypeScript → lib/
npm run serve         # Build + start Firebase emulators (functions only)
npm run deploy        # Deploy functions to Firebase
```

**Important**: The Firebase Functions runtime is Node.js 22. Keep the `engines` field in `functions/package.json` set to `"node": "22"`.

### EAS Builds

```bash
eas build --platform ios --profile development   # Dev build
eas build --platform ios --profile preview       # Preview (internal testing)
eas build --platform ios --profile production    # Production (App Store)
eas submit -p ios                                # Submit latest build to TestFlight
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```
   EXPO_PUBLIC_REVENUECAT_KEY=<your_revenuecat_public_key>
   ```
2. The **Anthropic API key** lives in Firebase Secret Manager only — never in `.env` or client-side code:
   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```

---

## Firebase Architecture

### Firestore Collections

#### `fortunes`
```typescript
{
  id: string;
  userId: string;
  conformityScale: number;      // 1–10
  lifeStage: string;
  flowState: string;
  problemCare: string;
  successDefinition: string;
  blockers: string[];
  fortuneText: string;          // Raw AI response
  parsedFortune: any;           // Structured parsed data
  createdAt: Timestamp;
}
```

#### `actionPlans`
```typescript
{
  id: string;
  userId: string;
  fortuneId?: string;
  pathTitle: string;
  pathWhy: string;
  pathTimeline: string;
  milestones: Milestone[];      // 5–7 milestones
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp;
}

// Milestone
{ id, title, timeline, tasks: Task[] }

// Task
{ id, description, completed, resources: Resource[] }

// Resource
{ type: 'course'|'article'|'tool'|'community'|'person', title, url, description, estimatedTime?, cost: 'free'|'paid' }
```

### Query Patterns
- Always filter by `userId` — never fetch cross-user data.
- Sort fortunes by `createdAt desc`, action plans by `lastUpdatedAt desc`.
- Look up action plans for a fortune via `userId + fortuneId` compound query.

### Authentication
- Firebase Auth with email/password and anonymous sign-in.
- Firebase UID is passed to RevenueCat (`purchases.logIn(uid)`) for cross-device subscription sync.

---

## AI Integration (askOracle Cloud Function)

### Client-Side Usage (`services/claude.ts`)

```typescript
import { askTheOracle } from '@/services/claude';

const result = await askTheOracle({
  userMessage: '...',
  systemPrompt: '...',   // optional
  useHaiku: false,       // false = Sonnet (default), true = Haiku
  maxTokens: 4096,       // default 4096
});
// result.data.text → string response
```

### Cloud Function Behavior

- **Auth required**: Returns `unauthenticated` error if caller is not signed in.
- **Model routing**:
  - `useHaiku: false` → `claude-sonnet-4-5-20250929`
  - `useHaiku: true` → `claude-haiku-4-5-20251001`
- **Retry logic**: Automatically retries up to 3 times with exponential backoff (2s, 4s) on HTTP 429 (rate limit) and 529 (overload).
- **Cache control**: System prompts use `ephemeral` cache control for prompt caching.
- **Timeout**: 120 seconds.
- **Token logging**: Input/output tokens are logged for cost monitoring.

### Prompt Engineering (`services/actionPlanPrompts.ts`)

- `getSystemPrompt(pathType)` — Returns detailed system instructions for milestone/task/resource generation.
- `getUserPrompt(pathType, pathInfo)` — Returns the user message with career context.
- `pathType`: `"new"` (new career entrant) | `"pivot"` (career switcher).
- Action plans should have 5–7 milestones, each with concrete tasks and curated resources.

---

## Monetization (RevenueCat)

### Setup (`services/purchases.ts`)

- Initialized with `EXPO_PUBLIC_REVENUECAT_KEY` env var.
- **Entitlement ID**: `"premium"` — always use this constant, never hard-code the string elsewhere.
- Call `initializePurchases()` once on app start (in root `_layout.tsx`).
- Call `loginUser(uid)` after Firebase Auth sign-in to link subscription to user.
- Call `logoutUser()` on sign-out.

### Premium Check (`hooks/usePremium.ts`)

```typescript
const { isPremium, isLoading } = usePremium();
```

- Provides real-time entitlement status with listener cleanup.
- Gate action plan generation behind `isPremium` check.
- If not premium, navigate to `/paywall`.

---

## Theming & Styling

### Brand Colors (`constants/theme.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| Primary (Teal) | `#1B4D5C` | Headers, primary actions |
| Gold | `#D4AF37` | Accents, highlights |
| Light Blue | `#E6F4FE` | Backgrounds, cards |

### Custom Fonts

- **Playfair Display** (serif) — headings, mystical text
- **Cinzel** (serif, all-caps) — titles, labels
- **Crimson Text** (serif) — body copy

Load fonts with the `useFonts()` hook before rendering any screen.

### Styling Rules

- Use `StyleSheet.create()` for all styles (never inline objects in JSX).
- Use flex layouts; avoid hard-coded pixel dimensions for heights.
- Support dark mode via `useColorScheme()` and `useThemeColor()`.
- Use `ThemedText` and `ThemedView` components for automatic theme adaptation.

---

## Code Conventions

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `ParallaxScrollView` |
| Functions | camelCase | `getUserFortunes` |
| Interfaces/Types | PascalCase | `SavedFortune`, `OracleRequest` |
| Constants | UPPER_SNAKE_CASE | `ENTITLEMENT_ID` |
| Files | kebab-case | `fortune-viewer.tsx` |

### TypeScript

- **Strict mode** is enabled — no `any` unless genuinely unavoidable.
- Define interfaces for all API request/response shapes.
- Use `Timestamp` from `firebase/firestore` (not `Date`) for Firestore timestamps.
- Prefer `type` imports when importing types only.

### React Patterns

- Functional components with hooks only — no class components.
- Use `useCallback` for handlers passed as props.
- Always clean up effects (remove listeners, cancel subscriptions) in `useEffect` cleanup.
- Prefer `async/await` with `try/catch` over raw Promise chains.
- Show user-facing errors via `Alert.alert(...)`, not console-only.

### Navigation (Expo Router)

- Navigate with `router.push('/route')` or `router.replace('/route')`.
- Pass params via the route path or `router.push({ pathname, params })`.
- Read params with `useLocalSearchParams<{ key: string }>()`.
- Use `<Link>` for declarative navigation within JSX.

### File Organization

- Business logic → `services/`
- Stateful React logic → `hooks/`
- Pure UI → `components/`
- App-level wording/prompts → `services/actionPlanPrompts.ts`
- Static lookup data → `data/`
- Keep screen files (`app/`) focused on layout and navigation only.

---

## Testing

No automated tests are currently configured. When adding tests:

- Use **Jest** with **React Native Testing Library** for component/hook tests.
- Use **Firebase Emulator Suite** for integration tests against Firestore/Auth/Functions.
- Place test files adjacent to the file under test: `foo.test.ts` next to `foo.ts`.

---

## CI/CD (.github/workflows/eas-build.yml)

| Trigger | Action |
|---------|--------|
| Push to `master` | Build iOS (production profile) + submit to TestFlight |
| Manual `workflow_dispatch` | Build with selected profile; submit to TestFlight if production |

**Required GitHub Secrets:**
- `EXPO_TOKEN` — EAS authentication
- `ANTHROPIC_API_KEY` — passed to Firebase Secret Manager during deploy (not used client-side)

---

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `app/(tabs)/questionnaire.tsx` | Main user-facing form (~1400 lines) |
| `services/claude.ts` | All calls to the AI backend go through here |
| `services/firestore.ts` | All Firestore reads/writes go through here |
| `services/actionPlanPrompts.ts` | Edit prompts here to change AI output quality |
| `functions/src/index.ts` | The only server-side code; modify Claude model here |
| `constants/theme.ts` | Single source of truth for colors and fonts |
| `hooks/usePremium.ts` | Gate any premium feature behind this hook |
| `config/firebase.ts` | Firebase project credentials (safe to commit) |

---

## Common Tasks

### Change the Claude Model

Edit `functions/src/index.ts` — look for the model name constants near the top and update `claude-sonnet-4-5-20250929` or `claude-haiku-4-5-20251001`. Then redeploy:

```bash
cd functions && npm run deploy
```

### Add a New Screen

1. Create `app/your-screen.tsx`.
2. Navigate to it with `router.push('/your-screen')`.
3. If it needs params, type them with `useLocalSearchParams<{ key: string }>()`.

### Add a New Firestore Collection

1. Define the TypeScript interface in `services/firestore.ts`.
2. Add CRUD helpers in the same file following existing patterns.
3. Always include `userId` in documents and filter by it in queries.

### Update App Store Metadata

Edit files in `metadata/en-US/` (description, keywords, release notes, etc.) and commit. The EAS submit step picks these up automatically.

### Deploy Firebase Functions

```bash
cd functions
npm run build          # Compile TypeScript
firebase deploy --only functions
```

---

## Security Notes

- **Never** commit the Anthropic API key to any file. It lives exclusively in Firebase Secret Manager.
- Firebase config in `config/firebase.ts` (API key, project ID, etc.) is intentionally public — these keys are safe to commit and are protected by Firebase Security Rules.
- RevenueCat public key (`EXPO_PUBLIC_REVENUECAT_KEY`) is client-safe and fine to commit in `.env.example`.
- Firestore Security Rules must enforce `userId` ownership — validate in the Firebase Console, not just in app code.
