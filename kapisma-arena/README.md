# Kapışma Arena — Android test APK (0.1)

This is a standalone package (`com.kapismaarena.game`), unrelated to the Aracım Pro application.

Features: premium dark/neon UI, main menu, offline demo quiz with 10 questions per match, local scores/stats, demo leaderboard, leagues, tournaments and friend-invite placeholder.

**IMPORTANT:** Live matchmaking, actual remote player statistics and multiplayer rooms are not implemented or connected. All avatars and leaderboard results are demonstration data. The practice match is against a simulated bot. No Firebase/Cloudflare deployment or AdMob keys are included.

Build: `gradle :app:assembleDebug` from this folder, requires Android SDK 35 and Java 17.

## v0.3
- Compact 2x2 action tiles and shortened hero/footer
- 3.5-second animated splash with original local synthesised fanfare and persisted sound toggle
- Slower question transitions (1.65s results + 0.3s fade) and smooth page animations
- No online matchmaking: bot remains explicitly labelled.
