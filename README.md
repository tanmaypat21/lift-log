# Lift Log v0.4 beta — visual exercise discovery, trends and cardio

This beta lives on a development branch until reviewed. It is a local-first PWA; **no real friends feed, wearable integration, or live AI is implemented**.

## What's new

- **Exercise gallery:** 25 common movements with self-contained simplified SVG illustrations, searchable names/equipment, muscle-group filters, and short identifying cues. Add and configure exercises from the gallery.
- **Strength charts:** compare recorded loads or calculated volume (weight × sets × reps), choose an exercise and date range, and see the best logged load. Multiple logs in one day use the highest value for the chart.
- **Cardio:** manually log sessions with activity type, time, distance, optional average heart rate and notes. Set an optional weekly minutes goal.
- **Streamlined home:** quick logs, weekly training summary, conditional goal-weight distance and rotating short training reminders.
- **Social preview:** share a weekly summary only by explicitly choosing metrics and invoking your phone's share sheet. No account, friend lists, cloud group or automatic upload.
- **Data preserved:** uses the existing `liftlog.v1` local storage key; no automatic data resets or seeded new workouts. Please export a backup before switching app versions.
- **Offline update:** changes the service-worker cache from v3 to v4 so updated assets can load on existing installs.

## Current limitations

Fitness band syncing needs a separate permission-based integration. HealthKit cannot be accessed directly by a plain GitHub Pages web app. Full group sharing requires secure authentication, a consent-aware database and users' sharing controls. Exercise drawings are identification aids, not precise biomechanical demonstrations.

---

# Lift Log v0.3 — Workout tracker + guided AI-coach onboarding

A local-first, mobile-friendly Progressive Web App for gym loads, rep history, bodyweight check-ins, nutrition-goal starting guidance, and a personalized coaching interview.

**The guided interview and starting recommendations are rule-based. There is no live AI model connected to this app.** A real in-app agent will require a securely hosted API/backend; the next product architecture is described in `AI_AGENT_SPEC.md`.

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

- `index.html`, `styles.css`, `app.js` — full editable PWA implementation
- `icon.svg`, `sw.js`, `manifest.webmanifest` — installation/offline assets
- `AI_AGENT_SPEC.md` — agent behavior, data schema, tools, privacy and roadmap
- `COACH_ROADMAP.md` — original roadmap reference

## Important limitations

This prototype does not provide clinical advice, diagnose injuries, calculate body-fat percentage from photos, or provide a connected AI. No API keys or authentication are included. In a future production app, AI recommendations and model access must have explicit consent, privacy controls, and validation. Don't publish health-related user data or an API secret in a static site.
