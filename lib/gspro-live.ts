import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export interface GSProShot {
  ShotID: string;
  UserGuid?: string;
  RoundID?: number;
  PlayerName: string;
  ShotResult?: number;
  HoleResult?: number;
  Hole: number; // 0-indexed in GSPro
  HoleShot: number;
  DistanceToPin: number;
  GlobalShotNumber?: number;
  StartingSurface?: number;
  EndingSurface?: number;
  BallSpeed: number;
  StartingPOS?: { x: number; y: number; z: number };
  EndingPOS?: { x: number; y: number; z: number };
  HolePar: number;
  CourseKey: string;
  TotalDistance: number;
  ClubIndex?: number;
  GhostData?: {
    cy?: number;
    atShotData?: {
      tdpoint?: { x: number; y: number; z: number };
    };
  };
  activeShot?: {
    sd?: {
      tdpoint?: { x: number; y: number; z: number };
      BallStartPos?: { x: number; y: number; z: number };
    };
  };
}

export interface GSProHoleScore {
  hole: number;
  gross: number;
  net: number;
  par: number;
  strokeIndex: number;
  distanceYards?: number;
  handicapStrokes: number;
}

export interface GSProTeamScorecardRow {
  id: string;
  name: string;
  playerNames: string[];
  handicap: number;
  scores: GSProHoleScore[];
  grossTotal: number;
  netTotal: number;
  grossToPar: number;
  grossToParLabel: string;
  netToPar: number;
  netToParLabel: string;
}

export interface GSProHoleMeta {
  hole: number;
  par: number;
  strokeIndex: number;
  distanceYards: number;
}

export interface GSProPinContest {
  hole: number;
  type: "closest_to_pin" | "closest_in_2";
  awardType: "solo" | "team";
  title: string;
  leader: {
    playerName: string;
    teamName: string;
    playerNames: string[];
    distanceFeet: string;
  };
}

export interface GSProLiveState {
  isGSProRunning: boolean;
  isRoundActive: boolean;
  isMatchFinished: boolean;
  matchResult?: {
    isFinished: boolean;
    winnerTeamId?: string;
    winnerTeamName?: string;
    loserTeamId?: string;
    loserTeamName?: string;
    winningMargin: string;
    isTie: boolean;
    scoreSummary: string;
    winningPlayers: string[];
  };
  statusMessage: string;
  source: "live" | "simulated" | "idle";
  lastUpdated: string;
  courseKey?: string;
  courseName?: string;
  courseLocation?: string;
  coursePar?: number;
  selectedTee?: string;
  totalYards?: number;
  courseHoles?: GSProHoleMeta[];
  holesCompleted: number;
  currentHole: number;
  matchState?: string;
  formatName?: string;
  teams: GSProTeamScorecardRow[];
  pinContests?: GSProPinContest[];
  telemetry?: {
    longestDrive: {
      playerId: string;
      playerName: string;
      distance: number;
      carryDistance?: number;
      hole: number;
      ballSpeed: number;
    };
    totalShots: number;
    lastShot?: {
      player: string;
      hole: number;
      holeShot: number;
      ballSpeed: number;
      distance: number;
    };
  };
}

const APPDATA_GSPRO_DIR = path.join(
  process.env.USERPROFILE || "C:\\Users\\PCSPECIALIST",
  "AppData",
  "LocalLow",
  "GSPro",
  "GSPro"
);

const CURRENT_ROUND_PATH = path.join(APPDATA_GSPRO_DIR, "currentRound.dat");
const GSPRO_COURSES_DIR = "C:\\GSProV1\\Core\\GSP\\Courses";
const LAST_MATCH_CACHE_PATH = path.join(
  APPDATA_GSPRO_DIR,
  "lastCompletedMatch.json"
);
const LAST_MATCH_LOCAL_FALLBACK = path.join(
  process.cwd(),
  ".gspro-last-match.json"
);

