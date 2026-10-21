import { courses } from "./courses";
export type Player = { id: string; name: string; handicap: number };
export const defaultPlayers: Player[] = [
  { id: "brian", name: "Brian Scott", handicap: 25.1 },
  { id: "john", name: "John Colreavey", handicap: 10.3 },
  { id: "derek", name: "Derek McMillan", handicap: 9.0 },
  { id: "tony", name: "Tony McLean", handicap: 2.6 },
];
export type Format =
  | "Fourball match play"
  | "Foursomes match play"
  | "Scramble stroke play"
  | "Fourball Stableford";
export const formats: Format[] = [
  "Fourball match play",
  "Foursomes match play",
  "Scramble stroke play",
  "Fourball Stableford",
];
export type Pin = { hole: number; playerId?: string; distance?: number };
export type HoleScore = {
  playerId: string;
  hole: number;
  strokes: number;
  putts?: number;
  fairway?: boolean;
  gir?: boolean;
};
export type Round = {
  id: string;
  courseId: string;
  date: string;
  format: Format;
  teams: [string[], string[]];
  result?: "A" | "B" | "draw";
  pins: [Pin, Pin];
  hio: number[];
  scores: HoleScore[];
};
export type Tournament = {
  id: string;
  name: string;
  subtitle: string;
  players: Player[];
  rounds: Round[];
  createdAt: string;
  scoreResetVersion?: number;
  secondCourseSetupVersion?: number;
  thirdCourseSetupVersion?: number;
  fixedPairing?: { courseId: string; players: [string, string] };
};
export { courses } from "./courses";

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function drawTeams(
  ids: string[],
  random = Math.random,
): [string[], string[]][] {
  if (ids.length !== 4 || new Set(ids).size !== 4)
    throw new Error("Exactly four unique players are required.");
  const [a, b, c, d] = shuffle(ids, random);
  const pairs: [string[], string[]][] = [
    [
      [a, b],
      [c, d],
    ],
    [
      [a, c],
      [b, d],
    ],
    [
      [a, d],
      [b, c],
    ],
  ];
  const ordered = shuffle(pairs, random);
  return ordered;
}
export function drawTournamentTeams(
  tournament: Tournament,
  random = Math.random,
): [string[], string[]][] {
  const teams = drawTeams(
    tournament.players.map((p) => p.id),
    random,
  );
  const fixed = tournament.fixedPairing;
  if (!fixed) return teams;
  const target = tournament.rounds.findIndex(
    (round) => round.courseId === fixed.courseId,
  );
  if (target === -1) return teams;
  const paired = teams.findIndex((match) =>
    match.some((team) => fixed.players.every((id) => team.includes(id))),
  );
  if (paired === -1)
    throw new Error("The fixed pairing must contain two tournament players.");
  [teams[target], teams[paired]] = [teams[paired], teams[target]];
  return teams;
}

