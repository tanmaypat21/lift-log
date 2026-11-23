# Lift Log v0.6.2 — Safer workout history and recovery

**Your data is important.** This release addresses two failure points: older exercises were difficult to find in the Journal, and startup could replace an unreadable local save with starter records.

## Find every logged weight

- **Home → My last working weights:** recent loads or saved default loads directly underneath the progress chart and training fact.
- **Journal → My last working weights:** all saved exercises, with the most recently dated entry and sets/reps when available. Saved starting loads are explicitly labeled when no dated entry exists.
- **Journal → Search all workouts and weights:** search by exercise name, date, or notes. The entire history is searched, not just the first eight days.
- **Journal → Every training day:** dated sessions remain grouped by date; tap **Show all training days** to expand the complete log. Records with invalid dates are shown in an **undated** group rather than silently hidden.
- A user's latest weight for an exercise is selected by actual workout date and, for multiple entries that day, last-saved sequence.

## Saving and recovery safeguards

- **Never replace an unreadable primary save with seed data.** If recovery is needed, keep the unreadable source and disable writes until compatible data can be restored.
- Stop automatically writing starter records every time the application opens.
- After successful saves, write an additional best-effort last-known-good copy and a separate **IndexedDB** snapshot. Keep up to 65 snapshots to help recover accidental local changes.
- **Settings → Recovery center:** inspect local snapshots, recover missing entries, export your full current log, or merge an older exported JSON file.
- **Import is merge-only**: existing newer exercises and entries remain; older unique record IDs are added. Merging the same file twice does not duplicate entries.
- **No migration** of `liftlog.v1` workout data, no changes to exercise IDs, and no deletion of previous entries during version upgrades.

### Important limitation

These protections are **local to one installed app/browser data container**. iOS can erase site data or separate the standalone Home Screen app's storage from Safari. Deleting/reinstalling the app, clearing website data, or running out of device storage can still erase both primary and recovery copies. **Export a complete JSON file regularly to Files/iCloud/another secure location.** True automatic cross-device, cloud-backed persistence will require authenticated accounts, a database and backups.

### Recover November 19 data without losing newer workouts

If you have `lift-log-backup-2026-11-19.json`, open **Settings → Recovery center → Merge previous JSON backup**. Confirm the added items; the merge should restore any missing November 19 records while retaining more recent items. The exported November 19 file has five saved exercises but only three dated workout entries. You cannot recreate workouts that were never written or backed up.

---

# Lift Log v0.6.1 — Search before logging + Ab Coaster

## New workout flow

- The Home **+ Log** button and Journal **+ Log exercise** actions now open the **full exercise library** first, with a searchable list of all available exercises and saved movements surfaced first.
- The chosen workout **date is carried through** to the new workout entry.
- If a movement does not exist, use the separate **+ Create Custom Exercise** action at the bottom of the picker. After saving that custom exercise, the log form opens automatically.
- The Train tab also places exercise search above the saved-exercise list and provides a clearly separated Custom Exercise button.

## Ab Coaster

- Added **Ab Coaster** to the Core / Machine category with searchable aliases and original, purpose-drawn start/end vector references showing the distinctive curved track, kneeling pad and handles.
- On an Ab Coaster, **0 lb represents zero added resistance**, not the user's bodyweight. Log sets and reps to track unweighted sessions, or enter extra resistance if the machine uses it.
- The progress chart now offers a **Reps** metric, useful for exercises performed without added weight. Individual weighted-load and volume metrics remain available for weighted exercises.
- The motion cue reflects the manufacturer's explanation: keep the upper body steady and draw the knee carriage forward along the curved track using the abdominal muscles.

## Data and privacy

- No migrations or resets of existing exercises, entries, cardio logs, goals, coach history or saved weights.
- Browser local storage still uses `liftlog.v1`; please export periodic backups.
- Exercise images are for recognizing equipment and movement, not substitutes for instruction or medical guidance.
- Existing friends, AI coaching and wearable features are unchanged.

---

# Lift Log v0.6 — Progress first + dated workout journal

