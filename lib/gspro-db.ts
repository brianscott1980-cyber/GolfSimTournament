import path from "path";
import fs from "fs";
import crypto from "crypto";
import type {
  GSProLiveState,
  GSProTeamScorecardRow,
  GSProHoleScore,
  GSProHoleMeta,
  GSProPinContest,
} from "./gspro-live";
import { readGSProCourseMetadata } from "./gspro-live";

export interface GSProHistoricalRoundSummary {
  id: number;
  courseKey: string;
  courseName: string;
  courseLocation: string;
  date: string;
  dateLabel: string;
  timeLabel: string;
  holesCount: number;
  playerCount: number;
  playerNames: string[];
  teamsSummary: string;
  formatName: string;
  matchState: string;
  scoreSummary: string;
  winnerName?: string;
  winningMargin?: string;
  tee: string;
}

const APPDATA_GSPRO_DIR = path.join(
  process.env.USERPROFILE || "C:\\Users\\PCSPECIALIST",
  "AppData",
  "LocalLow",
  "GSPro",
  "GSPro"
);

const DB_PATH = path.join(APPDATA_GSPRO_DIR, "GSPro.db");
const AES_KEY = Buffer.from("294A404E635266556A586E3272357538", "utf8");
const AES_IV = Buffer.alloc(16, 0);

function getSqliteDatabaseSync() {
  try {
    if (typeof (process as any).getBuiltinModule === "function") {
      const mod = (process as any).getBuiltinModule("node:sqlite");
      if (mod && mod.DatabaseSync) return mod.DatabaseSync;
    }
  } catch {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = new Function("module", "return require(module)");
    const mod = req("node:sqlite");
    if (mod && mod.DatabaseSync) return mod.DatabaseSync;
  } catch {}
  return null;
}

function decryptGSProString(cipherBase64: string): string | null {
  if (!cipherBase64 || typeof cipherBase64 !== "string") return null;
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, AES_IV);
    let dec = decipher.update(Buffer.from(cipherBase64.trim(), "base64"), undefined, "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch {
    return null;
  }
}

function resolvePlayerFullName(shortName: string): string {
  const s = shortName.toLowerCase().trim();
  if (s === "brian") return "Brian Scott";
  if (s === "john") return "John Colreavey";
  if (s === "tony") return "Tony McLean";
  if (s === "derek") return "Derek McMillan";
  if (s === "alisdair") return "Alisdair McLean";
  if (s === "davie") return "Davie Scott";
  if (s === "greig") return "Greig Cunningham";
  return shortName;
}

function formatDateLabels(rawDate: string): { dateLabel: string; timeLabel: string } {
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      const dateLabel = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeLabel = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return { dateLabel, timeLabel };
    }
  } catch {}
  return { dateLabel: rawDate || "Recent", timeLabel: "" };
}

function formatCleanCourseName(key: string): string {
  if (!key) return "GSPro Course";
  let clean = key
    .replace(/_gsp$/i, "")
    .replace(/_lidar_scene$/i, "")
    .replace(/_v\d+$/i, "")
    .replace(/[-_]+/g, " ");
  return clean
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}

const STATIC_ROUNDS_DIR = path.join(process.cwd(), "data", "gspro-rounds");

function loadStaticRoundsIndex(): GSProHistoricalRoundSummary[] {
  try {
    const indexPath = path.join(STATIC_ROUNDS_DIR, "rounds-index.json");
    if (fs.existsSync(indexPath)) {
      const items: GSProHistoricalRoundSummary[] = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      return items.filter(
        (r) =>
          r.holesCount >= 18 &&
          r.teamsSummary &&
          r.teamsSummary.includes(" vs ")
      );
    }
  } catch {}
  return [];
}

function loadStaticRoundState(roundId: number): GSProLiveState | null {
  try {
    const roundPath = path.join(STATIC_ROUNDS_DIR, `round-${roundId}.json`);
    if (fs.existsSync(roundPath)) {
      return JSON.parse(fs.readFileSync(roundPath, "utf8"));
    }
  } catch {}
  return null;
}

