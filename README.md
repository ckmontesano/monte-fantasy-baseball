# Montesano Fantasy Baseball

## Overview

Vue 3 site for the Montesano Fantasy Baseball league, updated for the 2026 season. The app now uses live MLB StatsAPI data at runtime with client-side caching in `localStorage` to keep calls low.

## Agent Start Here

- Agent operating notes: `AGENTS.md`
- League rules context: `docs/league-context.md`
- Efficient API workflows and examples: `docs/agent-workflows.md`
- MLB StatsAPI schema snapshot: `docs/api/swagger-docs.json`

## 2025 -> 2026 Rule Changes

- Wagers are collected up front on draft day instead of settling balances month by month.
- Regular-season team points are now calculated from true draft-day division odds, including negative odds.
- Draft value is prorated by round. Round 1 keeps full value, and rounds 2-7 step down by sevenths.
- Wild-card teams are now worth points, but only at end of season.
- Playoffs are a separate full-bracket prediction contest submitted before postseason play. Team ownership does not apply. Correct series winners earn 5/10/20/30 points by round; every series adds 1 point for the correct length only when the winner is also correct. Tied winners split the $200 pool. See `docs/league-context.md` for the complete rules.
- Special-case bonuses such as no-hitters or player record events are gone.
- Tie-breakers now follow MLB-style tie-break ordering instead of point sharing inside divisions.

## Runtime Data

- MLB standings are fetched live from StatsAPI and cached in `localStorage` for one hour.
- All-Star data is fetched live when available and cached in `localStorage` for twelve hours.
- 2026 draft ownership, odds, rounds, and stakes live in `src/data/season-2026.js`.
- Historical payout results are kept in `src/data/payout-history.js`.
- Team logos live in `src/assets/team-logos/`.
- Home Run Derby image lives in `src/assets/hrd-2025.jpg`.

## 2025 Season Results

Snapshot:
- Standings snapshot date: 2025-08-01

Payout Winners (monthly, April–August):
- April: Jack
- May: Jack
- June: Jack
- July: Dad
- August: Dad

Balances (net):
- Jack: +$140
- Dad: +$60
- Caden: -$100
- Cameron: -$100

## Playoffs Display

- The homepage (`#/`, also available at `#/playoffs`) displays live postseason series results and read-only fantasy standings. Regular-season standings, pools, payouts, and September details are at `#/regular-season`.
- `src/data/playoff-brackets-2026.js` contains the actual pre-playoff submissions for Dad, Cameron, Jack, and Caden (submitted as "Cade"). Predictions use stable slot IDs. Over-length picks are capped at the round's last possible game for scoring and simulations; original lengths are retained and all four adjustments are documented at the bottom of the page.
- First-place chances use 40,000 seeded simulations of remaining games, starting from actual series scores, with independent 50/50 game probabilities. Joint first-place finishes count for each tied participant, so percentages need not sum to 100%. This is a neutral scenario model, not a betting-odds forecast.
- Bracket branches and initial entrants are configured for the 2026 postseason schedule. Later-round entrants advance from completed feeder series; results come from MLB's schedule, not standings flags.
- Scores update every minute while the page is visible. Cached results are retained with a stale-data notice on failed updates.
- Sample scores never enter payout history or season balances. With actual validated brackets enabled, the $200 playoff award enters payout history only after all 11 series finish; ties split the pool.
- Verify scoring and chances: `node --test src/scripts/*.test.js`.

## Development

- Run locally: `npm run dev`
- Lint: `npm run lint`
