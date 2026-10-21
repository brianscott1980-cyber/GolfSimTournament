"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTournaments } from "@/components/tournament-provider";
import {
  tournamentHref,
  tournamentTabs,
  type ClubhouseRoute,
} from "@/lib/navigation";
import CourseCollection from "@/components/course-collection";
import PlayerAvatar from "@/components/player-avatar";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Flag,
  Trophy,
  Users,
  CalendarDays,
  ChevronDown,
  X,
  Check,
  Target,
  Upload,
  Download,
  Leaf,
  SlidersHorizontal,
  LogIn,
  Shuffle,
  CheckCircle2,
  MapPin,
  Search,
  Cloud,
  Maximize2,
  Minimize2,
  Zap,
  TrendingUp,
  Compass,
  Award,
} from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import {
  courses,
  formats,
  demo,
  defaultPlayers,
  applyInitialTournamentSetup,
  createTournament,
  standings,
  drawTournamentTeams,
  validateScores,
  type Tournament,
  type Round,
  type HoleScore,
} from "@/lib/golf";

// Currahee par values and stroke indexes for 18 holes (par 72)
const CURRAHEE_PARS = [4, 3, 5, 3, 4, 4, 4, 4, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5];
const CURRAHEE_STROKE_INDEX = [3, 13, 15, 17, 7, 9, 1, 5, 11, 4, 2, 18, 6, 12, 14, 10, 16, 8];

// Calculate player's extra handicap strokes received on a hole
function getHoleHandicapStrokes(handicap: number, strokeIndex: number): number {
  const rounded = Math.round(handicap);
  if (rounded <= 0) return 0;
  let strokes = Math.floor(rounded / 18);
  const remainder = rounded % 18;
  if (strokeIndex <= remainder) strokes += 1;
  return strokes;
}

// Simulated live GSPro in-progress round data (6 holes completed)
// Round 1 format: 2v2 Scramble (Team vs Team, 1 team score per hole)
// 2-person scramble handicap allowance: 35% low handicap + 15% high handicap
// Match play off the low team: lowest team plays off scratch (0 shots given),
// and the higher team receives the difference in strokes.
const rawTeamAHandicap = 7; // (0.35 * 10.3) + (0.15 * 25.1) = 7.37 -> 7
const rawTeamBHandicap = 2; // (0.35 * 2.6) + (0.15 * 9.0) = 2.26 -> 2
const lowTeamHandicap = Math.min(rawTeamAHandicap, rawTeamBHandicap); // 2

