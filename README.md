# Lift Log v0.4.1 — Exercise identification & voice search

- The gallery now uses **actual start/end movement reference images** rather than stick figures. Images are stored with the app, load offline after caching, and have short cues explaining the equipment and motion. On opening an exercise, Start and Finish pictures appear alongside identification text.
- **Calf raises are separated** into standing, seated and leg-press calf raise variations; ambiguous legacy exercises remain in your personal records and are **not automatically renamed or reclassified**. Hamstring leg curls similarly offer seated/lying choices.
- Search supports common phrases such as “hamstring curl”, “leg press calves”, “standing calves” and “lat pull down”. There is a **microphone search button** that uses native browser speech recognition when supported. On unsupported iPhone/browser combinations, it focuses the search box for keyboard dictation.
- Voice recordings are **not saved by Lift Log**. The browser may use its own speech-processing service; permission and availability depend on the browser and operating system. Search works without permission.
- No change to workout storage keys or existing workout history. Please make a JSON backup before each update.

**Exercise image provenance:** 53 WebP reference images by [Open Exercise Illustrations / MarvinNazari](https://github.com/MarvinNazari/exercise-images), CC0-1.0 public domain. The dataset is AI-generated and not reviewed by a qualified coach; the drawings are for identifying exercises, not authoritative technique coaching. See `assets/exercises/asset-manifest.json` for the source and per-file SHA. We independently check the exercise names and variations, but equipment and posture details should not be treated as medical or professional instruction.

---

# Lift Log v0.4 — Workout tracker + guided AI-coach onboarding

A local-first, mobile-friendly Progressive Web App for gym loads, rep history, bodyweight check-ins, nutrition-goal starting guidance, and a personalized coaching interview.

**The guided interview and starting recommendations are rule-based. There is no live AI model connected to this app.** A real in-app agent will require a securely hosted API/backend; the next product architecture is described in `AI_AGENT_SPEC.md`.

## What's new in v0.4

- **Visual exercise gallery:** 24 built-in movements, original offline SVG illustrations, muscle filters, search by equipment or name, cues, and one-tap add/configure. These are identifying sketches, not precise exercise form demonstrations.
- **Modern home:** weekly workout goal (if entered in Coach), cardio minutes, conditional target-weight distance, concise quick logs and rotating training notes.
- **Strength trend chart:** select exercise, load or volume (load × sets × reps), period filter, and see best load and change. Values are day-level maxima for consistency; weight and volume are not direct muscle-gain measurements.
- **Manual cardio:** duration, distance, type, optional heart rate and notes, weekly minutes goal, and history. Device syncing is **not** active.
- **Friends preview:** entirely optional weekly-summary sharing via system share sheet/clipboard. No cloud group, live friends list, leaderboard, or automatic sharing exists.
- **All existing workout entries retained:** same `liftlog.v1` storage key, no migration or reset required. Export a JSON backup before updating.
- Updated PWA service worker cache version. Existing installations may need to close/reopen or refresh to fetch the update.

## What's new in v0.3

- Four-step onboarding interview covering goals, training, food habits, and recovery. Questions are optional and can be revisited.
- A “next useful question” hint that depends on what's missing from the current profile (simple rules, not AI).
- Weekly check-ins for average bodyweight, completed workouts, energy, performance, dietary consistency and optional pain flag.
- A **Copy coaching brief** action that packages your profile, recent workouts and weekly reviews as plain text to paste into ChatGPT **manually**. It does not send your data automatically.
- Preserved data format and browser storage compatibility with v0.2; backups also include the new interview and weekly-review fields.
- No automatic calorie or training target changes.

## Starting exercise data (Nov 17, 2026)

| Exercise | Load | Notes |
|---|---:|---|
| Leg press | 410 lb plates | Four 45 lb plates and one 25 lb plate **per side**, excluding sled |
| Calf raises | 90 lb plates | Two 45 lb plates total assumed; confirm per-side loading |
| Hamstring leg curl | 150 lb | Machine variation not yet specified |

## Run on your device

Unzip the folder. It can be opened directly in a desktop browser for a preview, but local storage and install behavior may vary with file:// URLs. For a reliable mobile install, host the folder over HTTPS:

1. Create a GitHub repository and upload the files **inside** the `lift-log-app` folder to the repository root.
2. Enable GitHub Pages → deploy from the main branch (root folder).
3. Open the GitHub Pages address on your iPhone in Safari → Share → Add to Home Screen.

Data currently lives only in that browser's localStorage. **This app does not sync automatically with ChatGPT, other devices, or a cloud database.** Use Settings → Export JSON periodically; the import feature replaces local data after confirmation.

## How to use the coaching interview

Open **Coach → Start interview**. Fill as much as you wish, move through four stages, then save a weekly review after you have real workout/physique observations. The Coach tab's starting calorie/protein numbers are *estimates*, not tailored medical recommendations.

To talk with an actual AI now, tap **Copy coaching brief**, then paste the text into a normal ChatGPT conversation. You decide what private details to share. In browsers without clipboard support, the app presents the text for manual copying.

## Files

- `index.html`, `styles.css`, `app.js` — core tracker and coach
- `v04.css`, `enhancements.js` — visual gallery, modern dashboard, progress trends, cardio and explicit share controls
- `icon.svg`, `sw.js`, `manifest.webmanifest` — installation/offline assets
- `AI_AGENT_SPEC.md` — agent behavior, data schema, tools, privacy and roadmap
- `COACH_ROADMAP.md` — original roadmap reference

## Important limitations

This prototype does not provide clinical advice, diagnose injuries, calculate body-fat percentage from photos, or provide a connected AI. No API keys or authentication are included. In a future production app, AI recommendations and model access must have explicit consent, privacy controls, and validation. Don't publish health-related user data or an API secret in a static site.