## What changed
- **Progress is now the opening screen.** Choose one recorded exercise, see its best load over time or its calculated training volume, and change the chart between 30 days, 90 days, or all time. Only saved workout entries are used; no invented trend points.
- **Training fact immediately beneath the chart.** Tap refresh to read another short fitness note.
- **Journal replaces the confusing old per-exercise History tab.** Every strength and cardio entry is grouped by recorded date, newest first. Expand a day to see its individual exercises, weights, sets, reps, notes, and cardio activities.
- **Day-based logging.** Pick a workout date and a saved exercise, then log it into that day. The top-right **+ Log** shortcut is always available.
- **Edit or delete an existing logged lift** from its day card. The editor allows changing its date, sets, reps and notes. Direct-weight entries may also change recorded weight; plate-loaded weights remain locked to their original plate breakdown.
- **Simpler five-tab navigation:** Progress, Train, Journal, Cardio, Coach.
- **Works with the previous exercise catalog and personal backups.** The data key remains `liftlog.v1`; no history is reset, rewritten or uploaded.

## Accuracy and privacy
- Charts use the **highest load recorded per exercise/date** or **total logged volume (weight × sets × reps) for that exercise/date**.
- For volume charts, entries without sets or reps are excluded. Load comparisons are meaningful only on comparable machines/setup.
- Daily cards use the date entered in each record. Some old seed entries have missing sets/reps and are shown as such.
- Data remains local to the installed browser app. Export a JSON backup before changing devices, deleting browser data, or making a major upgrade.
- Fitness notes are general education, not personalized medical advice. The AI Coach tab is still the previous rules-based prototype.

## Tested
- Headless Chromium UI interactions with sample workout records: trend chart, fact placement, date-grouped journal, collapse/expand, quick-log date, edit record, and validation.
- Mobile widths 320, 375, 390 and 768 px showed no horizontal page overflow.
- Full real-device testing on iOS and GitHub Pages deployment still needs user verification.

---

# Lift Log v0.5.1 — Wide-grip pulldown and curl discovery

- Keeps the **v0.5 expanded library (340+ exercises)** and adds **Wide-Grip Lat Pulldown** as its own trackable movement, separate from close-grip and underhand pulldowns.
- Voice and text search now recognize natural phrases such as **"wide grip pull downs," "preacher curls," "incline curls,"** and **"hammer curls."**
- Already-saved custom exercises that have the same name as a catalog entry (for example, Preacher Curl) are identified as already tracked. Their previous entries and working weights are not overwritten or renamed.
- Adds brief context explaining grip and arm-angle differences without claiming that an exercise completely isolates one biceps head.
- Wide-grip pulldown uses the already bundled, local wide-bar lat-pulldown illustration for offline compatibility.
- No changes to workout storage, existing entry IDs, personal profiles, AI coaching, or cloud syncing. The PWA cache version is updated for new code.

---

# Lift Log v0.5 — Expanded exercise catalog (beta)

- The exercise picker now combines the previous 28 core movements with a large CC0 reference dataset: **340 strength/resistance records**, deduplicated by exercise ID, for **more than 340 distinct options** overall.
- Exercise names, muscle groups, equipment, aliases and search metadata ship inside the app for **offline search**.
- New images are fetched on demand from the public-domain [Open Exercise Illustrations](https://github.com/MarvinNazari/exercise-images) repository. They require an internet connection on first use; previously bundled reference images remain local.
- Category and equipment filters, search ranking and batches of 24 cards keep the phone interface responsive.
- More descriptive labels separate **quads (leg extensions)** from **hamstrings (leg curls)**. Images are identification references and are not medically or professionally vetted exercise instructions.
- Saved exercises, weight entries, coach information and cardio data retain the previous `liftlog.v1` local-storage format. No existing entries are automatically renamed or modified.
- The current build is still a static PWA; it has no cloud workout sync or live AI model.

## Source / rights

Open Exercise Illustrations (MarvinNazari) is published under CC0 1.0. The source states its illustrations are AI-generated and may contain equipment or form errors. Exercise recognition should rely on the exercise name, movement cues and equipment as well as the images.

---

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