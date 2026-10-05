export const PICKS_ARE_PLACEHOLDERS = false;
export const PLAYOFF_ROUNDS = [
  { id: "F", label: "Wild Card", points: 5, winsNeeded: 2 },
  { id: "D", label: "Division Series", points: 10, winsNeeded: 3 },
  { id: "L", label: "Championship Series", points: 20, winsNeeded: 4 },
  { id: "W", label: "World Series", points: 30, winsNeeded: 4 },
];

// Stable bracket branches; entrants verified against the 2026 postseason schedule.
// A source is an opening entrant or the winner of an earlier bracket slot.
export const PLAYOFF_SLOTS = [
  { id: "AL-WC-1", round: "F", label: "AL Wild Card 1", sources: [147, 111] },
  { id: "AL-WC-2", round: "F", label: "AL Wild Card 2", sources: [117, 145] },
  { id: "NL-WC-1", round: "F", label: "NL Wild Card 1", sources: [135, 112] },
  { id: "NL-WC-2", round: "F", label: "NL Wild Card 2", sources: [144, 143] },
  { id: "AL-DS-1", round: "D", label: "AL Division Series 1", sources: [139, "AL-WC-1"] },
  { id: "AL-DS-2", round: "D", label: "AL Division Series 2", sources: [114, "AL-WC-2"] },
  { id: "NL-DS-1", round: "D", label: "NL Division Series 1", sources: [158, "NL-WC-1"] },
  { id: "NL-DS-2", round: "D", label: "NL Division Series 2", sources: [119, "NL-WC-2"] },
  { id: "AL-CS", round: "L", label: "AL Championship Series", sources: ["AL-DS-1", "AL-DS-2"] },
  { id: "NL-CS", round: "L", label: "NL Championship Series", sources: ["NL-DS-1", "NL-DS-2"] },
  { id: "WS", round: "W", label: "World Series", sources: ["AL-CS", "NL-CS"] },
];

// Original league submissions, in PLAYOFF_SLOTS order. "Cade" is Caden and
// "Cleveland" is the Guardians. Retain submitted lengths for the audit note;
// scoring caps over-length submissions at the round's final possible game.
const SUBMITTED_PICKS = {
  Dad: [[111, 3], [145, 3], [112, 3], [144, 3], [139, 5], [145, 7], [158, 6], [119, 5], [139, 5], [158, 7], [139, 7]],
  Cameron: [[147, 3], [117, 2], [135, 3], [144, 3], [139, 4], [117, 3], [158, 5], [119, 5], [139, 6], [158, 7], [158, 6]],
  Jack: [[147, 2], [145, 3], [135, 3], [144, 2], [139, 5], [114, 4], [158, 5], [119, 4], [139, 6], [158, 6], [139, 6]],
  Caden: [[147, 3], [145, 3], [112, 4], [144, 3], [139, 5], [145, 5], [158, 6], [119, 5], [145, 6], [119, 5], [119, 5]],
};

export const PLAYOFF_BRACKETS = Object.fromEntries(Object.entries(SUBMITTED_PICKS).map(([owner, picks]) =>
  [owner, Object.fromEntries(PLAYOFF_SLOTS.map((slot, index) =>
    [slot.id, {
      winnerId: picks[index][0], submittedLength: picks[index][1],
      length: Math.min(picks[index][1], PLAYOFF_ROUNDS.find((round) => round.id === slot.round).winsNeeded * 2 - 1),
    }],
  ))],
));

export const PICK_LENGTH_ADJUSTMENTS = Object.entries(PLAYOFF_BRACKETS).flatMap(([owner, picks]) =>
  PLAYOFF_SLOTS.filter((slot) => picks[slot.id].submittedLength !== picks[slot.id].length)
    .map((slot) => ({ owner, slot, ...picks[slot.id] })),
);