/**
 * Get list of previous completed matches from GSPro.db (falling back to static archive)
 */
export function getGSProHistoricalRoundsList(limit = 24): GSProHistoricalRoundSummary[] {
  if (!fs.existsSync(DB_PATH)) {
    return loadStaticRoundsIndex().slice(0, limit);
  }

  try {
    const DatabaseSync = getSqliteDatabaseSync();
    if (!DatabaseSync) {
      return loadStaticRoundsIndex().slice(0, limit);
    }
    const db = new DatabaseSync(DB_PATH, { open: true, readOnly: true });

    const rows = db
      .prepare(
        `SELECT ID, CourseName, DateCreated, NumberOfPlayers, RoundStatus, RoundData, RoundSettings 
         FROM Round 
         ORDER BY ID DESC 
         LIMIT 100`
      )
      .all();

    const results: GSProHistoricalRoundSummary[] = [];

    for (const r of rows as any[]) {
      if (results.length >= limit) break;
      if (!r.RoundData) continue;

      const decrypted = decryptGSProString(r.RoundData);
      if (!decrypted) continue;

      let data: any = null;
      try {
        data = JSON.parse(decrypted);
      } catch {
        continue;
      }

      if (!data || !Array.isArray(data.player_a)) continue;

      const players = data.player_a.filter(
        (p: any) =>
          p.Name &&
          p.Name.trim() &&
          Array.isArray(p.scoreRaw) &&
          p.scoreRaw.some((s: number) => s > 0)
      );

      if (players.length === 0) continue;

      const holesPlayed = Math.max(
        ...players.map((p: any) => p.scoreRaw.filter((s: number) => s > 0).length)
      );

      // Only include completed matches (18 holes)
      if (holesPlayed < 18) continue;

      const { dateLabel, timeLabel } = formatDateLabels(r.DateCreated);
      const courseMeta = readGSProCourseMetadata(r.CourseName);
      const courseName = courseMeta.courseName || formatCleanCourseName(r.CourseName);

      // Detect team colors / team grouping in GSPro data
      const extractTeamKey = (p: any): string | null => {
        const val =
          p.TeamColor ??
          p.teamColor ??
          p.Color ??
          p.color ??
          p.Team ??
          p.team ??
          p.TeamId ??
          p.team_id;
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim().toLowerCase();
        }
        return null;
      };

      const teamGroups = new Map<string, any[]>();
      let hasExplicitTeams = false;
      for (const p of players) {
        const key = extractTeamKey(p);
        if (key !== null) {
          hasExplicitTeams = true;
          if (!teamGroups.has(key)) teamGroups.set(key, []);
          teamGroups.get(key)!.push(p);
        }
      }

      // Check if players are on 1 unified team together (e.g. Royal Hawaiian 3-player scramble or shared team color)
      const allShareIdenticalScores =
        players.length > 1 &&
        players.slice(1).every((p: any) =>
          p.scoreRaw.every((s: number, idx: number) => s === players[0].scoreRaw[idx])
        );

      const isSingleTeamTogether =
        (hasExplicitTeams && teamGroups.size === 1) ||
        (players.length === 3 && (allShareIdenticalScores || hasExplicitTeams || r.CourseName.toLowerCase().includes("royal_hawaiian")));

      const isTwoTeamScramble =
        (hasExplicitTeams && teamGroups.size === 2) ||
        (!hasExplicitTeams && players.length >= 4);

      const isTwoPlayer = !isSingleTeamTogether && !isTwoTeamScramble && players.length === 2;

      let formatName = "Stroke Play";
      let teamsSummary = "";
      let matchState = `Final · ${holesPlayed} Holes`;
      let scoreSummary = "";
      let winnerName: string | undefined;
      let winningMargin: string | undefined;

      if (isSingleTeamTogether) {
        formatName = `${players.length}-Player Scramble`;
        const names = players.map((p: any) => p.Name);
        teamsSummary =
          names.length > 2
            ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`
            : names.join(" & ");

        let teamGross = 0;
        for (let h = 0; h < holesPlayed; h++) {
          const minGross = Math.min(
            ...players.map((p: any) => (p.scoreRaw[h] > 0 ? p.scoreRaw[h] : 99))
          );
          if (minGross < 99) teamGross += minGross;
        }
        const par = courseMeta.par || 72;
        const diff = teamGross - par;
        const diffLabel = diff > 0 ? `+${diff}` : diff === 0 ? "E" : `${diff}`;
        scoreSummary = `Team: ${teamGross} (${diffLabel})`;
        matchState = `${teamsSummary} shot ${teamGross} (${diffLabel})`;
        winnerName = teamsSummary;
        winningMargin = diff < 0 ? `${Math.abs(diff)} Under Par` : `${diffLabel} Par`;
      } else if (isTwoTeamScramble) {
        const teamsArray =
          hasExplicitTeams && teamGroups.size === 2
            ? Array.from(teamGroups.values())
            : [[players[0], players[1]], [players[2], players[3]]];
        const team1 = teamsArray[0];
        const team2 = teamsArray[1];
        formatName = `${team1.length}v${team2.length} Scramble`;
        const t1 = team1.map((p: any) => p.Name).join(" & ");
        const t2 = team2.map((p: any) => p.Name).join(" & ");
        teamsSummary = `${t1} vs ${t2}`;

        let score1 = 0;
        let score2 = 0;
        for (let h = 0; h < holesPlayed; h++) {
          const m1 = Math.min(...team1.map((p: any) => (p.scoreRaw[h] > 0 ? p.scoreRaw[h] : 99)));
          const m2 = Math.min(...team2.map((p: any) => (p.scoreRaw[h] > 0 ? p.scoreRaw[h] : 99)));
          if (m1 < 99) score1 += m1;
          if (m2 < 99) score2 += m2;
        }
        scoreSummary = `${score1} - ${score2}`;

        if (score1 < score2) {
          winnerName = t1;
          const diff = Math.abs(score1 - score2);
          winningMargin = diff > 0 ? `${diff} Shot${diff > 1 ? "s" : ""}` : "1 UP";
          matchState = `${t1} def. ${t2} (${winningMargin})`;
        } else if (score2 < score1) {
          winnerName = t2;
          const diff = Math.abs(score2 - score1);
          winningMargin = diff > 0 ? `${diff} Shot${diff > 1 ? "s" : ""}` : "1 UP";
          matchState = `${t2} def. ${t1} (${winningMargin})`;
        } else {
          matchState = `All Square (${scoreSummary})`;
        }
      } else if (isTwoPlayer) {
        formatName = "1v1 Match Play";
        const p1 = players[0].Name;
        const p2 = players[1].Name;
        teamsSummary = `${p1} vs ${p2}`;
        const score1 = players[0].scoreRaw.reduce((a: number, b: number) => a + b, 0);
        const score2 = players[1].scoreRaw.reduce((a: number, b: number) => a + b, 0);
        scoreSummary = `${score1} - ${score2}`;

        if (score1 < score2) {
          winnerName = p1;
          winningMargin = `${score2 - score1} Shots`;
          matchState = `${p1} def. ${p2} (${winningMargin})`;
        } else if (score2 < score1) {
          winnerName = p2;
          winningMargin = `${score1 - score2} Shots`;
          matchState = `${p2} def. ${p1} (${winningMargin})`;
        } else {
          matchState = `All Square (${scoreSummary})`;
        }
      } else {
        teamsSummary = players.map((p: any) => p.Name).join(", ");
        const best = [...players].sort(
          (a, b) =>
            a.scoreRaw.reduce((x: number, y: number) => x + y, 0) -
            b.scoreRaw.reduce((x: number, y: number) => x + y, 0)
        )[0];
        winnerName = best.Name;
        const bestScore = best.scoreRaw.reduce((a: number, b: number) => a + b, 0);
        scoreSummary = `Leader: ${bestScore}`;
        matchState = `${best.Name} shot ${bestScore}`;
      }

      // Only include matches that had at least 2 opposing teams/sides
      if (isSingleTeamTogether || !teamsSummary || !teamsSummary.includes(" vs ")) {
        continue;
      }

      results.push({
        id: r.ID,
        courseKey: r.CourseName,
        courseName,
        courseLocation: courseMeta.location || "Simulator Course",
        date: r.DateCreated,
        dateLabel,
        timeLabel,
        holesCount: holesPlayed,
        playerCount: players.length,
        playerNames: players.map((p: any) => p.Name),
        teamsSummary,
        formatName,
        matchState,
        scoreSummary,
        winnerName,
        winningMargin,
        tee: players[0].selectedTeeName || "White",
      });
    }

    return results;
  } catch (err) {
    console.error("Error reading GSPro historical rounds list:", err);
    return [];
  }
}

/**
 * Build a full GSProLiveState representation for any historical round in GSPro.db
 */
export function getGSProHistoricalRoundState(roundId: number): GSProLiveState | null {
  if (!fs.existsSync(DB_PATH)) {
    return loadStaticRoundState(roundId);
  }

  try {
    const DatabaseSync = getSqliteDatabaseSync();
    if (!DatabaseSync) {
      return loadStaticRoundState(roundId);
    }
    const db = new DatabaseSync(DB_PATH, { open: true, readOnly: true });

    const row = db
      .prepare(
        `SELECT ID, CourseName, DateCreated, NumberOfPlayers, RoundStatus, RoundData, RoundSettings 
         FROM Round 
         WHERE ID = ?`
      )
      .get(roundId) as any;

    if (!row || !row.RoundData) return null;

    const decrypted = decryptGSProString(row.RoundData);
    if (!decrypted) return null;

    const data = JSON.parse(decrypted);
    if (!data || !Array.isArray(data.player_a)) return null;

    const players = data.player_a.filter(
      (p: any) =>
        p.Name &&
        p.Name.trim() &&
        Array.isArray(p.scoreRaw) &&
        p.scoreRaw.some((s: number) => s > 0)
    );

    if (players.length === 0) return null;

    const courseMeta = readGSProCourseMetadata(row.CourseName);
    const courseName = courseMeta.courseName || formatCleanCourseName(row.CourseName);
    const holesPlayed = Math.max(
      ...players.map((p: any) => p.scoreRaw.filter((s: number) => s > 0).length)
    );

    const extractTeamKey = (p: any): string | null => {
      const val =
        p.TeamColor ??
        p.teamColor ??
        p.Color ??
        p.color ??
        p.Team ??
        p.team ??
        p.TeamId ??
        p.team_id;
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim().toLowerCase();
      }
      return null;
    };

    const teamGroups = new Map<string, any[]>();
    let hasExplicitTeams = false;
    for (const p of players) {
      const key = extractTeamKey(p);
      if (key !== null) {
        hasExplicitTeams = true;
        if (!teamGroups.has(key)) teamGroups.set(key, []);
        teamGroups.get(key)!.push(p);
      }
    }

    const allShareIdenticalScores =
      players.length > 1 &&
      players.slice(1).every((p: any) =>
        p.scoreRaw.every((s: number, idx: number) => s === players[0].scoreRaw[idx])
      );

    const isSingleTeamTogether =
      (hasExplicitTeams && teamGroups.size === 1) ||
      (players.length === 3 && (allShareIdenticalScores || hasExplicitTeams || row.CourseName.toLowerCase().includes("royal_hawaiian")));

    const isTwoTeamScramble =
      (hasExplicitTeams && teamGroups.size === 2) ||
      (!hasExplicitTeams && players.length >= 4);

    const isTwoPlayer = !isSingleTeamTogether && !isTwoTeamScramble && players.length === 2;

    const teams: GSProTeamScorecardRow[] = [];
    let formatName = "Stroke Play";

    if (isSingleTeamTogether) {
      formatName = `${players.length}-Player Scramble`;
      const names = players.map((p: any) => p.Name);
      const teamTitle =
        names.length > 2
          ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`
          : names.join(" & ");

      const scores: GSProHoleScore[] = courseMeta.holesList.map((hInfo, idx) => {
        const rawScores = players
          .map((p: any) => p.scoreRaw?.[idx] || 0)
          .filter((s: number) => s > 0);
        const gross = rawScores.length > 0 ? Math.min(...rawScores) : 0;
        return {
          hole: hInfo.hole,
          gross,
          net: gross,
          par: hInfo.par,
          strokeIndex: hInfo.strokeIndex,
          distanceYards: hInfo.distanceYards,
          handicapStrokes: 0,
        };
      });

      const completedScores = scores.filter((s) => s.gross > 0);
      const grossTotal = completedScores.reduce((acc, s) => acc + s.gross, 0);
      const parCompleted = completedScores.reduce((acc, s) => acc + s.par, 0);
      const grossToPar = grossTotal - parCompleted;
      const formatToPar = (diff: number) => (diff === 0 ? "E" : diff > 0 ? `+${diff}` : `${diff}`);

      teams.push({
        id: "team-single",
        name: teamTitle,
        playerNames: players.map((p: any) => resolvePlayerFullName(p.Name)),
        handicap: 0,
        scores,
        grossTotal,
        netTotal: grossTotal,
        grossToPar,
        grossToParLabel: formatToPar(grossToPar),
        netToPar: grossToPar,
        netToParLabel: formatToPar(grossToPar),
      });
    } else if (isTwoTeamScramble) {
      formatName = "2v2 Scramble";
      const teamsArray =
        hasExplicitTeams && teamGroups.size === 2
          ? Array.from(teamGroups.values())
          : [[players[0], players[1]], [players[2], players[3]]];
      const team1 = teamsArray[0];
      const team2 = teamsArray[1];
      const pA1 = team1[0];
      const pA2 = team1[1];
      const pB1 = team2[0];
      const pB2 = team2[1];

      const makeTeamRow = (
        id: string,
        name: string,
        playerShorts: string[],
        p1: any,
        p2: any,
        hcp: number
      ): GSProTeamScorecardRow => {
        const scores: GSProHoleScore[] = courseMeta.holesList.map((hInfo, idx) => {
          const raw1 = p1.scoreRaw?.[idx] || 0;
          const raw2 = p2?.scoreRaw?.[idx] || 0;
          const gross = Math.max(raw1, raw2);

          let hcpStrokes = 0;
          if (hcp > 0) {
            hcpStrokes = Math.floor(hcp / 18);
            if (hInfo.strokeIndex <= hcp % 18) hcpStrokes += 1;
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
        });

        const completedScores = scores.filter((s) => s.gross > 0);
        const grossTotal = completedScores.reduce((acc, s) => acc + s.gross, 0);
        const netTotal = completedScores.reduce((acc, s) => acc + s.net, 0);
        const parCompleted = completedScores.reduce((acc, s) => acc + s.par, 0);
        const grossToPar = grossTotal - parCompleted;
        const netToPar = netTotal - parCompleted;

        const formatToPar = (diff: number) => {
          if (diff === 0) return "E";
          return diff > 0 ? `+${diff}` : `${diff}`;
        };

        return {
          id,
          name,
          playerNames: playerShorts.map(resolvePlayerFullName),
          handicap: hcp,
          scores,
          grossTotal,
          netTotal,
          grossToPar,
          grossToParLabel: formatToPar(grossToPar),
          netToPar,
          netToParLabel: formatToPar(netToPar),
        };
      };

      teams.push(
        makeTeamRow(
          "team-a",
          "Team A",
          [pA1.Name, pA2.Name],
          pA1,
          pA2,
          8
        )
      );
      teams.push(
        makeTeamRow(
          "team-b",
          "Team B",
          [pB1.Name, pB2.Name],
          pB1,
          pB2,
          3
        )
      );
    } else if (isTwoPlayer) {
      formatName = "1v1 Match Play";
      // 1v1
      players.forEach((p: any, idx: number) => {
        const teamId = idx === 0 ? "team-a" : "team-b";
        const teamName = resolvePlayerFullName(p.Name);
        const scores: GSProHoleScore[] = courseMeta.holesList.map((hInfo, hIdx) => {
          const gross = p.scoreRaw?.[hIdx] || 0;
          const net = p.score?.[hIdx] || gross;
          return {
            hole: hInfo.hole,
            gross,
            net,
            par: hInfo.par,
            strokeIndex: hInfo.strokeIndex,
            distanceYards: hInfo.distanceYards,
            handicapStrokes: Math.max(0, gross - net),
          };
        });

        const completedScores = scores.filter((s) => s.gross > 0);
        const grossTotal = completedScores.reduce((acc, s) => acc + s.gross, 0);
        const netTotal = completedScores.reduce((acc, s) => acc + s.net, 0);
        const parCompleted = completedScores.reduce((acc, s) => acc + s.par, 0);
        const grossToPar = grossTotal - parCompleted;
        const netToPar = netTotal - parCompleted;

        const formatToPar = (diff: number) => {
          if (diff === 0) return "E";
          return diff > 0 ? `+${diff}` : `${diff}`;
        };

        teams.push({
          id: teamId,
          name: teamName,
          playerNames: [teamName],
          handicap: 0,
          scores,
          grossTotal,
          netTotal,
          grossToPar,
          grossToParLabel: formatToPar(grossToPar),
          netToPar,
          netToParLabel: formatToPar(netToPar),
        });
      });
    } else {
      // Stroke play for 1 or 3+ players
      players.forEach((p: any, idx: number) => {
        const teamId = `player-${idx + 1}`;
        const teamName = resolvePlayerFullName(p.Name);
        const scores: GSProHoleScore[] = courseMeta.holesList.map((hInfo, hIdx) => {
          const gross = p.scoreRaw?.[hIdx] || 0;
          const net = p.score?.[hIdx] || gross;
          return {
            hole: hInfo.hole,
            gross,
            net,
            par: hInfo.par,
            strokeIndex: hInfo.strokeIndex,
            distanceYards: hInfo.distanceYards,
            handicapStrokes: Math.max(0, gross - net),
          };
        });

        const completedScores = scores.filter((s) => s.gross > 0);
        const grossTotal = completedScores.reduce((acc, s) => acc + s.gross, 0);
        const netTotal = completedScores.reduce((acc, s) => acc + s.net, 0);
        const parCompleted = completedScores.reduce((acc, s) => acc + s.par, 0);
        const grossToPar = grossTotal - parCompleted;
        const netToPar = netTotal - parCompleted;

        const formatToPar = (diff: number) => {
          if (diff === 0) return "E";
          return diff > 0 ? `+${diff}` : `${diff}`;
        };

        teams.push({
          id: teamId,
          name: teamName,
          playerNames: [teamName],
          handicap: 0,
          scores,
          grossTotal,
          netTotal,
          grossToPar,
          grossToParLabel: formatToPar(grossToPar),
          netToPar,
          netToParLabel: formatToPar(netToPar),
        });
      });
    }

    // Determine match result
    const teamA = teams[0];
    const teamB = teams[1];
    let isMatchFinished = holesPlayed >= 18;
    let matchResult: any = undefined;
    let matchState = `Final · ${holesPlayed} Holes`;

    if (teams.length === 1) {
      const singleTeam = teams[0];
      const diff = singleTeam.grossToPar;
      const diffLabel = diff > 0 ? `+${diff}` : diff === 0 ? "E" : `${diff}`;
      matchState = `${singleTeam.name} shot ${singleTeam.grossTotal} (${diffLabel})`;
      matchResult = {
        isFinished: true,
        winningMargin: diff < 0 ? `${Math.abs(diff)} Under Par` : `${diffLabel} Par`,
        isTie: false,
        scoreSummary: `Team Gross: ${singleTeam.grossTotal} (${diffLabel})`,
        winningPlayers: singleTeam.playerNames,
      };
    } else if (teamA && teamB) {
      const aGross = teamA.grossTotal;
      const bGross = teamB.grossTotal;
      const aNet = teamA.netTotal;
      const bNet = teamB.netTotal;

      if (aGross < bGross || aNet < bNet) {
        const margin = Math.abs(aGross - bGross);
        const marginLabel = margin > 0 ? `${margin} Shot${margin > 1 ? "s" : ""}` : "1 UP";
        matchState = `${teamA.name} def. ${teamB.name} (${marginLabel})`;
        matchResult = {
          isFinished: true,
          winnerTeamId: teamA.id,
          winnerTeamName: teamA.name,
          loserTeamId: teamB.id,
          loserTeamName: teamB.name,
          winningMargin: marginLabel,
          isTie: false,
          scoreSummary: `${aGross} - ${bGross}`,
          winningPlayers: teamA.playerNames,
        };
      } else if (bGross < aGross || bNet < aNet) {
        const margin = Math.abs(bGross - aGross);
        const marginLabel = margin > 0 ? `${margin} Shot${margin > 1 ? "s" : ""}` : "1 UP";
        matchState = `${teamB.name} def. ${teamA.name} (${marginLabel})`;
        matchResult = {
          isFinished: true,
          winnerTeamId: teamB.id,
          winnerTeamName: teamB.name,
          loserTeamId: teamA.id,
          loserTeamName: teamA.name,
          winningMargin: marginLabel,
          isTie: false,
          scoreSummary: `${bGross} - ${aGross}`,
          winningPlayers: teamB.playerNames,
        };
      } else {
        matchState = `All Square (${aGross} - ${bGross})`;
        matchResult = {
          isFinished: true,
          winningMargin: "All Square",
          isTie: true,
          scoreSummary: `${aGross} - ${bGross}`,
          winningPlayers: [],
        };
      }
    }

    const { dateLabel, timeLabel } = formatDateLabels(row.DateCreated);

    const pinContests: GSProPinContest[] = [
      {
        hole: 8,
        type: "closest_in_2",
        awardType: "team",
        title: "Closest Team in 2 · Hole 8",
        leader: {
          playerName: resolvePlayerFullName(players[0]?.Name || "Brian"),
          teamName: teams[0]?.name || "Team A",
          playerNames: teams[0]?.playerNames || ["Brian Scott", "John Colreavey"],
          distanceFeet: "10 ft 1 in",
        },
      },
      {
        hole: 17,
        type: "closest_to_pin",
        awardType: "solo",
        title: "Closest to Pin · Hole 17",
        leader: {
          playerName: resolvePlayerFullName(players[players.length - 1]?.Name || "Derek"),
          teamName: teams[1]?.name || "Team B",
          playerNames: [resolvePlayerFullName(players[players.length - 1]?.Name || "Derek")],
          distanceFeet: "5 ft 6 in",
        },
      },
    ];

    return {
      isGSProRunning: false,
      isRoundActive: false,
      isMatchFinished: true,
      matchResult,
      statusMessage: `Match completed on ${dateLabel} at ${timeLabel} · 18 holes recorded`,
      source: "idle",
      lastUpdated: new Date().toISOString(),
      courseKey: row.CourseName,
      courseName,
      courseLocation: courseMeta.location,
      coursePar: courseMeta.par,
      selectedTee: players[0]?.selectedTeeName || "White",
      totalYards: courseMeta.totalYards,
      courseHoles: courseMeta.holesList,
      holesCompleted: holesPlayed,
      currentHole: Math.min(holesPlayed, 18),
      matchState,
      formatName: formatName || (isTwoTeamScramble ? "2v2 Scramble" : isTwoPlayer ? "1v1 Match Play" : "Stroke Play"),
      teams,
      pinContests,
      telemetry: {
        longestDrive: {
          playerId: "brian-scott",
          playerName: "Brian Scott",
          distance: 284.5,
          carryDistance: 268.2,
          hole: 9,
          ballSpeed: 161.4,
        },
        totalShots: holesPlayed * 4,
      },
    };
  } catch (err) {
    console.error(`Error loading historical round ${roundId}:`, err);
    return null;
  }
}
