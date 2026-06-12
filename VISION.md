# AetherOS — Project Vision & Context

## What This App Is
AetherOS is a cinematic, gamified life-OS / task tracker built with Expo (~54), React Native, Reanimated 4.1.1, and Groq AI. The aesthetic is dark, dramatic, and alive — every interaction should feel like a sci-fi operating system booting up. Animations are central to the UX, not decorative.

## Design Philosophy
- **Cinematic over clean**: transitions should feel like scenes, not slides
- **Alive over static**: idle states pulse, text types out, lines grow
- **Dark aesthetic**: deep blacks (`colors.bg.primary`), muted surfaces, accent colours from `colors.primary.*`
- **Tab-scoped animations**: the tab bar always stays visible; animations fill the content area only
- All animations use `react-native-reanimated` shared values + `useAnimatedStyle`. Never use the React Native core `Animated` API.

## Architecture

```
RootNavigator (stack)
  ├── OnboardingScreen          ← cinematic 3-phase sequence
  └── MainNavigator (3 tabs)
        ├── Tab 1: Planner  →  PlannerScreen.tsx
        ├── Tab 2: Roadmap  →  RoadmapScreen.tsx
        └── Tab 3: Arena    →  ArenaNavigator.tsx
                                  ├── Dashboard
                                  ├── Tasks
                                  ├── Focus
                                  ├── System
                                  └── Profile
```

## Onboarding Flow (3 phases)
1. **Loading** (1500 ms) — full-screen orb with slow pulse rings
2. **Creating** — "Creating World…" types out via TypewriterText below the orb
3. **Name entry** — user enters their name → `onComplete()` → lands on Planner tab

## PlannerScreen — Entry State
Two large cards (no plan yet):
- **"Plan with Creator"** (left, pulsing border) — starts the AI wizard
- **"Do It Manually"** (right, static with typewriter label) — navigates directly to Arena tab

## PlannerScreen — Wizard Flow
On "Plan with Creator" press:
1. Card animates to top of screen, transforms into a text input bar
2. Three questions with escalating animation energy:
   - Q1: goal description — slow pulsing submit button
   - Q2: target date — faster pulsing submit button + line guide between questions
   - Q3: weekly hours (chip select: 1–3h / 3–5h / 5h+) — circling outline on submit button
3. Submit Q3 → ink splash (black circle scales to fill screen) → sphere loader with pulsing rings
4. Groq API call generates roadmap JSON
5. On success → white burst overlay → navigate to Roadmap tab

## RoadmapScreen — Entry Animation
1. Black sphere slides from center to top of screen
2. Ink drip line grows downward from sphere
3. Phase cards stagger in as line "reaches" each one
4. Edit mode: cards shiver (like iOS delete mode); tapping opens an inline scroll-unroll panel with editable fields
5. "Continue" → speed lines + "Welcome Hunter [name]" text → navigate to Arena tab

## State
- `useRoadmapStore` (Zustand + AsyncStorage) — stores `hasPlan`, `phases`, `goalTitle`, `wizardAnswers`
- `useUserStore` — stores `hasOnboarded`, `displayName`
- On cold restart with `hasPlan === true` → skip onboarding, land on Arena tab

## Key Files
| File | Purpose |
|------|---------|
| `frontend/mobile/src/screens/OnboardingScreen.tsx` | 3-phase cinematic onboarding |
| `frontend/mobile/src/screens/PlannerScreen.tsx` | AI wizard + ink splash + Groq API |
| `frontend/mobile/src/screens/RoadmapScreen.tsx` | Phase cards + edit mode + continue animation |
| `frontend/mobile/src/navigation/MainNavigator.tsx` | 3-tab navigator (Planner / Roadmap / Arena) |
| `frontend/mobile/src/navigation/ArenaNavigator.tsx` | Original 5-tab Arena (extracted from old MainNavigator) |
| `frontend/mobile/src/navigation/RootNavigator.tsx` | Onboarding gate + routing |
| `frontend/mobile/src/store/useRoadmapStore.ts` | Roadmap state (Zustand + AsyncStorage) |
| `frontend/mobile/src/components/ui/TypewriterText.tsx` | Character-by-character text reveal component |
| `frontend/mobile/src/types/index.ts` | RoadmapTask, RoadmapPhase, RoadmapGoal, MainTabParamList, ArenaTabParamList |

## Existing Patterns to Reuse
- Groq fetch: `frontend/mobile/src/components/shared/GoalInputSheet.tsx` lines 45–79
- Pulse animation: `frontend/mobile/src/components/shared/RankUpOverlay.tsx`
- Sequence + runOnJS callback: `frontend/mobile/src/components/shared/XPFlyOut.tsx`
- Tab bar styles: `frontend/mobile/src/navigation/ArenaNavigator.tsx`

## Current Status
All files listed above have been implemented. The patch has been applied.
Next steps are testing and iterating on the animations and Groq prompt output.

## Notes
- Expo SDK is ~54
- Groq API key lives in `frontend/mobile/.env` as `EXPO_PUBLIC_GROQ_API_KEY`
- The app targets dark mode only — no light mode support needed
