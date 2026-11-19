# Lift Log — AI coach product roadmap

## Proposed product behavior

**A fitness coach, not a diagnosis service.** The agent takes the user's stated goal (cut, maintain, recomp, bulk), current bodyweight and weekly averages, optional waist measurements, gym log (working weight, reps, sets, RPE/RIR), training time, fatigue/recovery, dietary preferences and optional nutrition log, and suggests explainable, reversible adjustments. It should never autonomously edit a target without approval.

### Workout capabilities
- Ask available equipment, weekly schedule, baseline experience, time limits, and pain or exercise restrictions.
- Recommend exercise swaps, working-set targets, rep ranges, progression rules, and a realistic weekly split.
- Detect plate-vs-machine loads and preserve exact machine identity before making comparisons.
- Identify stalled lifts only after adequate comparable records, and recommend a deload or alternate exercise when appropriate.
- Avoid directives to push through pain; encourage clinical evaluation for concerning symptoms.

### Nutrition capabilities
- Start from the user's observed maintenance estimate or calculate a transparent estimate with required anthropometrics and activity, not physique photos alone.
- Estimate calories based on goal, then adjust only after several weeks of weight averages, exercise performance, recovery and dietary adherence; aim for gradual changes.
- Offer a modifiable protein target and meal suggestions honoring food preferences/allergies.
- Distinguish measured data from estimates, show confidence/uncertainty, and surface red flags for under-fueling.

### Physique progress
- Opt-in measurement trend log. Optional progress-photo upload only after explicit consent with settings to delete, export, limit model access, and avoid public exposure.
- Do not claim exact body-fat percentage, nutrition needs, health status or progress from one photograph.
- Compare same-lighting/same-pose images with user review; support an entirely non-photo workflow.

## Architecture for a real AI coach

1. **Client:** existing PWA initially, maybe native wrapper later. Structured forms and optional chat UI.
2. **Backend:** authenticated API, per-user permissions, protected secrets/API credentials, rate limits, logging with redaction, abuse defenses. Never place a model provider API key into public JavaScript.
3. **Database:** user account, workout entries, nutrition/goal settings, measurements; private object storage for opt-in photos. Provide export/delete controls.
4. **Model orchestration:** server-side LLM with tool calls to read narrowly scoped data, generate a *proposal* (target change, workout recommendation, reasoning, confidence) under a structured schema; deterministic sanity checks for calorie ranges, progression constraints and consistency before display.
5. **Approval UX:** show side-by-side current vs proposed plan; require a click to apply changes. Explain why and let the user revert.
6. **Evaluation:** test common scenarios (missing data, unrealistic goals, injuries/pain, overtraining, misinformation, prompt injection in notes); opt in to analytics and carefully test recommendations before public release.

## Milestones

- **v0.2 (previous):** local-only weight log + coach profile and transparent rule-based guidance.
- **v0.3:** bodyweight/waist trend charts, RPE/RIR, workout templates, nutrition logging, strength-based rep progression logic.
- **v0.4:** private backend, optional cloud sync, secure accounts and user data controls.
- **v0.5:** real AI agent (secure model API, retrieval, explained recommendations and approval) with safety checks.
- **v1.0:** beta testing, data/privacy documentation, accessibility, account deletion, support, public release.
