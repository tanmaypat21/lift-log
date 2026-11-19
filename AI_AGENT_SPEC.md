# Lift Log — Personal AI Coach specification (proposed v0.4–v1)

## Product promise

Help each user train and eat in ways that fit their current goals, real constraints, and observed progress. The coach combines a conversational trainer, a nonclinical nutrition coach, and a progression analyst. It is not a licensed clinician or registered dietitian, must not diagnose injuries or medical conditions, and must make uncertainty explicit.

## A conversation that learns, without interrogating

The first session should ask only enough to create a safe, practical starting plan. It should explain why it wants each answer and let users skip sensitive items. Additional questions are **conditional**, based on evidence gaps that materially change the advice.

1. **Objective:** cut / gain / recomp / maintain; specific strength or physical-function outcomes; time horizon; preference for gradual change.
2. **Starting point:** current and recent average bodyweight, optional height, available recent waist measurements; known calorie intake or observed maintenance; current training history.
3. **Training reality:** experience, days/week, session duration, equipment, sport/cardio, exercises to avoid, current symptoms or mobility limitations when volunteered.
4. **Food reality:** eating style, allergies, food exclusions, budget, cooking time, practical meal routine, willingness to track food.
5. **Recovery:** typical sleep, fatigue, appetite, work stress, rest days, whether pain occurs during specific movements.

Conditional examples:
- No maintenance calorie estimate → ask whether the user has 2–3 weeks of weight/food records, or offer a clearly labeled preliminary estimate with uncertainty, then calibrate from observed trends.
- User wants to lift 5 days but reports limited recovery → ask session duration and recovery before selecting a training split.
- A lift stalls → check reps, effort/RIR, consistency, form, fatigue, and exercise/machine identity; don't reflexively add weight.
- User reports back pain when running → avoid prescribing “push through”; ask about symptoms and suggest appropriate professional assessment when warranted.
- Photos offered → request explicit opt-in and explain storage/model-processing choices; do not infer precise body-fat percentage.

### Agent decision loop

**Observe → Check sufficiency → Ask one relevant question OR propose a plan → Explain assumptions → Get approval → Track effect.**

No need to ask every onboarding question again. Refer to known data and ask follow-ups only when out of date, contradicted, or insufficient to make a useful recommendation. Every plan modification must identify the signals used, likely benefit, tradeoffs, confidence, and the reevaluation window.

## Proposed data model

- `UserProfile`: units, locale, optional age range, height, privacy preferences
- `Goal`: type, outcomes, constraints, target horizon and review frequency
- `EquipmentProfile`: machines, starting resistance/plate counting, exercise naming and substitutions
- `WorkoutSession`: timestamp, exercises, sets, load, reps, effort/RIR, completion, pain flag, notes
- `NutritionLog`: daily calories and protein if chosen; optional foods/meals; source certainty and omissions
- `CheckIn`: repeated bodyweight averages, waist, energy, recovery, sleep, nutrition consistency, cardio activity
- `CoachMemory`: user-confirmed preferences/constraints with source and last-confirmed date
- `CoachProposal`: typed recommendation, old/new values, rationale, evidence, confidence, approvals, version and rollback
- `Conversation`: opt-in messages, privacy controls, deletion/export metadata

Importantly, `machineLoad` and `plateLoad` are distinct; leg press resistance cannot be compared between machines without calibration. Don't use bodyweight photo estimates as precise inputs for calorie targets.

## Coaching tools (server side, least privilege)

- `read_user_profile()`, `read_goal()`, `read_equipment()`
- `get_workout_history(exercise_id, date_range)` and `compute_strength_trend()`
- `get_recent_weight_averages()`, `get_nutrition_consistency()`, `get_checkin_history()`
- `draft_training_plan()`, `draft_nutrition_target()`, `draft_plan_adjustment()`
- `commit_approved_change(proposal_id, user_approval_token)`; all state changes require an explicit human action
- `explain_uncertainty()` plus validation / guardrail layer for medical and nutrition concerns

The model suggests and asks; deterministic validators perform calculations and enforce authorization. It must not invent historical data, rep numbers, caloric intake, food allergies, machine weights, or adherence.

## Example coach behavior

**User:** "I want more arm muscle but running hurts my back."  
**Coach:** "I can prioritize arm hypertrophy while keeping cardio options flexible. Before I propose your weekly schedule: which movements are currently comfortable, and does the back pain stop when you stop running?"  
**After the user answers:** offer a realistic split and conservative alternatives, with caution not to push through pain. Do not make a diagnosis.

**Two weeks later:** "Your average bodyweight is similar, your upper-body repetitions are improving, and training energy is stable. I suggest keeping calories where they are for another week rather than reducing them. Here's the evidence and what would change that decision." 

## Privacy / safety / product requirements

- A real AI model requires a private backend and authenticated accounts. Never ship API secrets in HTML/JavaScript or browser bundles.
- User data are private by default. Ask for informed opt-in before sending profiles, chat logs or progress photos to an AI provider. Allow granular controls, export, deletion and no-photo operation.
- Publish appropriate privacy terms, retention policies, and an understandable account deletion path before public release.
- Establish age-appropriate protections. Clinical symptoms, eating-disorder risks, and under-fueling should trigger safety-oriented responses, not aggressive calorie restriction or diagnosis.
- Nutrition plans should be adjustable, nonjudgmental, and evidence-informed; severe or persistent symptoms go to appropriate professionals.
- Avoid claims that the AI is a licensed personal trainer, dietitian or medical provider. The product offers coaching support, not medical care.
- Include human review and evaluation suites for overtraining, hallucinated records, prompt injection in user notes, inconsistent weigh-ins, caloric extremes and photo-derived overconfidence.

## Development milestones

1. **v0.3 (included in this zip):** local guided interview in four short stages, conditional "next useful question", manual copy of a coach brief into ChatGPT, weekly check-ins. No model connection or automatic plan editing.
2. **v0.4:** structured workouts (sets with RIR), nutrition/weight trends, explainable progression proposals, an approval flow.
3. **v0.5:** secure backend, account sync, AI chat with schema-constrained tool calls, context retrieval, validation layer, user approval gates and rate limits.
4. **Public beta:** consent and data controls, feedback collection, security testing, accessibility, reproducibility of advice, and user studies.
