# Montesano Fantasy Baseball: League Operations Guide (2026)

This document is the normalized operating guide for agents and maintainers. It preserves the 2026 league rules while organizing them for faster decision-making.

## League Intent

- Reward sharp drafting decisions (especially early-round risk/reward).
- Keep scoring team-focused instead of player-event focused.
- Keep payout handling simple by collecting money up front.
- Align tie resolution with MLB tie-break procedures.

## Season Structure and Wagers

- Regular season scoring months: April, May, June, July, August, September.
- March is excluded from monthly winner calculations.
- Monthly wager: $20 per person; four-owner gross winner payout: $80 ($60 net winnings plus the returned $20 deposit).
- All-Star event is a separate pool: $30 per person; four-owner gross winner payout: $120 ($90 net winnings plus the returned $30 deposit).
- Playoffs are a separate pool: $50 per person.
- Total annual commitment per person: $200.
- Wagers are collected on draft day and held for end-of-season distribution.
- Payout history and season winnings count gross awards, including returned deposits. The unallocated pot is total collected deposits minus gross awards, not cash already disbursed. Shared awards split the full pool once, with no additional deposit refund.
- With four owners: $800 collected minus six $80 monthly awards and one $120 All-Star award leaves $200 allocated to the playoff pool.

## Regular Season Monthly Winner Logic

- Each drafted team can earn points based on preseason division odds.
- At each month-end (April through September), total points by owner.
- Highest monthly point total wins the month.
- If tied, resolve using tie-break rules in this document.

## Team Point Calculation

Base wager model is fixed at $100 equivalent per team for point calculation.

### 1) Convert odds to base points

- Positive odds (`+X`):

```text
basePoints = 100 * ((X / 100) + 1)
```

- Negative odds (`-Y`):

```text
basePoints = 100 * ((100 / |Y|) + 1)
```

### 2) Apply round-based prorate multiplier

```text
multiplier = (8 - draftRound) / 7 // rounds 1 through 7
finalPoints = round(basePoints * multiplier)
```

- Earlier picks retain more value; later picks are discounted.
- Round 1 effectively receives no discount.
- Final points are rounded to nearest whole number.

## Tie-Break Rules

### Two-team tie

Apply in order until resolved:

1. Head-to-head record
2. Intradivision record
3. Interdivision record (within same league, outside division)
4. Last half of intra-league games

### Three-team tie

Apply in order until resolved:

1. Combined head-to-head winning percentage among tied teams
2. Intradivision record

No shared division points in ties; follow deterministic MLB-style resolution.

## Wild Card Team Points (End of Season)

Wild card teams (playoff teams that did not win their division) earn points in September only, alongside division-winner points. April–August remain division-only. This odds-based rule supersedes the previous 75%-of-average rule.

1. Use the fixed **Make Playoffs** percentages supplied by the league from [FanGraphs, March 25, 2026](https://www.fangraphs.com/standings/playoff-odds/fg/div?date=2026-03-25), stored in `src/data/playoff-odds-2026.js`.
2. With `p = percentage / 100`, convert to American odds: `100 * (1 - p) / p` for `p <= 0.5`, otherwise `-100 * p / (1 - p)`.
3. Apply the same $100 return and round multiplier as division points, retaining full precision until final team points are rounded. Equivalently, `round((100 / p) * multiplier)`.
4. Only confirmed playoff qualifiers that did not win a division receive wild-card awards. Division winners receive their existing division points only; undrafted teams earn no owner points.
5. September payouts wait for all six division champions and six wild-card qualifiers to be confirmed. The September Points tab labels partial results as pending. Season regular-season standings are used so a delayed finish is included.

Missing or zero probabilities require resolution rather than silently awarding zero points.

## All-Star Break Scoring (Separate Competition)

All-Star scoring is independent from regular-season monthly scoring.

### All-Star Game

- Each active-roster All-Star player awards 6 points to the owner of that MLB team.
- If that player is on the winning league (AL/NL), add 6 bonus points.

### Home Run Derby

- Each participant picks one winner candidate.
- Correct winner pick = 40 points.
- If no one picked the champion, award win to the pick that advanced farthest.
- Ties award full 40 points to each tied winner.

## Playoffs Scoring (Separate Competition)

Playoffs are a separate, bracket-based prediction competition. Points reset; regular-season results do not carry over. Drafted MLB team ownership, preseason odds, and draft-round multipliers do not apply.

### Bracket Submission

- Each participant submits a full bracket just before the playoffs begin.
- All series-winner and series-length predictions are made before the playoffs start, rather than before each round.

### Series Prediction Points

- Correct Wild Card series winner: 5 points
- Correct Division Series winner: 10 points
- Correct Championship Series winner: 20 points
- Correct World Series winner: 30 points
- Every series offers a +1 bonus for correctly predicting both the winner and the exact series length (clinching game number).
- Correct winner, wrong series length: award the round's base points only.
- Wrong winner: award 0 points, even if the predicted series length is correct.
- Example: a correctly predicted Division Series winner in four games earns 11 points if it wins in four, 10 if it wins in another number of games, and 0 if it loses.
- A perfect bracket earns 121 points: 110 base points across all 11 series (four Wild Card, four Division Series, two Championship Series, one World Series), plus 11 bonuses.

### Playoff Winner and Payout

- Highest total bracket points wins the playoff pool.
- Entry is $50 per person; four participants create a $200 gross pool, including returned entry deposits.
- Tied highest-scoring participants split the full pool equally. For example, two winners receive $100 each. Do not add a separate deposit refund.
- The regular-season MLB tie-break procedures do not apply to ties in playoff bracket points.

## Operational Decision Checklist for Agents

When answering scoring or payout questions:

1. Identify context: regular month, all-star, or playoffs.
2. Confirm whether March should be excluded.
3. For regular season, compute base odds points then apply round multiplier.
4. Round final values to nearest whole number.
5. If tie exists, apply tie-break chain exactly in order.
6. Keep wild card scoring as end-of-season only.
7. Do not add special-case player events (no-hitters, records, etc.).

## Canonical Source Note

This guide is normalized from the 2026 rules document and should be treated as the operational reference for agent outputs in this repo.