export function saveLastMatchCache(state: GSProLiveState) {
  try {
    const serialized = JSON.stringify(state, null, 2);
    try {
      fs.writeFileSync(LAST_MATCH_CACHE_PATH, serialized, "utf8");
    } catch {}
    try {
      fs.writeFileSync(LAST_MATCH_LOCAL_FALLBACK, serialized, "utf8");
    } catch {}
  } catch {}
}

export function loadLastMatchCache(): GSProLiveState | null {
  for (const p of [LAST_MATCH_CACHE_PATH, LAST_MATCH_LOCAL_FALLBACK]) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.teams) && parsed.teams.length > 0) {
          return parsed as GSProLiveState;
        }
      }
    } catch {}
  }
  return null;
}

export function checkIsGSProProcessRunning(): boolean {
  try {
    const stdout = execSync("tasklist /NH", { encoding: "utf8" });
    return /gspro\.exe/i.test(stdout);
  } catch {
    return false;
  }
}

export function detectPlayedTee(shots: GSProShot[], gkd: any): string {
  if (!gkd || !Array.isArray(gkd.Holes) || !shots || shots.length === 0) {
    return "White";
  }

  const teeVotes: Record<string, number> = {};

  for (const s of shots) {
    if (s.HoleShot === 1 && s.StartingPOS) {
      const holeGkd = gkd.Holes[s.Hole];
      if (!holeGkd || !Array.isArray(holeGkd.Tees)) continue;

      let closestTeeName: string | null = null;
      let minDistanceSq = Infinity;

      for (const t of holeGkd.Tees) {
        if (!t.Position || typeof t.Distance !== "number" || t.Distance <= 0)
          continue;
        const dx = t.Position.x - s.StartingPOS.x;
        const dy = t.Position.y - s.StartingPOS.y;
        const dz = t.Position.z - s.StartingPOS.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closestTeeName = t.TeeType;
        }
      }

      if (closestTeeName && minDistanceSq < 25) {
        teeVotes[closestTeeName] = (teeVotes[closestTeeName] || 0) + 1;
      }
    }
  }

  const sortedVotes = Object.entries(teeVotes).sort((a, b) => b[1] - a[1]);
  return sortedVotes.length > 0 ? sortedVotes[0][0] : "White";
}

export function readGSProCourseMetadata(
  courseKey: string,
  shots?: GSProShot[]
): {
  courseName: string;
  location: string;
  par: number;
  selectedTee: string;
  totalYards: number;
  holeStrokeIndexes: Record<number, number>;
  holesList: GSProHoleMeta[];
} {
  const defaultHoles: GSProHoleMeta[] = Array.from({ length: 18 }, (_, i) => ({
    hole: i + 1,
    par: 4,
    strokeIndex: i + 1,
    distanceYards: 380,
  }));

  const defaultMeta = {
    courseName: courseKey || "GSPro Course",
    location: "Simulator Course",
    par: 72,
    selectedTee: "White",
    totalYards: 6840,
    holeStrokeIndexes: Object.fromEntries(
      defaultHoles.map((h) => [h.hole, h.strokeIndex])
    ),
    holesList: defaultHoles,
  };

  if (!courseKey) return defaultMeta;

  try {
    const gkdPath = path.join(GSPRO_COURSES_DIR, courseKey, `${courseKey}.gkd`);
    if (fs.existsSync(gkdPath)) {
      const gkdRaw = fs.readFileSync(gkdPath, "utf8");
      const gkd = JSON.parse(gkdRaw);
      const strokeIndexes: Record<number, number> = {};
      const holesList: GSProHoleMeta[] = [];
      let totalPar = 0;

      const selectedTee = detectPlayedTee(shots || [], gkd);

      if (Array.isArray(gkd.Holes) && gkd.Holes.length > 0) {
        gkd.Holes.forEach((h: any, idx: number) => {
          const num = Number(h.HoleNumber || h.holeNumber || idx + 1);
          const par = Number(h.Par || h.par || 4);
          const si = Number(h.Index || h.index || num);

          let distanceYards = 0;
          if (Array.isArray(h.Tees)) {
            const matchedTee =
              h.Tees.find(
                (t: any) =>
                  t.TeeType?.toLowerCase() === selectedTee.toLowerCase() &&
                  t.Distance > 0
              ) ||
              h.Tees.find(
                (t: any) =>
                  (t.TeeType === "White" || t.teeType === "White") &&
                  t.Distance > 0
              ) ||
              h.Tees.find((t: any) => t.Enabled && t.Distance > 0) ||
              h.Tees.find((t: any) => t.Distance > 0);

            if (matchedTee && matchedTee.Distance > 0) {
              distanceYards = Math.round(matchedTee.Distance * 1.09361);
            }
          }

          strokeIndexes[num] = si;
          totalPar += par;
          holesList.push({
            hole: num,
            par,
            strokeIndex: si,
            distanceYards: distanceYards || 350,
          });
        });
      }

      const totalYards = holesList.reduce((acc, h) => acc + h.distanceYards, 0);

      const locParts = [gkd.CityTown, gkd.StateCountyProvince, gkd.Country]
        .map((p) => (p || "").trim())
        .filter(Boolean);
      const cleanLocation =
        gkd.Location && gkd.Location.trim() && !/^[\s,]+$/.test(gkd.Location)
          ? gkd.Location.trim()
          : locParts.length > 0
          ? locParts.join(", ")
          : "GSPro Simulator";

      return {
        courseName: gkd.CourseName || courseKey,
        location: cleanLocation,
        par: totalPar > 0 ? totalPar : 72,
        selectedTee,
        totalYards,
        holeStrokeIndexes: strokeIndexes,
        holesList: holesList.length > 0 ? holesList : defaultHoles,
      };
    }
  } catch {
    // Return fallback metadata if GKD cannot be read
  }

  return defaultMeta;
}

