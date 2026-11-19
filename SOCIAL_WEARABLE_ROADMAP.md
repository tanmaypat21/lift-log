# Friends, privacy and wearable integrations — planned

## Friends & groups (future; not in the beta)

A real group needs member identities, invites, consent, live data retrieval and revocation—not just a local share card.

- A user may create a private group and invite friends through a single-use invite.
- Each member chooses a default of **share nothing**, with opt-in fields such as workout consistency, cardio minutes, best lifts, and milestone achievements.
- Visibility must be separated from group membership; users can hide individual exercises or entire profiles.
- For exercise comparisons, clarify machine, resistance basis, unit, and lifts' conditions, and avoid ranking members on bodyweight or calorie restriction.
- The app must allow leaving a group, revoking all sharing, deleting data and blocking others.
- Start with private chronological group activity; add optional friendly challenges only after moderation, abuse prevention and privacy controls.

### Technical prerequisite

Use server-side identity (e.g., OAuth/passkeys), secure access controls on a database, typed group memberships, per-field consent, and revocation checks on every read. No personal fitness data should be stored in a public GitHub repository or baked into GitHub Pages assets.

## Wearable data import (future; not in beta)

The v0.4 Cardio screen is manual entry only. Importing Apple Health, Google Health Connect, Garmin, Fitbit or other provider data requires specific integrations, platform capabilities, consent, and sometimes approved developer access.

- **Apple Health:** HealthKit is a native Apple framework, not directly accessible from a static GitHub Pages PWA. A native iOS companion or another authorized data-provider connector would be required.
- **Android:** Health Connect integration requires a native Android component and permissions.
- **Other devices:** use official APIs and supported permissions where available. Don't scrape account credentials.
- Ask for narrowly scoped read permissions such as workouts, duration and distance; do not request unrelated health records.
- Preserve source, timestamp, timezone and workout IDs so imports can be deduplicated.
- Show user what will be imported; allow disabling sync and deleting imported records.
- Respect API rate limits and explain data gaps when source devices disagree.

## Privacy and quality gates before public release

1. Data export and deletion tested, including group revocation.
2. No unapproved automatic publication to groups or external services.
3. Backend access control tests, session security, encryption in transit and at rest.
4. Reliable deduplication of multiple devices and manual cardio entries.
5. Clear limits for coaching recommendations and review of health-data handling.
6. An explicit user choice before any third-party AI processing of bodyweight, photos or nutrition logs.

Until that backend exists, the app offers only a share-sheet/clipboard **preview** of a voluntarily selected weekly summary. No friends can access data through the app.