const simulatedLiveRound = {
  active: true,
  tournamentId: demo.id,
  roundNumber: 1,
  courseId: "currahee",
  holesCompleted: 6,
  matchState: "Brian & John 1 UP thru 6",
  formatName: "2v2 Best Ball Scramble",
  teams: [
    {
      id: "team-a",
      name: "Team A",
      playerIds: ["brian", "john"],
      rawHandicap: rawTeamAHandicap, // 7
      matchPlayAllowance: rawTeamAHandicap - lowTeamHandicap, // 7 - 2 = 5 strokes received
      scores: [
        { hole: 1, strokes: 4 }, // birdie (hole 1 is par 5)
        { hole: 2, strokes: 3 }, // par (par 3)
        { hole: 3, strokes: 4 }, // par (par 4)
        { hole: 4, strokes: 3 }, // par (par 3)
        { hole: 5, strokes: 4 }, // birdie (hole 5 is par 5)
        { hole: 6, strokes: 4 }, // par (par 4)
      ],
    },
    {
      id: "team-b",
      name: "Team B",
      playerIds: ["derek", "tony"],
      rawHandicap: rawTeamBHandicap, // 2
      matchPlayAllowance: rawTeamBHandicap - lowTeamHandicap, // 2 - 2 = 0 (scratch)
      scores: [
        { hole: 1, strokes: 5 }, // par (hole 1 is par 5)
        { hole: 2, strokes: 3 }, // par (par 3)
        { hole: 3, strokes: 4 }, // par (par 4)
        { hole: 4, strokes: 2 }, // birdie (par 3)
        { hole: 5, strokes: 5 }, // par (hole 5 is par 5)
        { hole: 6, strokes: 4 }, // par (par 4)
      ],
    },
  ],
  // Live player telemetry directly capturable from GSPro Open Connect (BallData / Launch Monitor & shot tracking)
  telemetry: {
    longestDrive: {
      playerId: "tony",
      distance: 294,
      ballSpeed: 167.4,
      hole: 5,
      fairway: true,
    },
    playerStats: [
      {
        playerId: "brian",
        avgDrive: 226,
        fairwaysHit: "3/4",
        shotShape: "Fade (Push)",
        launchAngle: "14.2°",
        ballSpeedAvg: "138 mph",
        clutchPutts: 1,
      },
      {
        playerId: "john",
        avgDrive: 248,
        fairwaysHit: "4/4",
        shotShape: "Straight / Slight Draw",
        launchAngle: "12.8°",
        ballSpeedAvg: "151 mph",
        clutchPutts: 2,
      },
      {
        playerId: "derek",
        avgDrive: 254,
        fairwaysHit: "3/4",
        shotShape: "Baby Draw",
        launchAngle: "11.9°",
        ballSpeedAvg: "155 mph",
        clutchPutts: 1,
      },
      {
        playerId: "tony",
        avgDrive: 288,
        fairwaysHit: "4/4",
        shotShape: "High Power Fade",
        launchAngle: "11.1°",
        ballSpeedAvg: "166 mph",
        clutchPutts: 2,
      },
    ],
  },
};
const date = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
const progress = (t: Tournament) => t.rounds.filter((r) => r.result).length;
export default function Clubhouse({ route }: { route: ClubhouseRoute }) {
  const router = useRouter();
  const { tournaments, setTournaments, ready, storageError } = useTournaments();
  const selected = route.tournamentId;
  const tab = route.tab;
  const [filter, setFilter] = useState("All tournaments");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"create" | "account" | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fullscreenScorecard, setFullscreenScorecard] = useState(false);
  useEffect(() => {
    if (supabase) {
      supabase.auth
        .getSession()
        .then(({ data }) => setUser(data.session?.user.email ?? null));
      const { data } = supabase.auth.onAuthStateChange((_event, session) =>
        setUser(session?.user.email ?? null),
      );
      return () => data.subscription.unsubscribe();
    }
  }, []);
  useEffect(() => {
    if (storageError) setNotice(storageError);
  }, [storageError]);
  useEffect(() => {
    setRoundId(null);
    setModal(null);
  }, [route.canonical]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const active = selected
    ? tournaments.find((t) => t.id === selected)
    : route.kind === "players" || route.kind === "courses"
      ? (tournaments[0] ?? demo)
      : undefined;
  const featuredCourse = courses.find(
    (c) =>
      c.id ===
      (
        tournaments[0]?.rounds.find((r) => !r.result) ??
        tournaments[0]?.rounds[0]
      )?.courseId,
  );
  const tournamentCourse = courses.find(
    (c) => c.id === active?.rounds[0]?.courseId,
  );
  const round = active?.rounds.find((r) => r.id === roundId);
  const update = (t: Tournament) =>
    setTournaments((all) => all.map((old) => (old.id === t.id ? t : old)));
  const saveRound = (r: Round) => {
    if (active)
      update({
        ...active,
        rounds: active.rounds.map((old) => (old.id === r.id ? r : old)),
      });
    setRoundId(null);
    setNotice("Round saved. Standings are up to date.");
  };
  async function sync(direction: "push" | "pull") {
    if (!supabase || !user) {
      setModal("account");
      return;
    }
    setBusy(true);
    try {
      const {
        data: { user: account },
      } = await supabase.auth.getUser();
      if (!account) throw new Error("Please sign in again.");
      if (direction === "push") {
        const { error } = await supabase.from("clubhouses").upsert({
          owner_id: account.id,
          tournaments,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        setNotice("Your clubhouse is saved to Supabase.");
      } else {
        const { data, error } = await supabase
          .from("clubhouses")
          .select("tournaments")
          .eq("owner_id", account.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setTournaments(applyInitialTournamentSetup(data.tournaments));
          setNotice("Cloud tournaments loaded.");
        } else setNotice("No cloud save yet. Save your clubhouse first.");
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Cloud sync failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app">
      <header className="header">
        <Link href="/" className="brand" aria-label="The Bunker home">
          <span className="brand-icon">
            <Flag size={23} />
          </span>
          The Bunker
          <span className="brand-dot" aria-hidden="true">
            .
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link
            href="/"
            className={
              route.kind === "dashboard" || route.kind === "tournament"
                ? "nav-active"
                : ""
            }
            aria-current={route.kind === "dashboard" ? "page" : undefined}
          >
            Tournaments
          </Link>
          <Link
            href="/players"
            className={route.kind === "players" ? "nav-active" : ""}
            aria-current={route.kind === "players" ? "page" : undefined}
          >
            The players
          </Link>
          <Link
            href="/courses"
            className={route.kind === "courses" ? "nav-active" : ""}
            aria-current={route.kind === "courses" ? "page" : undefined}
          >
            Course collection
          </Link>
        </nav>
        <button className="account" onClick={() => setModal("account")}>
          <PlayerAvatar name={user ?? "Brian Scott"} className="small" />
          <span>{user ? user.split("@")[0] : "Your clubhouse"}</span>
          <ChevronDown size={14} />
        </button>
      </header>
      <main>
        {selected && !ready ? (
          <div className="empty-state" role="status">
            Loading your tournament…
          </div>
        ) : selected && !active ? (
          <div className="empty-state">
            <h1>Tournament unavailable</h1>
            <p>
              This tournament is not saved in this browser. Sign in and load
              your cloud save, or return to your tournaments.
            </p>
            <Link className="button primary" href="/">
              All tournaments
            </Link>
          </div>
        ) : !active ? (
          <>
            <div className="page-intro">
              <div>
                <div className="eyebrow">
                  <span className="tiny-line" />
                  THE CLUBHOUSE
                </div>
                <h1>A little friendly competition.</h1>
                <p>
                  Great courses. Familiar faces. Bragging rights on the line.
                </p>
              </div>
              <button
                className="button primary"
                onClick={() => setModal("create")}
              >
                <Plus size={17} /> New tournament
              </button>
            </div>
            {simulatedLiveRound?.active ? (
              <section
                className={`live-scorecard-hero ${fullscreenScorecard ? "fullscreen" : ""}`}
              >
                <div className="live-scorecard-header">
                  <div className="live-scorecard-title-group">
                    {!fullscreenScorecard && (
                      <div className="eyebrow gold">
                        <span className="live-dot" /> LIVE FROM GSPRO · ROUND{" "}
                        {simulatedLiveRound.roundNumber} IN PROGRESS
                      </div>
                    )}
                    <div className="live-title-row">
                      <h2>
                        {courses.find((c) => c.id === simulatedLiveRound.courseId)?.name ?? "Currahee Golf Club"}
                      </h2>
                      {fullscreenScorecard && (
                        <span className="live-match-badge">
                          <span className="live-dot" /> {simulatedLiveRound.matchState}
                        </span>
                      )}
                    </div>
                    <div className="live-meta">
                      <span>{courses.find((c) => c.id === simulatedLiveRound.courseId)?.location}</span>
                      <span>·</span>
                      <span>Par {courses.find((c) => c.id === simulatedLiveRound.courseId)?.par ?? 72}</span>
                      <span>·</span>
                      <span>{simulatedLiveRound.formatName}</span>
                      {!fullscreenScorecard && (
                        <span className="live-match-badge">
                          {simulatedLiveRound.matchState}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="live-scorecard-actions">
                    <button
                      type="button"
                      className="button outline icon-only live-fullscreen-btn"
                      onClick={() => setFullscreenScorecard(!fullscreenScorecard)}
                      aria-label={fullscreenScorecard ? "Exit fullscreen" : "Enter fullscreen"}
                      title={fullscreenScorecard ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
                    >
                      {fullscreenScorecard ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                    </button>
                    {!fullscreenScorecard && (
                      <>
                        <Link
                          className="button outline"
                          href={tournamentHref(tournaments[0]?.id ?? demo.id, "Schedule")}
                        >
                          Round Details
                        </Link>
                        <Link
                          className="button primary"
                          href={tournamentHref(tournaments[0]?.id ?? demo.id)}
                        >
                          Tournament Hub <ArrowUpRight size={15} />
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div className="live-scorecard-table-wrap">
                  <table className="live-scorecard-table">
                    <colgroup>
                      <col className="live-col-player" />
                      {Array.from({ length: 18 }, (_, i) => (
                        <col key={i} className="live-col-hole" />
                      ))}
                      <col className="live-col-stat" />
                      <col className="live-col-stat" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="live-score-player-col">PAIRING / TEAM</th>
                        {Array.from({ length: 18 }, (_, i) => (
                          <th key={i} className="live-score-th">
                            <div className="live-th-hole">
                              <span className="live-th-num">{i + 1}</span>
                              <span className="live-th-si">SI {CURRAHEE_STROKE_INDEX[i]}</span>
                            </div>
                          </th>
                        ))}
                        <th className="live-total-col">TOT</th>
                        <th className="live-to-par">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulatedLiveRound.teams.map((team) => {
                        const tournamentPlayers = (tournaments[0] ?? demo).players;
                        const pairPlayers = team.playerIds
                          .map((id) => tournamentPlayers.find((p) => p.id === id))
                          .filter(Boolean);

                        const totalStrokes = team.scores.reduce(
                          (acc, s) => acc + s.strokes,
                          0,
                        );
                        const completedPars = team.scores.reduce((acc, s) => {
                          const par = CURRAHEE_PARS[s.hole - 1] ?? 4;
                          return acc + par;
                        }, 0);
                        const diff = totalStrokes - completedPars;
                        const diffLabel =
                          team.scores.length === 0
                            ? "E"
                            : diff === 0
                              ? "E"
                              : diff > 0
                                ? `+${diff}`
                                : `${diff}`;

                        return (
                          <tr key={team.id}>
                            <td className="live-score-player-col">
                              <div className="live-team-scramble-cell">
                                <div className="live-team-avatars">
                                  {pairPlayers.map((p) => (
                                    <PlayerAvatar
                                      key={p!.id}
                                      name={p!.name}
                                      className="small"
                                    />
                                  ))}
                                </div>
                                <div className="live-team-info">
                                  <div className="live-team-row-top">
                                    <span className="live-team-title">
                                      {team.name}
                                    </span>
                                    <span
                                      className="live-team-hcp-pill"
                                      title={`Team scramble handicap: ${team.rawHandicap}. Match allowance (off low team): ${team.matchPlayAllowance > 0 ? `+${team.matchPlayAllowance} strokes` : "Scratch (0)"}`}
                                    >
                                      {team.matchPlayAllowance > 0
                                        ? `+${team.matchPlayAllowance} SHOTS`
                                        : "SCRATCH"}
                                    </span>
                                  </div>
                                  <div className="live-team-pair-names">
                                    {pairPlayers.map((p) => p!.name.split(" ")[0]).join(" & ")}
                                    <span style={{ fontSize: "10px", color: "#8a9482", marginLeft: "5px" }}>
                                      (HCP {team.rawHandicap})
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {Array.from({ length: 18 }, (_, i) => {
                              const holeNum = i + 1;
                              const scoreObj = team.scores.find(
                                (s) => s.hole === holeNum,
                              );
                              const par = CURRAHEE_PARS[i] ?? 4;
                              const strokeIndex = CURRAHEE_STROKE_INDEX[i];
                              const extraStrokes = getHoleHandicapStrokes(
                                team.matchPlayAllowance,
                                strokeIndex,
                              );

                              if (!scoreObj) {
                                return (
                                  <td key={i} className="live-score-cell">
                                    <div className="live-cell-container">
                                      {extraStrokes > 0 && (
                                        <span
                                          className="live-hcp-dots"
                                          title={`+${extraStrokes} handicap stroke${extraStrokes > 1 ? "s" : ""}`}
                                        >
                                          {"•".repeat(extraStrokes)}
                                        </span>
                                      )}
                                      <span className="live-score-empty">—</span>
                                    </div>
                                  </td>
                                );
                              }
                              const scoreDiff = scoreObj.strokes - par;
                              const badgeClass =
                                scoreDiff <= -1
                                  ? "birdie"
                                  : scoreDiff === 1
                                    ? "bogey"
                                    : scoreDiff >= 2
                                      ? "double-bogey"
                                      : "par";
                              return (
                                <td key={i} className="live-score-cell">
                                  <div className="live-cell-container">
                                    {extraStrokes > 0 && (
                                      <span
                                        className="live-hcp-dots"
                                        title={`+${extraStrokes} handicap stroke${extraStrokes > 1 ? "s" : ""}`}
                                      >
                                        {"•".repeat(extraStrokes)}
                                      </span>
                                    )}
                                    <span className={`live-score-val ${badgeClass}`}>
                                      {scoreObj.strokes}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="live-total-col">
                              {team.scores.length > 0 ? totalStrokes : "—"}
                            </td>
                            <td
                              className={`live-to-par ${diff < 0 ? "under" : diff > 0 ? "over" : ""}`}
                            >
                              {team.scores.length > 0 ? diffLabel : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="live-scorecard-footer">
                  <div>
                    <div className="live-legend">
                      <span className="live-legend-item">
                        <span className="legend-pill birdie">○</span> Birdie / Better
                      </span>
                      <span className="live-legend-item">
                        <span className="legend-pill">4</span> Par
                      </span>
                      <span className="live-legend-item">
                        <span className="legend-pill bogey">□</span> Bogey
                      </span>
                      <span className="live-legend-item">
                        <span className="legend-pill double-bogey">⧈</span> Double+
                      </span>
                      <span className="live-legend-item">
                        <span style={{ color: "#7d4833", fontWeight: 800 }}>•</span> Stroke given
                      </span>
                    </div>
                    <div className="live-hcp-calc-explainer">
                      <strong>Handicap allowance:</strong> 35% low HCP + 15% high HCP played off lowest team. Team A (7) − Team B (2) = <strong>5 strokes given to Team A</strong> (on SI 1–5). Team B plays off Scratch.
                    </div>
                  </div>
                  <div>
                    Simulator connected · Auto-refreshing stroke telemetry
                  </div>
                </div>

                {fullscreenScorecard && (
                  <>
                    <div className="fullscreen-dashboard-grid">
                      <div className="fullscreen-stat-card">
                        <span className="fullscreen-stat-label">
                          <Target size={14} /> MATCH STANDING
                        </span>
                        <div className="fullscreen-stat-value">Team A 1 UP</div>
                        <div className="fullscreen-stat-sub">
                          Holes remaining: 12 · Maximum points remaining: 3
                        </div>
                      </div>
                      <div className="fullscreen-stat-card">
                        <span className="fullscreen-stat-label">
                          <Zap size={14} style={{ color: "#d19a3b" }} /> LONGEST DRIVE OF ROUND
                        </span>
                        <div className="fullscreen-stat-value">
                          {simulatedLiveRound.telemetry.longestDrive.distance} YDS
                        </div>
                        <div className="fullscreen-stat-sub">
                          {tournaments[0]?.players.find((p) => p.id === simulatedLiveRound.telemetry.longestDrive.playerId)?.name ?? "Tony McLean"} · Hole {simulatedLiveRound.telemetry.longestDrive.hole} ({simulatedLiveRound.telemetry.longestDrive.ballSpeed} mph ball speed)
                        </div>
                      </div>
                      <div className="fullscreen-stat-card">
                        <span className="fullscreen-stat-label">
                          <Flag size={14} /> ON THE TEE (HOLE 7)
                        </span>
                        <div className="fullscreen-stat-value">Par 4 · 420 YDS</div>
                        <div className="fullscreen-stat-sub">
                          Stroke Index 1 · Team A receives 1 handicap stroke
                        </div>
                      </div>
                      <div className="fullscreen-stat-card">
                        <span className="fullscreen-stat-label">
                          <Compass size={14} /> COURSE CONDITIONS
                        </span>
                        <div className="fullscreen-stat-value">Fairways Firm · Stimp 11</div>
                        <div className="fullscreen-stat-sub">
                          Wind: 6 mph SW · Currahee Club, Georgia
                        </div>
                      </div>
                    </div>

                    <div className="fullscreen-telemetry-row">
                      <div className="fullscreen-telemetry-card">
                        <div className="fullscreen-card-head">
                          <h3>
                            <TrendingUp size={16} /> Live Player Telemetry & Shot Shape Trends
                          </h3>
                          <span className="live-team-badge">GSPro Launch Telemetry</span>
                        </div>
                        <div className="fullscreen-telemetry-grid">
                          {simulatedLiveRound.telemetry.playerStats.map((stat) => {
                            const playerObj = (tournaments[0] ?? demo).players.find(
                              (p) => p.id === stat.playerId,
                            );
                            return (
                              <div className="player-telemetry-box" key={stat.playerId}>
                                <div className="player-telemetry-head">
                                  <PlayerAvatar name={playerObj?.name ?? stat.playerId} className="small" />
                                  <div>
                                    <div className="player-telemetry-name">{playerObj?.name}</div>
                                    <span className="telemetry-shape-pill">{stat.shotShape}</span>
                                  </div>
                                </div>
                                <div className="player-telemetry-metrics">
                                  <div className="telemetry-metric">
                                    <span className="metric-label">Avg Drive</span>
                                    <span className="metric-val">{stat.avgDrive} yds</span>
                                  </div>
                                  <div className="telemetry-metric">
                                    <span className="metric-label">Ball Speed</span>
                                    <span className="metric-val">{stat.ballSpeedAvg}</span>
                                  </div>
                                  <div className="telemetry-metric">
                                    <span className="metric-label">Fairways</span>
                                    <span className="metric-val">{stat.fairwaysHit}</span>
                                  </div>
                                  <div className="telemetry-metric">
                                    <span className="metric-label">Launch</span>
                                    <span className="metric-val">{stat.launchAngle}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="fullscreen-extras-row">
                      <div className="fullscreen-extra-card">
                        <div className="fullscreen-card-head">
                          <h3>
                            <Target size={16} /> Closest to the Pin (In Progress)
                          </h3>
                          <span className="live-team-badge">2 Contests</span>
                        </div>
                        <div className="fullscreen-pins-list">
                          <div className="fullscreen-pin-item">
                            <span className="fullscreen-pin-hole">Hole 2 (Par 3, 168 yds)</span>
                            <span className="fullscreen-pin-leader">Tony McLean (Team B)</span>
                            <span className="fullscreen-pin-dist">4 ft 8 in</span>
                          </div>
                          <div className="fullscreen-pin-item">
                            <span className="fullscreen-pin-hole">Hole 17 (Par 3, 192 yds)</span>
                            <span className="fullscreen-pin-leader">Upcoming</span>
                            <span className="fullscreen-pin-dist" style={{ opacity: 0.6 }}>—</span>
                          </div>
                        </div>
                      </div>

                      <div className="fullscreen-extra-card">
                        <div className="fullscreen-card-head">
                          <h3>
                            <CheckCircle2 size={16} /> Hole-by-Hole Match Status
                          </h3>
                          <span className="live-team-badge">Thru Hole 6</span>
                        </div>
                        <div className="fullscreen-pins-list">
                          <div className="fullscreen-pin-item">
                            <span>Holes 1–3</span>
                            <span style={{ fontWeight: 600 }}>Team A win Hole 1 · Halved 2 & 3</span>
                            <span className="fullscreen-pin-dist">Team A 1 UP</span>
                          </div>
                          <div className="fullscreen-pin-item">
                            <span>Holes 4–6</span>
                            <span style={{ fontWeight: 600 }}>Team B win Hole 4 · Team A win Hole 5 · Halved 6</span>
                            <span className="fullscreen-pin-dist">Team A 1 UP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </section>
            ) : null}
            <div className="stats-strip">
              <div>
                <Trophy />
                <span>
                  <strong>
                    {tournaments.length.toString().padStart(2, "0")}
                  </strong>
                  Tournaments
                </span>
              </div>
              <div>
                <Users />
                <span>
                  <strong>
                    {new Set(
                      tournaments.flatMap((t) => t.players.map((p) => p.name)),
                    ).size
                      .toString()
                      .padStart(2, "0")}
                  </strong>
                  Players in the mix
                </span>
              </div>
              <div>
                <Flag />
                <span>
                  <strong>
                    {tournaments
                      .reduce((n, t) => n + progress(t), 0)
                      .toString()
                      .padStart(2, "0")}
                  </strong>
                  Rounds in the books
                </span>
              </div>
              <div>
                <Target />
                <span>
                  <strong>
                    {tournaments
                      .flatMap((t) => t.rounds.flatMap((r) => r.pins))
                      .filter((p) => p.playerId)
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  Pins claimed
                </span>
              </div>
            </div>
            <section className="tournament-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">YOUR SEASON, AT A GLANCE</div>
                  <h2>The tournaments</h2>
                </div>
                <div className="section-controls">
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="Search tournaments"
                      placeholder="Find a tournament"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <SlidersHorizontal size={17} />
                  <select
                    aria-label="Filter tournaments"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>All tournaments</option>
                    <option>In progress</option>
                    <option>Upcoming</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
              <div className="tournament-grid">
                {tournaments
                  .filter(
                    (t) =>
                      t.name.toLowerCase().includes(query.toLowerCase()) &&
                      (filter === "All tournaments" ||
                        (filter === "Completed" && progress(t) === 3) ||
                        (filter === "In progress" &&
                          progress(t) > 0 &&
                          progress(t) < 3) ||
                        (filter === "Upcoming" && progress(t) === 0)),
                  )
                  .map((t) => (
                    <Link
                      className="tournament-card"
                      key={t.id}
                      href={tournamentHref(t.id)}
                    >
                      <div
                        className="card-photo"
                        style={{
                          backgroundImage: `url(${courses.find((c) => c.id === t.rounds.find((r) => !r.result)?.courseId)?.image ?? "/images/course.jpg"})`,
                        }}
                      >
                        <span className="pill">
                          {progress(t) === 3
                            ? "COMPLETED"
                            : progress(t)
                              ? "IN PROGRESS"
                              : "UPCOMING"}
                        </span>
                        <span className="platform">GSPro</span>
                      </div>
                      <div className="card-body">
                        <div className="eyebrow">
                          {date(t.rounds[0].date)} — {date(t.rounds[2].date)}{" "}
                          {t.rounds[2].date.slice(0, 4)}
                        </div>
                        <h3>{t.name}</h3>
                        <p>
                          4 players <span>·</span> 3 rounds <span>·</span> 2 vs
                          2
                        </p>
                        <div className="card-progress">
                          <span
                            style={{
                              width: `${Math.round((progress(t) / 3) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="progress-caption">
                          <span>{progress(t)} of 3 rounds played</span>
                          <span>{Math.round((progress(t) / 3) * 100)}%</span>
                        </div>
                        <div className="card-bottom">
                          <div className="avatar-stack">
                            {t.players.map((p) => (
                              <PlayerAvatar key={p.id} name={p.name} />
                            ))}
                          </div>
                          <ArrowUpRight size={21} />
                        </div>
                      </div>
                    </Link>
                  ))}
                <button
                  className="create-card"
                  onClick={() => setModal("create")}
                >
                  <span className="plus-circle">
                    <Plus size={26} />
                  </span>
                  <h3>The next chapter starts here.</h3>
                  <p>
                    Four players, a fresh draw,
                    <br />
                    and a new set of bragging rights.
                  </p>
                  <span className="text-link">
                    Create a tournament <ArrowRight size={16} />
                  </span>
                </button>
              </div>
            </section>
            <div className="club-note">
              <Leaf size={23} />
              <div>
                <h3>Different teams. Same good company.</h3>
                <p>
                  Rotating pairings mean everyone gets a teammate, and everyone
                  gets a rival.
                </p>
              </div>
              <span>THAT’S THE FOURBALL WAY.</span>
            </div>
          </>
        ) : (
          <>
            {selected && (
              <>
                <Link className="back" href="/">
                  <ArrowLeft size={15} /> All tournaments
                </Link>
                <section
                  className="detail-hero"
                  style={{
                    backgroundImage: `linear-gradient(90deg,rgba(10,37,26,.94),rgba(10,37,26,.4)),url('${tournamentCourse?.image ?? "/images/course.jpg"}')`,
                  }}
                >
                  <div className="eyebrow gold">
                    THE FOURBALL SERIES <span>•</span> GSPRO
                  </div>
                  <h1>{active.name}</h1>
                  <p>{active.subtitle}</p>
                  <div className="detail-meta">
                    <span>
                      <Users size={16} />4 players
                    </span>
                    <span>
                      <Flag size={16} />3 rounds
                    </span>
                    <span>
                      <CalendarDays size={16} />
                      {date(active.rounds[0].date)} —{" "}
                      {date(active.rounds[2].date)}{" "}
                      {active.rounds[2].date.slice(0, 4)}
                    </span>
                    <span className="pill">
                      {progress(active) === 3
                        ? "Completed"
                        : progress(active)
                          ? "In progress"
                          : "Upcoming"}
                    </span>
                  </div>
                </section>
                <div className="tabs">
                  {tournamentTabs.map((item) => (
                    <Link
                      key={item}
                      className={tab === item ? "active" : ""}
                      href={tournamentHref(active.id, item)}
                      aria-current={tab === item ? "page" : undefined}
                    >
                      {item}
                    </Link>
                  ))}
                  <span>
                    WIN <b>3 PTS</b> <i>·</i> DRAW <b>1 PT</b>
                  </span>
                </div>
              </>
            )}
            {(tab === "Overview" || tab === "Schedule") && (
              <div className="detail-grid">
                <section>
                  <div className="section-heading">
                    <div>
                      <div className="eyebrow">THE ROAD TO BRAGGING RIGHTS</div>
                      <h2>
                        {tab === "Overview"
                          ? "On the tee"
                          : "The draw & schedule"}
                      </h2>
                    </div>
                    {!progress(active) && (
                      <button
                        className="button outline"
                        onClick={() => {
                          const teams = drawTournamentTeams(active);
                          update({
                            ...active,
                            rounds: active.rounds.map((r, i) => ({
                              ...r,
                              teams: teams[i],
                            })),
                          });
                          setNotice(
                            "A fresh draw is ready. Each player pairs with everyone in the first three rounds.",
                          );
                        }}
                      >
                        <Shuffle size={15} /> Redraw
                      </button>
                    )}
                  </div>
                  {active.rounds
                    .filter((r) => tab === "Schedule" || !r.result)
                    .map((r) => {
                      const c = courses.find((c) => c.id === r.courseId)!;
                      const index = active.rounds.indexOf(r);
                      return (
                        <div className="round-card" key={r.id}>
                          <div
                            className="round-image"
                            style={{ backgroundImage: `url(${c.image})` }}
                          >
                            <span className="round-label">
                              ROUND {index + 1}
                            </span>
                          </div>
                          <div className="round-info">
                            <div className="eyebrow">
                              {date(r.date)} <span>•</span>{" "}
                              {r.result ? "ROUND COMPLETE" : "18 HOLES"}
                            </div>
                            <h3>{c.name}</h3>
                            <p>
                              <MapPin size={13} />
                              {c.location}{" "}
                              {c.par && (
                                <>
                                  <span>·</span> Par {c.par}
                                </>
                              )}
                            </p>
                            <span className="format-tag">{r.format}</span>
                            {r.result && (
                              <p className="result-summary">
                                {r.result === "draw"
                                  ? "Match drawn · 1 point each"
                                  : `${r.teams[r.result === "A" ? 0 : 1].map((id) => active.players.find((p) => p.id === id)?.name.split(" ")[0]).join(" + ")} won · 3 points each`}
                              </p>
                            )}
                            <div className="matchup">
                              <span>
                                {r.teams[0]
                                  .map(
                                    (id) =>
                                      active.players
                                        .find((p) => p.id === id)
                                        ?.name.split(" ")[0],
                                  )
                                  .join(" + ")}
                              </span>
                              <small>VS</small>
                              <span>
                                {r.teams[1]
                                  .map(
                                    (id) =>
                                      active.players
                                        .find((p) => p.id === id)
                                        ?.name.split(" ")[0],
                                  )
                                  .join(" + ")}
                              </span>
                            </div>
                            <div className="round-bottom">
                              <span>
                                <Target size={14} /> CTP{" "}
                                {r.pins.map((p) => `#${p.hole}`).join(" & ")}{" "}
                                <span className="hio">
                                  HIO {r.hio.map((h) => `#${h}`).join(", ")}
                                </span>
                              </span>
                              <button
                                className="text-link"
                                onClick={() => setRoundId(r.id)}
                              >
                                {r.result ? "View result" : "Round details"}
                                <ArrowUpRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {tab === "Overview" && progress(active) === 3 && (
                    <div className="empty-state">
                      <Trophy size={40} />
                      <h3>That’s a wrap.</h3>
                      <p>
                        All three rounds are in. The bragging rights are
                        settled.
                      </p>
                    </div>
                  )}
                </section>
                <aside>
                  <Leaderboard tournament={active} compact />
                  <div className="prize-note">
                    <Target size={23} />
                    <div className="eyebrow">A LITTLE EXTRA TO PLAY FOR</div>
                    <h3>Go pin hunting.</h3>
                    <p>
                      Two closest-to-pin prizes every round. On the green to be
                      in the running.
                    </p>
                    <div className="rule-line" />
                    <p>
                      HIO challenge holes are published in each round before you
                      tee off.
                    </p>
                  </div>
                  <div className="pairing-note">
                    <Shuffle size={17} />
                    <p>
                      Every partnership plays once across three rounds.{" "}
                      {active.fixedPairing
                        ? `${active.fixedPairing.players.map((id) => active.players.find((p) => p.id === id)?.name.split(" ")[0]).join(" and ")} pair at ${courses.find((c) => c.id === active.fixedPairing?.courseId)?.name}; the remaining rounds are drawn at random.`
                        : "The order of the draw is random."}
                    </p>
                  </div>
                </aside>
              </div>
            )}
            {tab === "Leaderboard" && (
              <div className="wide-panel">
                <Leaderboard tournament={active} />
                <p className="muted">
                  3 points per winning player · 1 point per player for a draw ·
                  Closest-to-pin prizes tracked separately. Tied points share a
                  position.
                </p>
              </div>
            )}
            {tab === "Players" && (
              <section className="wide-panel">
                <div className="eyebrow">YOUR REGULAR FOUR</div>
                <h2>The players</h2>
                <p className="muted">
                  Handicaps are recorded for reference. Agree handicap
                  allowances in your simulator before play.
                </p>
                <div className="player-grid">
                  {active.players.map((p) => (
                    <div className="player-card" key={p.id}>
                      <PlayerAvatar name={p.name} className="large" />
                      <h3>{p.name}</h3>
                      <label>
                        HANDICAP INDEX
                        <input
                          type="number"
                          min="-10"
                          max="54"
                          step="0.1"
                          value={p.handicap}
                          onChange={(e) => {
                            const handicap = Number(e.target.value);
                            if (handicap >= -10 && handicap <= 54)
                              update({
                                ...active,
                                players: active.players.map((old) =>
                                  old.id === p.id ? { ...p, handicap } : old,
                                ),
                              });
                          }}
                        />
                      </label>
                      <span className="text-link">
                        {standings(active).find((s) => s.id === p.id)?.points}{" "}
                        tournament points
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {tab === "Courses" && <CourseCollection />}
          </>
        )}
        <footer>
          <Link className="brand" href="/">
            fourball<span className="brand-dot">.</span>
          </Link>
          <span>A GOOD GAME. EVEN BETTER COMPANY.</span>
          <button onClick={() => setModal("account")}>
            <Cloud size={14} />
            {user ? "Cloud account" : "Local clubhouse"}
            <ArrowUpRight size={14} />
          </button>
        </footer>
      </main>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button aria-label="Dismiss" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal === "create" && (
        <Modal
          title="Start something worth winning."
          subtitle="A new tournament"
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const names = [0, 1, 2, 3].map((i) =>
                String(f.get(`name${i}`)).trim(),
              );
              if (
                !String(f.get("title")).trim() ||
                names.some((n) => !n) ||
                new Set(names.map((n) => n.toLowerCase())).size !== 4
              ) {
                setNotice(
                  "Please enter a tournament name and four different player names.",
                );
                return;
              }
              const t = createTournament(
                String(f.get("title")).trim(),
                names.map((name, i) => ({
                  id: crypto.randomUUID(),
                  name,
                  handicap: Number(f.get(`hcp${i}`)),
                })),
                String(f.get("date")),
              );
              setTournaments((all) => [t, ...all]);
              router.push(tournamentHref(t.id, "Schedule"));
              setModal(null);
              setNotice("Tournament created. Your random draw is ready.");
            }}
          >
            <label>
              Tournament name
              <input
                name="title"
                placeholder="The Winter Invitational"
                required
                maxLength={70}
              />
            </label>
            <label>
              First round date
              <input
                type="date"
                name="date"
                defaultValue={new Date().toLocaleDateString("en-CA")}
                required
              />
            </label>
            <div className="form-label">
              YOUR FOUR <span>HANDICAP</span>
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div className="player-inputs" key={i}>
                <span className="avatar small">{i + 1}</span>
                <input
                  name={`name${i}`}
                  aria-label={`Player ${i + 1} name`}
                  placeholder={`Player ${i + 1} name`}
                  defaultValue={defaultPlayers[i].name}
                  required
                  maxLength={50}
                />
                <input
                  name={`hcp${i}`}
                  aria-label={`Player ${i + 1} handicap`}
                  type="number"
                  min="-10"
                  max="54"
                  step="0.1"
                  defaultValue={defaultPlayers[i].handicap}
                  required
                />
              </div>
            ))}
            <div className="form-note">
              <Shuffle size={18} />
              <p>
                Three rounds. Three unique pairings, drawn in a random order.
                Courses, formats and dates can be edited in each round.
              </p>
            </div>
            <button className="button primary full" type="submit">
              Create tournament & draw teams <ArrowRight size={17} />
            </button>
          </form>
        </Modal>
      )}
      {modal === "account" && (
        <Modal
          title="Your clubhouse, anywhere."
          subtitle="Cloud connection"
          onClose={() => setModal(null)}
        >
          {!supabase ? (
            <>
              <p className="muted">
                Your tournaments are saved in this browser. To enable cloud
                storage, add your Supabase project URL and public key to{" "}
                <code>.env.local</code>, then run the included database
                migration.
              </p>
              <div className="form-note">
                <Cloud />
                <p>
                  Setup instructions are in the repository README. Your local
                  tournaments remain available while you connect.
                </p>
              </div>
            </>
          ) : user ? (
            <>
              <p>
                Signed in as <strong>{user}</strong>
              </p>
              <p className="muted">
                Save this browser’s clubhouse to the cloud, or load your last
                cloud save. Loading replaces the tournaments in this browser.
              </p>
              <div className="button-row">
                <button
                  disabled={busy}
                  className="button primary"
                  onClick={() => sync("push")}
                >
                  <Cloud size={16} />
                  Save to cloud
                </button>
                <button
                  disabled={busy}
                  className="button outline"
                  onClick={() => sync("pull")}
                >
                  Load cloud save
                </button>
              </div>
              <button
                className="back"
                onClick={async () => {
                  await supabase?.auth.signOut();
                  setNotice("Signed out. Local tournaments are still saved.");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const email = String(
                  new FormData(e.currentTarget).get("email"),
                );
                const { error } = await supabase!.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: window.location.origin },
                });
                setBusy(false);
                setNotice(
                  error
                    ? error.message
                    : "Check your email for your sign-in link.",
                );
              }}
            >
              <p className="muted">
                Sign in with an email link to save and restore your tournaments
                with Supabase.
              </p>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
              <button disabled={busy} className="button primary full">
                <LogIn size={16} />
                {busy ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          )}
        </Modal>
      )}
      {round && active && (
        <RoundEditor
          key={round.id}
          round={round}
          tournament={active}
          onClose={() => setRoundId(null)}
          onSave={saveRound}
          notify={setNotice}
        />
      )}
    </div>
  );
}
function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),summary",
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
      previouslyFocused?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
      >
        <button
          autoFocus
          className="modal-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="eyebrow">{subtitle}</div>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
function Leaderboard({
  tournament: t,
  compact = false,
}: {
  tournament: Tournament;
  compact?: boolean;
}) {
  const rows = standings(t);
  return (
    <section className="leaderboard">
      <div className="leader-heading">
        <div className="eyebrow">THE BRAGGING RIGHTS</div>
        <h2>
          Leaderboard <Trophy size={21} />
        </h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>POS</th>
            <th>PLAYER</th>
            {!compact && (
              <>
                <th>PLAYED</th>
                <th>W</th>
                <th>D</th>
                <th>CTP</th>
              </>
            )}
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.id}>
              <td>{rows.findIndex((r) => r.points === p.points) + 1}</td>
              <td>
                <PlayerAvatar name={p.name} className={`small tone-${i}`} />
                <span>
                  {p.name}
                  <small>HCP {p.handicap.toFixed(1)}</small>
                </span>
              </td>
              {!compact && (
                <>
                  <td>{p.played}</td>
                  <td>{p.wins}</td>
                  <td>{p.draws}</td>
                  <td>{p.pins}</td>
                </>
              )}
              <td>
                <strong>{p.points}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="leader-foot">
        <span className="live-dot" />
        {progress(t)} of 3 rounds complete
      </div>
    </section>
  );
}
function RoundEditor({
  round,
  tournament: t,
  onClose,
  onSave,
  notify,
}: {
  round: Round;
  tournament: Tournament;
  onClose: () => void;
  onSave: (r: Round) => void;
  notify: (s: string) => void;
}) {
  const [r, setR] = useState<Round>(structuredClone(round));
  const [preview, setPreview] = useState<HoleScore[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [hioText, setHioText] = useState(round.hio.join(", "));
  const [error, setError] = useState("");
  const index = t.rounds.findIndex((old) => old.id === r.id);
  const teamName = (n: number) =>
    r.teams[n]
      .map((id) => t.players.find((p) => p.id === id)?.name)
      .join(" + ");
  return (
    <Modal
      subtitle={`Round ${index + 1} · GSPro`}
      title={courses.find((c) => c.id === r.courseId)!.name}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (r.pins[0].hole === r.pins[1].hole) {
            setError("Choose two different closest-to-pin holes.");
            return;
          }
          const hio = hioText.split(",").map((v) => Number(v.trim()));
          if (hio.some((h) => !Number.isInteger(h) || h < 1 || h > 18)) {
            setError("HIO holes must be between 1 and 18.");
            return;
          }
          onSave({ ...r, hio: [...new Set(hio)] });
        }}
      >
        <div className="two-columns">
          <label>
            Course
            <select
              value={r.courseId}
              onChange={(e) => setR({ ...r, courseId: e.target.value })}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.access === "Creator-supported"
                    ? " · Creator-supported"
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Round date
            <input
              type="date"
              required
              value={r.date}
              onChange={(e) => setR({ ...r, date: e.target.value })}
            />
          </label>
        </div>
        <label>
          Game format
          <select
            value={r.format}
            onChange={(e) =>
              setR({ ...r, format: e.target.value as Round["format"] })
            }
          >
            {formats.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <p className="muted small-text">
          Handicap allowances and format scoring are agreed in GSPro. Record the
          team outcome below to award tournament points.
        </p>
        <div className="match-box">
          <span>
            TEAM A<strong>{teamName(0)}</strong>
          </span>
          <small>VS</small>
          <span>
            TEAM B<strong>{teamName(1)}</strong>
          </span>
        </div>
        <label>
          Match result
          <select
            value={r.result ?? ""}
            onChange={(e) =>
              setR({
                ...r,
                result: (e.target.value || undefined) as Round["result"],
              })
            }
          >
            <option value="">Not yet decided</option>
            <option value="A">Team A wins · 3 points each</option>
            <option value="B">Team B wins · 3 points each</option>
            <option value="draw">Match drawn · 1 point each</option>
          </select>
        </label>
        <h3 className="form-section-title">Closest to the pin</h3>
        <p className="muted small-text">
          Two prizes. Only shots finishing on the green qualify. Distance in
          feet.
        </p>
        {r.pins.map((pin, i) => (
          <div className="pin-row" key={i}>
            <label>
              Hole
              <input
                aria-label={`CTP ${i + 1} hole`}
                type="number"
                min="1"
                max="18"
                required
                value={pin.hole}
                onChange={(e) =>
                  setR({
                    ...r,
                    pins: r.pins.map((p, j) =>
                      j === i ? { ...p, hole: Number(e.target.value) } : p,
                    ) as Round["pins"],
                  })
                }
              />
            </label>
            <label>
              On-green winner
              <select
                value={pin.playerId ?? ""}
                onChange={(e) =>
                  setR({
                    ...r,
                    pins: r.pins.map((p, j) =>
                      j === i
                        ? {
                            hole: p.hole,
                            playerId: e.target.value || undefined,
                          }
                        : p,
                    ) as Round["pins"],
                  })
                }
              >
                <option value="">Unclaimed</option>
                {t.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Feet
              <input
                aria-label={`CTP ${i + 1} distance`}
                type="number"
                min="0"
                step="0.01"
                disabled={!pin.playerId}
                required={!!pin.playerId}
                value={pin.distance ?? ""}
                onChange={(e) =>
                  setR({
                    ...r,
                    pins: r.pins.map((p, j) =>
                      j === i
                        ? {
                            ...p,
                            distance:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          }
                        : p,
                    ) as Round["pins"],
                  })
                }
              />
            </label>
          </div>
        ))}
        <label>
          HIO challenge holes (announced in advance)
          <input
            placeholder="6, 16"
            pattern="\s*(?:[1-9]|1[0-8])(?:\s*,\s*(?:[1-9]|1[0-8]))*\s*"
            value={hioText}
            onChange={(e) => setHioText(e.target.value)}
          />
        </label>
        <h3 className="form-section-title">Scorecard & statistics</h3>
        <p className="muted small-text">
          Upload a CSV in the template format. Map GSPro exports to these
          columns first; results are confirmed manually above.
        </p>
        <div className="import-actions">
          <label className="button outline upload">
            <Upload size={15} />
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setError("");
                setPreview(null);
                if (file.size > 2_000_000) {
                  setError("Please upload a CSV smaller than 2 MB.");
                  return;
                }
                setFileName(file.name);
                Papa.parse<Record<string, string>>(file, {
                  header: true,
                  skipEmptyLines: true,
                  transformHeader: (h) => h.trim().toLowerCase(),
                  complete: (result) => {
                    try {
                      if (result.errors.length)
                        throw new Error(
                          "CSV could not be read. Check the template columns.",
                        );
                      setPreview(validateScores(result.data, t.players));
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Invalid scorecard.",
                      );
                    }
                  },
                  error: () => setError("Unable to read this file."),
                });
              }}
            />
          </label>
          <a
            className="text-link"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent("player,hole,strokes,putts,fairway,gir\n" + t.players[0].name + ",1,4,2,true,true\n")}`}
            download="fourball-scorecard-template.csv"
          >
            <Download size={15} />
            CSV template
          </a>
        </div>
        {preview && (
          <div className="import-preview">
            <strong>{fileName}</strong>
            <p>
              {preview.length} hole scores ·{" "}
              {new Set(preview.map((s) => s.playerId)).size} players
            </p>
            <button
              className="button primary"
              type="button"
              onClick={() => {
                setR({ ...r, scores: preview });
                setPreview(null);
                notify("Scorecard staged. Save round to confirm.");
              }}
            >
              <Check size={15} />
              Use scorecard (replaces previous)
            </button>
          </div>
        )}
        {r.scores.length > 0 && (
          <>
            <div className="scorecard">
              <table>
                <thead>
                  <tr>
                    <th>PLAYER</th>
                    <th>HOLES</th>
                    <th>STROKES</th>
                    <th>PUTTS</th>
                    <th>GIR</th>
                    <th>FW</th>
                  </tr>
                </thead>
                <tbody>
                  {t.players.map((p) => {
                    const scores = r.scores.filter((s) => s.playerId === p.id);
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{scores.length}</td>
                        <td>
                          {scores.length
                            ? scores.reduce((n, s) => n + s.strokes, 0)
                            : "—"}
                        </td>
                        <td>
                          {scores.some((s) => s.putts !== undefined)
                            ? scores.reduce((n, s) => n + (s.putts ?? 0), 0)
                            : "—"}
                        </td>
                        <td>
                          {scores.some((s) => s.gir !== undefined)
                            ? scores.filter((s) => s.gir).length
                            : "—"}
                        </td>
                        <td>
                          {scores.some((s) => s.fairway !== undefined)
                            ? scores.filter((s) => s.fairway).length
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <details>
                <summary>View hole-by-hole scores</summary>
                <table>
                  <thead>
                    <tr>
                      <th>PLAYER</th>
                      {Array.from({ length: 18 }, (_, i) => (
                        <th key={i}>{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.players.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        {Array.from({ length: 18 }, (_, i) => (
                          <td key={i}>
                            {r.scores.find(
                              (s) => s.playerId === p.id && s.hole === i + 1,
                            )?.strokes ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
            <p className="muted small-text">
              Partial rounds are supported. Totals cover imported holes only.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary full save-round" type="submit">
          Save round <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}