export function getGSProLiveData(): GSProLiveState {
  const isProcessRunning = checkIsGSProProcessRunning();

  let roundDatStat: fs.Stats | null = null;
  if (fs.existsSync(CURRENT_ROUND_PATH)) {
    try {
      roundDatStat = fs.statSync(CURRENT_ROUND_PATH);
    } catch {
      roundDatStat = null;
    }
  }

  let shots: GSProShot[] = [];
  if (roundDatStat && roundDatStat.size > 10) {
    try {
      const raw = fs.readFileSync(CURRENT_ROUND_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        shots = parsed;
      }
    } catch {
      shots = [];
    }
  }

  const isRoundActive = isProcessRunning && shots.length > 0;

  if (shots.length === 0) {
    const cachedLastMatch = loadLastMatchCache();
    if (cachedLastMatch) {
      return {
        ...cachedLastMatch,
        isGSProRunning: isProcessRunning,
        isRoundActive: false,
        isMatchFinished: true,
        statusMessage: isProcessRunning
          ? "GSPro connected · Showing last completed match results"
          : "GSPro offline · Showing last completed match results",
        source: "live",
      };
    }

    if (!isProcessRunning) {
      return {
        isGSProRunning: false,
        isRoundActive: false,
        isMatchFinished: false,
        statusMessage:
          "GSPro is not running. Launch GSPro on this PC to detect live rounds.",
        source: "idle",
        lastUpdated: new Date().toISOString(),
        holesCompleted: 0,
        currentHole: 1,
        teams: [],
      };
    }

    return {
      isGSProRunning: true,
      isRoundActive: false,
      isMatchFinished: false,
      statusMessage:
        "GSPro is active. Waiting for round to start or shot to be taken...",
      source: "idle",
      lastUpdated: new Date().toISOString(),
      holesCompleted: 0,
      currentHole: 1,
      teams: [],
    };
  }

  const courseKey = shots[0].CourseKey || "unknown";
  const courseMeta = readGSProCourseMetadata(courseKey, shots);

  const playerNames = Array.from(new Set(shots.map((s) => s.PlayerName)));

  const isFourballScramble =
    playerNames.includes("Brian") &&
    playerNames.includes("John") &&
    playerNames.includes("Tony") &&
    playerNames.includes("Derek");

  const teamDefinitions = isFourballScramble
    ? [
        {
          id: "team-a",
          name: "Team A",
          playerNames: ["Brian", "John"],
          handicap: 8,
        },
        {
          id: "team-b",
          name: "Team B",
          playerNames: ["Tony", "Derek"],
          handicap: 3,
        },
      ]
    : playerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name,
        playerNames: [name],
        handicap: 0,
      }));

  const resolveFullName = (shortName: string) => {
    const s = shortName.toLowerCase();
    if (s === "brian") return "Brian Scott";
    if (s === "john") return "John Colreavey";
    if (s === "tony") return "Tony McLean";
    if (s === "derek") return "Derek McMillan";
    return shortName;
  };

  const METERS_TO_YARDS = 1.0940104388451573;

  let longestDrive = {
    playerId: "",
    playerName: "",
    distance: 0,
    carryDistance: 0,
    hole: 1,
    ballSpeed: 0,
  };

  shots.forEach((s) => {
    if (s.HoleShot === 1 && s.HolePar >= 4) {
      const distanceInYards =
        Math.round(s.TotalDistance * METERS_TO_YARDS * 100) / 100;

      // Extract Carry Distance from 3D touchdown point
      let carryYards = 0;
      const td = s.GhostData?.atShotData?.tdpoint || s.activeShot?.sd?.tdpoint;
      const start = s.StartingPOS || s.activeShot?.sd?.BallStartPos;
      if (td && start) {
        const dx = td.x - start.x;
        const dy = td.y - start.y;
        const dz = td.z - start.z;
        const dist3DCarry = Math.sqrt(dx * dx + dy * dy + dz * dz);
        carryYards = Math.round(dist3DCarry * METERS_TO_YARDS * 100) / 100;
      } else if (s.GhostData?.cy && s.GhostData.cy > 0) {
        carryYards = Math.round(s.GhostData.cy * 100) / 100;
      }

      if (distanceInYards > longestDrive.distance) {
        longestDrive = {
          playerId: (s.PlayerName || "player").toLowerCase().replace(/\s+/g, "-"),
          playerName: resolveFullName(s.PlayerName || "Player"),
          distance: distanceInYards,
          carryDistance: carryYards,
          hole: (s.Hole || 0) + 1,
          ballSpeed: Math.round((s.BallSpeed || 0) * 10) / 10,
        };
      }
    }
  });

  const lastShotRaw = shots[shots.length - 1];
  const lastHoleNum = (lastShotRaw.Hole || 0) + 1;

  const teams: GSProTeamScorecardRow[] = teamDefinitions.map((teamDef) => {
    const scores: GSProHoleScore[] = courseMeta.holesList
      .map((hInfo) => {
        const hIdx = hInfo.hole - 1;
        const hShots = shots.filter(
          (s) =>
            s.Hole === hIdx &&
            teamDef.playerNames.includes(s.PlayerName) &&
            s.TotalDistance > 0
        );

        if (hShots.length === 0) {
          return {
            hole: hInfo.hole,
            gross: 0,
            net: 0,
            par: hInfo.par,
            strokeIndex: hInfo.strokeIndex,
            distanceYards: hInfo.distanceYards,
            handicapStrokes: 0,
          };
        }

        const gross = Math.max(
          ...teamDef.playerNames.map((pName) => {
            const pShots = hShots.filter((s) => s.PlayerName === pName);
            return pShots.length > 0
              ? Math.max(...pShots.map((s) => s.HoleShot))
              : 0;
          })
        );

        let hcpStrokes = 0;
        if (teamDef.handicap > 0) {
          hcpStrokes = Math.floor(teamDef.handicap / 18);
          const rem = teamDef.handicap % 18;
          if (hInfo.strokeIndex <= rem) {
            hcpStrokes += 1;
          }
        }

        const net = gross > 0 ? gross - hcpStrokes : 0;

        return {
          hole: hInfo.hole,
          gross,
          net,
          par: hInfo.par,
          strokeIndex: hInfo.strokeIndex,
          distanceYards: hInfo.distanceYards,
          handicapStrokes: hcpStrokes,
        };
      })
      .filter((s) => s.gross > 0);

    const grossTotal = scores.reduce((sum, s) => sum + s.gross, 0);
    const netTotal = scores.reduce((sum, s) => sum + s.net, 0);
    const parTotal = scores.reduce((sum, s) => sum + s.par, 0);

    const grossDiff = grossTotal - parTotal;
    const netDiff = netTotal - parTotal;

    const formatDiff = (diff: number, count: number) => {
      if (count === 0) return "E";
      if (diff === 0) return "E";
      return diff > 0 ? `+${diff}` : `${diff}`;
    };

    return {
      id: teamDef.id,
      name: teamDef.name,
      playerNames: teamDef.playerNames,
      handicap: teamDef.handicap,
      scores,
      grossTotal,
      netTotal,
      grossToPar: grossDiff,
      grossToParLabel: formatDiff(grossDiff, scores.length),
      netToPar: netDiff,
      netToParLabel: formatDiff(netDiff, scores.length),
    };
  });

  const completedHoles = Math.max(...teams.map((t) => t.scores.length), 0);
  const allTeamsCompleted18 =
    teams.length >= 2
      ? teams.every((t) => t.scores.length >= 18)
      : teams.length === 1 && teams[0].scores.length >= 18;

  const isMatchFinished = allTeamsCompleted18;

  let matchResult: GSProLiveState["matchResult"] = undefined;
  let matchState = `Thru Hole ${completedHoles}`;

  if (teams.length >= 2) {
    const netA = teams[0].netTotal;
    const netB = teams[1].netTotal;
    const scoreSummary = `Net ${netA} vs ${netB}`;

    if (isMatchFinished) {
      if (netA < netB) {
        const margin = netB - netA;
        const marginText = `${margin} ${margin === 1 ? "stroke" : "strokes"}`;
        matchState = `Final · ${teams[0].name} won by ${marginText} (${scoreSummary})`;
        matchResult = {
          isFinished: true,
          winnerTeamId: teams[0].id,
          winnerTeamName: teams[0].name,
          loserTeamId: teams[1].id,
          loserTeamName: teams[1].name,
          winningMargin: marginText,
          isTie: false,
          scoreSummary,
          winningPlayers: teams[0].playerNames,
        };
      } else if (netB < netA) {
        const margin = netA - netB;
        const marginText = `${margin} ${margin === 1 ? "stroke" : "strokes"}`;
        matchState = `Final · ${teams[1].name} won by ${marginText} (${scoreSummary})`;
        matchResult = {
          isFinished: true,
          winnerTeamId: teams[1].id,
          winnerTeamName: teams[1].name,
          loserTeamId: teams[0].id,
          loserTeamName: teams[0].name,
          winningMargin: marginText,
          isTie: false,
          scoreSummary,
          winningPlayers: teams[1].playerNames,
        };
      } else {
        matchState = `Final · Match Tied (${scoreSummary})`;
        matchResult = {
          isFinished: true,
          winningMargin: "Tied",
          isTie: true,
          scoreSummary,
          winningPlayers: [],
        };
      }
    } else {
      if (netA < netB) {
        matchState = `${teams[0].name} leads by ${netB - netA} (${teams[0].netToParLabel} vs ${teams[1].netToParLabel})`;
      } else if (netB < netA) {
        matchState = `${teams[1].name} leads by ${netA - netB} (${teams[1].netToParLabel} vs ${teams[0].netToParLabel})`;
      } else {
        matchState = `All Square (${teams[0].netToParLabel}) thru ${completedHoles}`;
      }
    }
  }

  // Pin Contests:
  // 1) Closest Team in 2 on Hole 8 (Par 4, HoleShot 2)
  // 2) Closest to the Pin on Hole 17 (Par 3, HoleShot 1)
  const formatFeetInches = (meters: number) => {
    const feet = meters * 3.28084;
    const ft = Math.floor(feet);
    const inches = Math.round((feet - ft) * 12);
    return `${ft} ft ${inches} in`;
  };

  const getTeamNameForPlayer = (playerName: string) => {
    const p = playerName.toLowerCase();
    if (p === "brian" || p === "john") return "Team A";
    if (p === "tony" || p === "derek") return "Team B";
    return "";
  };

  const h8Shots = shots
    .filter(
      (s) =>
        s.Hole === 7 &&
        s.HoleShot === 2 &&
        typeof s.DistanceToPin === "number" &&
        s.DistanceToPin > 0
    )
    .sort((a, b) => a.DistanceToPin - b.DistanceToPin);

  const h17Shots = shots
    .filter(
      (s) =>
        s.Hole === 16 &&
        s.HoleShot === 1 &&
        typeof s.DistanceToPin === "number" &&
        s.DistanceToPin > 0
    )
    .sort((a, b) => a.DistanceToPin - b.DistanceToPin);

  const getTeamRoster = (teamName: string) => {
    if (teamName === "Team A") return ["Brian Scott", "John Colreavey"];
    if (teamName === "Team B") return ["Tony McLean", "Derek McMillan"];
    return [];
  };

  const h8LeaderPlayer = h8Shots[0]
    ? resolveFullName(h8Shots[0].PlayerName)
    : "Derek McMillan";
  const h8LeaderTeam = h8Shots[0]
    ? getTeamNameForPlayer(h8Shots[0].PlayerName)
    : "Team B";

  const h17LeaderPlayer = h17Shots[0]
    ? resolveFullName(h17Shots[0].PlayerName)
    : "Derek McMillan";
  const h17LeaderTeam = h17Shots[0]
    ? getTeamNameForPlayer(h17Shots[0].PlayerName)
    : "Team B";

  const pinContests: GSProPinContest[] = [
    {
      hole: 8,
      type: "closest_in_2",
      awardType: "team",
      title: "Closest Team in 2 · Hole 8",
      leader: {
        playerName: h8LeaderPlayer,
        teamName: h8LeaderTeam,
        playerNames: getTeamRoster(h8LeaderTeam),
        distanceFeet: h8Shots[0]
          ? formatFeetInches(h8Shots[0].DistanceToPin)
          : "10 ft 1 in",
      },
    },
    {
      hole: 17,
      type: "closest_to_pin",
      awardType: "solo",
      title: "Closest to Pin · Hole 17",
      leader: {
        playerName: h17LeaderPlayer,
        teamName: h17LeaderTeam,
        playerNames: [h17LeaderPlayer],
        distanceFeet: h17Shots[0]
          ? formatFeetInches(h17Shots[0].DistanceToPin)
          : "5 ft 6 in",
      },
    },
  ];

  const liveState: GSProLiveState = {
    isGSProRunning: isProcessRunning,
    isRoundActive: isProcessRunning,
    isMatchFinished,
    matchResult,
    statusMessage: isMatchFinished
      ? isProcessRunning
        ? "GSPro round complete · Match finished (18 holes recorded)"
        : "GSPro offline · Showing completed match results (18 holes)"
      : "GSPro live round detected and active",
    source: "live",
    lastUpdated: new Date().toISOString(),
    courseKey,
    courseName: courseMeta.courseName,
    courseLocation: courseMeta.location,
    coursePar: courseMeta.par,
    selectedTee: courseMeta.selectedTee,
    totalYards: courseMeta.totalYards,
    courseHoles: courseMeta.holesList,
    holesCompleted: completedHoles,
    currentHole: Math.min(completedHoles, 18),
    matchState,
    formatName: isFourballScramble
      ? "2v2 Scramble (Team Stroke Play)"
      : "GSPro Stroke Play",
    teams,
    pinContests,
    telemetry: {
      longestDrive,
      totalShots: shots.length,
      lastShot: {
        player: lastShotRaw.PlayerName,
        hole: lastHoleNum,
        holeShot: lastShotRaw.HoleShot,
        ballSpeed: Math.round((lastShotRaw.BallSpeed || 0) * 10) / 10,
        distance:
          Math.round(lastShotRaw.TotalDistance * METERS_TO_YARDS * 10) / 10,
      },
    },
  };

  if (isMatchFinished || (teams.length > 0 && completedHoles > 0)) {
    saveLastMatchCache(liveState);
  }

  return liveState;
}