export function standings(t: Tournament) {
  return t.players
    .map((p) => {
      const played = t.rounds.filter((r) => r.result);
      const wins = played.filter(
        (r) =>
          r.result !== "draw" &&
          r.teams[r.result === "A" ? 0 : 1].includes(p.id),
      ).length;
      const draws = played.filter((r) => r.result === "draw").length;
      return {
        ...p,
        played: played.length,
        wins,
        draws,
        points: wins * 3 + draws,
        pins: t.rounds
          .flatMap((r) => r.pins)
          .filter((pin) => pin.playerId === p.id).length,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name),
    );
}
export function createTournament(
  name: string,
  players: Player[],
  start: string,
): Tournament {
  const teams = drawTeams(players.map((p) => p.id));
  return {
    id: crypto.randomUUID(),
    name,
    subtitle: "Four friends. Three rounds. All to play for.",
    createdAt: new Date().toISOString(),
    players,
    rounds: teams.map((team, i) => {
      const date = new Date(start + "T12:00:00");
      date.setDate(date.getDate() + i * 7);
      return {
        id: crypto.randomUUID(),
        courseId: courses[i].id,
        date: date.toISOString().slice(0, 10),
        format: formats[i],
        teams: team,
        pins: [{ hole: 7 }, { hole: 13 }],
        hio: [7, 13],
        scores: [],
      };
    }),
  };
}
export const demo: Tournament = {
  id: "autumn-series",
  scoreResetVersion: 1,
  secondCourseSetupVersion: 1,
  thirdCourseSetupVersion: 1,
  fixedPairing: { courseId: "trump-aberdeen", players: ["brian", "tony"] },
  name: "The Autumn Invitational",
  subtitle: "Good mates. Great courses. A little friendly rivalry.",
  createdAt: "2026-10-21",
  players: defaultPlayers.map((player) => ({ ...player })),
  rounds: [
    {
      id: "r1",
      courseId: "currahee",
      date: "2026-10-21",
      format: "Fourball match play",
      teams: [
        ["brian", "john"],
        ["derek", "tony"],
      ],
      pins: [{ hole: 2 }, { hole: 17 }],
      hio: [2, 4, 12, 17],
      scores: [],
    },
    {
      id: "r2",
      courseId: "trump-aberdeen",
      date: "2026-10-28",
      format: "Scramble stroke play",
      teams: [
        ["brian", "tony"],
        ["john", "derek"],
      ],
      pins: [{ hole: 6 }, { hole: 16 }],
      hio: [6, 16],
      scores: [],
    },
    {
      id: "r3",
      courseId: "dpc-scottsdale",
      date: "2026-11-04",
      format: "Foursomes match play",
      teams: [
        ["brian", "derek"],
        ["john", "tony"],
      ],
      pins: [{ hole: 7 }, { hole: 15 }],
      hio: [7, 15],
      scores: [],
    },
  ],
};
export function validateScores(
  rows: Record<string, string>[],
  players: Player[],
): HoleScore[] {
  if (!rows.length) throw new Error("The file has no score rows.");
  const seen = new Set<string>();
  return rows.map((row, i) => {
    const player = players.find(
      (p) =>
        p.name.toLowerCase() === row.player?.trim().toLowerCase() ||
        p.id === row.player,
    );
    const hole = Number(row.hole),
      strokes = Number(row.strokes);
    if (
      !player ||
      !Number.isInteger(hole) ||
      hole < 1 ||
      hole > 18 ||
      !Number.isInteger(strokes) ||
      strokes < 1 ||
      strokes > 30
    )
      throw new Error(
        `Row ${i + 2}: use a tournament player, hole 1–18 and strokes 1–30.`,
      );
    const key = player.id + ":" + hole;
    if (seen.has(key))
      throw new Error(`Row ${i + 2}: duplicate player and hole.`);
    seen.add(key);
    const putts = row.putts?.trim() ? Number(row.putts) : undefined;
    if (
      putts !== undefined &&
      (!Number.isInteger(putts) || putts < 0 || putts > strokes)
    )
      throw new Error(`Row ${i + 2}: invalid putts.`);
    for (const field of ["fairway", "gir"])
      if (
        row[field]?.trim() &&
        !["true", "false", "1", "0"].includes(row[field].trim().toLowerCase())
      )
        throw new Error(`Row ${i + 2}: ${field} must be true or false.`);
    const flag = (v: string) =>
      v?.trim() ? ["true", "1"].includes(v.trim().toLowerCase()) : undefined;
    return {
      playerId: player.id,
      hole,
      strokes,
      putts,
      fairway: flag(row.fairway),
      gir: flag(row.gir),
    };
  });
}

// Upgrade only the original sample roster, preserving rounds and recorded scores.
export function migrateLegacyRoster(tournaments: Tournament[]): Tournament[] {
  const legacyNames = [
    "Brian Scott",
    "James Wilson",
    "Tom Mitchell",
    "Daniel Clark",
  ];
  const ids: Record<string, string> = {
    brian: "brian",
    james: "john",
    tom: "derek",
    dan: "tony",
  };
  const playerId = (id: string) => ids[id] ?? id;
  return tournaments.map((tournament) => {
    if (
      tournament.id !== demo.id ||
      tournament.players.length !== 4 ||
      !tournament.players.every((p, i) => p.name === legacyNames[i])
    )
      return tournament;
    return {
      ...tournament,
      players: defaultPlayers.map((p) => ({ ...p })),
      rounds: tournament.rounds.map((round) => ({
        ...round,
        teams: round.teams.map((team) => team.map(playerId)) as Round["teams"],
        pins: round.pins.map((pin) => ({
          ...pin,
          playerId: pin.playerId ? playerId(pin.playerId) : undefined,
        })) as Round["pins"],
        scores: round.scores.map((score) => ({
          ...score,
          playerId: playerId(score.playerId),
        })),
      })),
    };
  });
}

// Apply tonight's confirmed setup once to the original starter tournament.
// The old date/course identify the placeholder; later saved results are untouched.
function applyOpeningCourseSetup(tournaments: Tournament[]): Tournament[] {
  return migrateLegacyRoster(tournaments).map((tournament) => {
    const opening = tournament.rounds[0];
    if (
      tournament.id !== demo.id ||
      opening?.courseId !== "bandon" ||
      opening.date !== "2026-10-15"
    )
      return tournament;
    const placeholder =
      opening.scores.length === 0 &&
      opening.result === "A" &&
      opening.pins[0].playerId === "john" &&
      opening.pins[0].distance === 5.2 &&
      opening.pins[1].playerId === "derek" &&
      opening.pins[1].distance === 8.4;
    return {
      ...tournament,
      createdAt: "2026-10-21",
      rounds: tournament.rounds.map((round, index) =>
        index === 0
          ? {
              ...round,
              courseId: "currahee",
              date: "2026-10-21",
              ...(placeholder
                ? {
                    result: undefined,
                    pins: [{ hole: 2 }, { hole: 17 }] as Round["pins"],
                  }
                : {
                    pins: round.pins.map((pin, i) => ({
                      ...pin,
                      hole: [2, 17][i],
                    })) as Round["pins"],
                  }),
              hio: [2, 4, 12, 17],
            }
          : {
              ...round,
              date:
                round.date === "2026-10-22"
                  ? "2026-10-28"
                  : round.date === "2026-10-29"
                    ? "2026-11-04"
                    : round.date,
            },
      ),
    };
  });
}

// One-time reset requested before the first real round. Persisting the version
// prevents future, genuine match results being cleared on refresh or cloud load.
function applyInitialTournamentDefaults(
  tournaments: Tournament[],
): Tournament[] {
  return applyThirdCourseSetup(
    applySecondCourseSetup(applyOpeningCourseSetup(tournaments)),
  ).map((tournament) => {
    if (tournament.id !== demo.id || tournament.scoreResetVersion === 1)
      return tournament;
    return {
      ...tournament,
      scoreResetVersion: 1,
      rounds: tournament.rounds.map((round) => ({
        ...round,
        result: undefined,
        scores: [],
        pins: round.pins.map(({ hole }) => ({ hole })) as Round["pins"],
      })),
    };
  });
}

// Persist the confirmed second course once, keeping the existing draw and dates.
function applySecondCourseSetup(tournaments: Tournament[]): Tournament[] {
  return tournaments.map((tournament) => {
    if (tournament.id !== demo.id || tournament.secondCourseSetupVersion === 1)
      return tournament;
    return {
      ...tournament,
      secondCourseSetupVersion: 1,
      rounds: tournament.rounds.map((round, index) =>
        index === 1 ? { ...round, courseId: "trump-aberdeen" } : round,
      ),
    };
  });
}

// Persist the confirmed third course once, preserving subsequent manual edits.
function applyThirdCourseSetup(tournaments: Tournament[]): Tournament[] {
  return tournaments.map((tournament) => {
    if (tournament.id !== demo.id || tournament.thirdCourseSetupVersion === 1)
      return tournament;
    return {
      ...tournament,
      thirdCourseSetupVersion: 1,
      rounds: tournament.rounds.map((round, index) =>
        index === 2 ? { ...round, courseId: "dpc-scottsdale" } : round,
      ),
    };
  });
}

// Apply Brian and Tony's requested partnership once, then retain the saved draw.
export function applyInitialTournamentSetup(
  tournaments: Tournament[],
): Tournament[] {
  return applyInitialTournamentDefaults(tournaments).map((tournament) => {
    if (
      tournament.id !== demo.id ||
      tournament.fixedPairing ||
      tournament.rounds.some((round) => round.result)
    )
      return tournament;
    const configured: Tournament = {
      ...tournament,
      fixedPairing: { courseId: "trump-aberdeen", players: ["brian", "tony"] },
    };
    const teams = drawTournamentTeams(configured);
    return {
      ...configured,
      rounds: configured.rounds.map((round, i) => ({
        ...round,
        teams: teams[i],
      })),
    };
  });
}
