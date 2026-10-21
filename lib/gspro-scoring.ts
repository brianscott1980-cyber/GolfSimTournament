// GSPro and World Handicap System (WHS / USGA Rule 6.2) Allowance & Stroke Rules
// This engine ensures the on-screen scorecard calculation and layout match GSPro in-game competition.

export type SupportedFormat =
  | "Scramble stroke play"
  | "Fourball match play"
  | "Foursomes match play"
  | "Fourball Stableford";

export interface FormatRules {
  format: SupportedFormat;
  layout: "team" | "individual"; // "team" = 2 rows (pairings), "individual" = 4 rows (1 per player)
  scoringType: "match" | "stroke" | "stableford";
  description: string;
  allowanceFormula: string;
}

export const FORMAT_RULES: Record<SupportedFormat, FormatRules> = {
  "Scramble stroke play": {
    format: "Scramble stroke play",
    layout: "team",
    scoringType: "stroke",
    description: "2v2 Scramble (Team Best Shot)",
    allowanceFormula: "35% low handicap + 15% high handicap off the lowest team",
  },
  "Fourball match play": {
    format: "Fourball match play",
    layout: "individual",
    scoringType: "match",
    description: "2v2 Better Ball Match Play",
    allowanceFormula: "90% of the difference off the lowest player's handicap",
  },
  "Foursomes match play": {
    format: "Foursomes match play",
    layout: "team",
    scoringType: "match",
    description: "2v2 Alternate Shot Match Play",
    allowanceFormula: "50% combined team handicap played off the lowest team",
  },
  "Fourball Stableford": {
    format: "Fourball Stableford",
    layout: "individual",
    scoringType: "stableford",
    description: "2v2 Better Ball Stableford",
    allowanceFormula: "85% of full course handicap for each player",
  },
};

/**
 * Calculates strokes received on a hole given a playing handicap and the hole's stroke index (1–18).
 */
export function getStrokesOnHole(playingHandicap: number, strokeIndex: number): number {
  if (playingHandicap <= 0) return 0;
  let strokes = Math.floor(playingHandicap / 18);
  const remainder = playingHandicap % 18;
  if (strokeIndex <= remainder) strokes += 1;
  return strokes;
}

/**
 * Calculates GSPro-consistent handicap allowances and match play strokes based on the selected game format.
 */
export function calculateGSProHandicaps(
  format: SupportedFormat,
  teams: [
    { id: string; name: string; playerIds: string[]; playerHandicaps: number[] },
    { id: string; name: string; playerIds: string[]; playerHandicaps: number[] }
  ]
) {
  if (format === "Scramble stroke play") {
    // 2-person scramble: 35% low handicap + 15% high handicap
    const calcRawTeamHcp = (handicaps: number[]) => {
      const low = Math.min(...handicaps);
      const high = Math.max(...handicaps);
      return Math.round(0.35 * low + 0.15 * high);
    };

    const team0Raw = calcRawTeamHcp(teams[0].playerHandicaps);
    const team1Raw = calcRawTeamHcp(teams[1].playerHandicaps);
    const lowTeam = Math.min(team0Raw, team1Raw);

    return {
      layout: "team" as const,
      teams: [
        {
          ...teams[0],
          rawHandicap: team0Raw,
          playingHandicap: team0Raw - lowTeam,
          badge: team0Raw === lowTeam ? "SCRATCH" : `+${team0Raw - lowTeam} SHOTS`,
        },
        {
          ...teams[1],
          rawHandicap: team1Raw,
          playingHandicap: team1Raw - lowTeam,
          badge: team1Raw === lowTeam ? "SCRATCH" : `+${team1Raw - lowTeam} SHOTS`,
        },
      ],
      explainer: `Handicap allowance: 35% low HCP + 15% high HCP played off lowest team. ${teams[0].name} (${team0Raw}) vs ${teams[1].name} (${team1Raw}). Lowest team plays Scratch.`,
    };
  }

  if (format === "Foursomes match play") {
    // 2-person alternate shot: 50% combined team handicap, played off lowest team
    const calcRawTeamHcp = (handicaps: number[]) => {
      const sum = handicaps.reduce((a, b) => a + b, 0);
      return Math.round(0.5 * sum);
    };

    const team0Raw = calcRawTeamHcp(teams[0].playerHandicaps);
    const team1Raw = calcRawTeamHcp(teams[1].playerHandicaps);
    const lowTeam = Math.min(team0Raw, team1Raw);

    return {
      layout: "team" as const,
      teams: [
        {
          ...teams[0],
          rawHandicap: team0Raw,
          playingHandicap: team0Raw - lowTeam,
          badge: team0Raw === lowTeam ? "SCRATCH" : `+${team0Raw - lowTeam} SHOTS`,
        },
        {
          ...teams[1],
          rawHandicap: team1Raw,
          playingHandicap: team1Raw - lowTeam,
          badge: team1Raw === lowTeam ? "SCRATCH" : `+${team1Raw - lowTeam} SHOTS`,
        },
      ],
      explainer: `Handicap allowance: 50% combined team handicap played off lowest team. ${teams[0].name} (${team0Raw}) vs ${teams[1].name} (${team1Raw}). Lowest team plays Scratch.`,
    };
  }

  if (format === "Fourball match play") {
    // Better ball match play: 90% of difference from lowest individual player
    const allHandicaps = [...teams[0].playerHandicaps, ...teams[1].playerHandicaps];
    const lowestPlayerHcp = Math.min(...allHandicaps);

    const calcPlayer = (id: string, hcp: number) => {
      const diff = hcp - lowestPlayerHcp;
      const playing = Math.round(0.9 * diff);
      return {
        id,
        rawHandicap: Math.round(hcp),
        playingHandicap: playing,
        badge: playing === 0 ? "SCRATCH" : `+${playing} SHOTS`,
      };
    };

    const players0 = teams[0].playerIds.map((id, i) => calcPlayer(id, teams[0].playerHandicaps[i]));
    const players1 = teams[1].playerIds.map((id, i) => calcPlayer(id, teams[1].playerHandicaps[i]));

    return {
      layout: "individual" as const,
      players: [...players0, ...players1],
      explainer: `Handicap allowance: 90% of difference off lowest player (HCP ${lowestPlayerHcp.toFixed(1)}). Lowest player plays Scratch.`,
    };
  }

  // Fourball Stableford: 85% full course handicap for each player
  const calcPlayerStableford = (id: string, hcp: number) => {
    const playing = Math.round(0.85 * hcp);
    return {
      id,
      rawHandicap: Math.round(hcp),
      playingHandicap: playing,
      badge: `HCP ${playing}`,
    };
  };

  const players0 = teams[0].playerIds.map((id, i) => calcPlayerStableford(id, teams[0].playerHandicaps[i]));
  const players1 = teams[1].playerIds.map((id, i) => calcPlayerStableford(id, teams[1].playerHandicaps[i]));

  return {
    layout: "individual" as const,
    players: [...players0, ...players1],
    explainer: `Handicap allowance: 85% individual handicap allowance applied for Better Ball Stableford.`,
  };
}

