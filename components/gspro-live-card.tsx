"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Zap,
  Target,
  Flag,
  Compass,
  Radio,
  TrendingUp,
  Swords,
  Trophy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Calendar,
  Check,
  Loader2,
} from "lucide-react";
import PlayerAvatar from "@/components/player-avatar";
import ThemeToggle from "@/components/theme-toggle";
import type { GSProLiveState } from "@/lib/gspro-live";
import { tournamentHref } from "@/lib/navigation";
import { demo, type Tournament, standings } from "@/lib/golf";

interface Props {
  liveData: GSProLiveState;
  tournaments: Tournament[];
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function GSProLiveCard({
  liveData,
  tournaments,
  fullscreen,
  onToggleFullscreen,
}: Props) {
  const [battleMode, setBattleMode] = useState<"net" | "gross">("net");
  const [hoveredHoleIndex, setHoveredHoleIndex] = useState<number | null>(null);

  // Previous Rounds Explorer state
  const [selectedRoundState, setSelectedRoundState] = useState<GSProLiveState | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(() => {
    if (liveData.isRoundActive) return null;
    return liveData.selectedRoundId || liveData.previousRounds?.[0]?.id || null;
  });
  const [loadingRoundId, setLoadingRoundId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isOpposingTeamMatch = (r: any) =>
    (r.holesCount || 0) >= 18 &&
    Boolean(r.teamsSummary && r.teamsSummary.includes(" vs "));

  const [historyList, setHistoryList] = useState<any[]>(() =>
    (liveData.previousRounds || []).filter(isOpposingTeamMatch)
  );

  const displayedHistoryList = historyList.filter(isOpposingTeamMatch);

  // If there is a live round in progress, always default to viewing the live round
  useEffect(() => {
    if (liveData.isRoundActive) {
      setSelectedRoundId(null);
      setSelectedRoundState(null);
    }
  }, [liveData.isRoundActive]);

  // Lock body scroll and listen for Escape key in fullscreen mode
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onToggleFullscreen();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [fullscreen, onToggleFullscreen]);

  useEffect(() => {
    if (liveData.previousRounds && liveData.previousRounds.length > 0) {
      setHistoryList(liveData.previousRounds.filter(isOpposingTeamMatch));
    } else if (historyList.length === 0) {
      fetch("/api/gspro/rounds")
        .then((r) => r.json())
        .then((items) => {
          if (Array.isArray(items)) {
            setHistoryList(items.filter(isOpposingTeamMatch));
          }
        })
        .catch(() => {});
    }
  }, [liveData.previousRounds]);

  const handleSelectRound = async (id: number) => {
    if (selectedRoundId === id && selectedRoundState) return;
    setSelectedRoundId(id);
    setLoadingRoundId(id);
    try {
      const res = await fetch(`/api/gspro/rounds?id=${id}`);
      if (res.ok) {
        const fetched: GSProLiveState = await res.json();
        setSelectedRoundState({
          ...fetched,
          selectedRoundId: id,
          previousRounds: historyList,
        });
      }
    } catch (err) {
      console.error("Failed to load historical round:", err);
    } finally {
      setLoadingRoundId(null);
    }
  };

  const isViewingLive = liveData.isRoundActive && selectedRoundId === null;
  const displayData = isViewingLive
    ? liveData
    : selectedRoundState && selectedRoundState.selectedRoundId === selectedRoundId
    ? selectedRoundState
    : liveData;

  const data = displayData;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  if ((!data.teams || data.teams.length === 0) && historyList.length === 0) {
    if (!liveData.isGSProRunning) {
      return (
        <div className="live-status-banner idle">
          <div className="live-status-left">
            <span className="live-status-pulse idle" />
            <span className="live-status-title">GSPro Simulator: Offline</span>
            <span className="live-status-sub">
              Simulated round stopped. Launch GSPro to automatically stream live round and shot telemetry.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="live-status-banner active">
        <div className="live-status-left">
          <span className="live-status-pulse active" />
          <span className="live-status-title">GSPro Connected</span>
          <span className="live-status-sub">
            Simulator is running. Select a course and tee off to display real-time live scorecard & ball telemetry.
          </span>
        </div>
      </div>
    );
  }

  const holes =
    data.courseHoles && data.courseHoles.length > 0
      ? data.courseHoles
      : Array.from({ length: 18 }, (_, i) => ({
          hole: i + 1,
          par: 4,
          strokeIndex: i + 1,
          distanceYards: 380,
        }));

  const mainTournament = tournaments[0] ?? demo;
  const activeHoleNumber = data.currentHole || 1;
  const activeHoleMeta = holes[activeHoleNumber - 1];

  const totalCoursePar = holes.reduce((sum, h) => sum + h.par, 0);

  return (
    <section className={`live-scorecard-hero ${fullscreen ? "fullscreen" : ""}`}>
      <div className="live-scorecard-header">
        <div className="live-scorecard-title-group">
          {!fullscreen && (
            <div className={`eyebrow ${data.isMatchFinished ? "green" : "gold"}`}>
              {isViewingLive ? (
                <>
                  <span className="live-dot" /> LIVE FROM GSPRO ·{" "}
                  {data.holesCompleted >= 18
                    ? "ROUND COMPLETE"
                    : `HOLE ${activeHoleNumber} IN PROGRESS`}
                </>
              ) : (
                <>
                  <History
                    size={13}
                    style={{
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginRight: 5,
                      color: "#10b981",
                    }}
                  />
                  {liveData.isRoundActive
                    ? `MATCH ARCHIVE · ${data.holesCompleted} HOLES RECORDED (FINAL)`
                    : `PREVIOUS ROUNDS EXPLORER · ${data.holesCompleted >= 18 ? "18 HOLES RECORDED (FINAL)" : `${data.holesCompleted} HOLES RECORDED`}`}
                </>
              )}
            </div>
          )}
          <div className="live-title-row">
            <h2>{data.courseName || "Currahee Club"}</h2>
            {fullscreen && data.matchState && (
              <span className={`live-match-badge ${data.isMatchFinished ? "final" : ""}`}>
                {data.isMatchFinished ? (
                  <CheckCircle2 size={13} style={{ color: "#34d399", marginRight: 5 }} />
                ) : (
                  <span className="live-dot" />
                )}
                {data.matchState}
              </span>
            )}
          </div>
          <div className="live-meta">
            <span>{data.courseLocation || "Toccoa, Georgia, USA"}</span>
            <span>·</span>
            <span>Par {data.coursePar || totalCoursePar || 72}</span>
            <span>·</span>
            <span>{data.formatName || "2v2 Scramble"}</span>
            {!fullscreen && data.matchState && (
              <span className={`live-match-badge ${data.isMatchFinished ? "final" : ""}`}>
                {data.matchState}
              </span>
            )}
          </div>
        </div>
        <div className="live-scorecard-actions">
          <ThemeToggle />
          <button
            type="button"
            className="button outline icon-only live-fullscreen-btn"
            onClick={onToggleFullscreen}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={fullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
          >
            {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
          {!fullscreen && (
            <>
              <Link
                className="button outline"
                href={tournamentHref(mainTournament.id, "Schedule")}
              >
                Round Details
              </Link>
              <Link
                className="button primary"
                href={tournamentHref(mainTournament.id)}
              >
                Tournament Hub <ArrowUpRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Horizontal Previous Rounds Explorer Cards (Hidden in Fullscreen mode or when a live round is active) */}
      {!fullscreen && !liveData.isRoundActive && displayedHistoryList.length > 0 && (
        <div className="previous-rounds-explorer-wrap">
          <div className="previous-rounds-bar">
            <div className="previous-rounds-info">
              <div className="previous-rounds-title">
                <History size={13} />
                <span>Previous Rounds Explorer</span>
                <span className="previous-rounds-count">
                  ({displayedHistoryList.length} completed match{displayedHistoryList.length === 1 ? "" : "es"})
                </span>
              </div>
              <span className="previous-rounds-subtitle">
                Select any past match below to explore its battle graph, Augusta standings & scorecards
              </span>
            </div>
            <div className="previous-rounds-controls">
              <button
                type="button"
                className="button outline icon-only rounds-scroll-arrow"
                onClick={scrollLeft}
                title="Scroll past matches left"
                aria-label="Scroll past matches left"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className="button outline icon-only rounds-scroll-arrow"
                onClick={scrollRight}
                title="Scroll past matches right"
                aria-label="Scroll past matches right"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="previous-rounds-scroll-area" ref={scrollContainerRef}>
            {displayedHistoryList.map((r) => {
              const isSelected = selectedRoundId === r.id;
              const isLoading = loadingRoundId === r.id;

              return (
                <button
                  key={`round-card-${r.id}`}
                  type="button"
                  className={`round-explorer-card ${isSelected ? "active" : ""}`}
                  onClick={() => handleSelectRound(r.id)}
                >
                  <div className="round-card-top">
                    <span className="round-card-date">
                      <Calendar size={10} /> {r.dateLabel}
                    </span>
                    <span className={`round-card-status-badge ${r.holesCount >= 18 ? "complete" : ""}`}>
                      {r.holesCount}H · FINAL
                    </span>
                  </div>
                  <div className="round-card-course" title={r.courseName}>
                    {r.courseName}
                  </div>
                  <div className="round-card-avatars">
                    {(r.playerNames || []).map((name: string) => (
                      <PlayerAvatar key={name} name={name} size={18} className="small round-card-avatar" />
                    ))}
                  </div>
                  <div className="round-card-teams" title={r.teamsSummary}>
                    {r.teamsSummary}
                  </div>
                  <div className="round-card-footer">
                    <div className="round-card-score">
                      <Trophy size={11} />
                      <span>{r.scoreSummary || r.matchState}</span>
                    </div>
                    {isLoading ? (
                      <span className="round-card-loading">Loading...</span>
                    ) : isSelected ? (
                      <span className="round-card-viewing-badge">
                        <Check size={10} /> Viewing
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="live-scorecard-table-wrap masters-scorecard-wrap">
        <table className="live-scorecard-table masters-scorecard-table">
          <colgroup>
            <col className="live-col-player" />
            {holes.map((h) => (
              <col
                key={h.hole}
                className={`live-col-hole ${h.hole === activeHoleNumber ? "active-hole-col" : ""}`}
              />
            ))}
            <col className="live-col-stat" />
            <col className="live-col-stat" />
          </colgroup>
          <thead>
            {/* Masters Header Row 1: Hole Numbers with Stroke Index */}
            <tr className="masters-row-holes">
              <th className="masters-label-col">
                <div className="masters-label-cell">
                  <span>Hole</span>
                  <span className="masters-label-si">Stroke Index</span>
                </div>
              </th>
              {holes.map((h) => {
                const isActive = h.hole === activeHoleNumber;
                return (
                  <th
                    key={h.hole}
                    className={`live-score-th ${isActive ? "active-hole-col" : ""}`}
                  >
                    <div className="masters-hole-cell">
                      <span className="masters-hole-num">{h.hole}</span>
                      <span className="masters-hole-si" title={`Hole ${h.hole} · Stroke Index ${h.strokeIndex}`}>
                        SI {h.strokeIndex}
                      </span>
                    </div>
                    {fullscreen && isActive && (
                      <span className="masters-active-pill">NOW</span>
                    )}
                  </th>
                );
              })}
              <th className="masters-tot-col">Total</th>
              <th className="masters-tot-col">+/-</th>
            </tr>

            {/* Masters Header Row 2: Distances (in Fullscreen mode) */}
            {fullscreen && (
              <tr className="masters-row-dist">
                <th className="masters-label-col">Distance</th>
                {holes.map((h) => (
                  <th
                    key={h.hole}
                    className={`live-score-th ${h.hole === activeHoleNumber ? "active-hole-col" : ""}`}
                  >
                    {h.distanceYards ? `${h.distanceYards}y` : "—"}
                  </th>
                ))}
                <th className="masters-tot-col">
                  {holes.reduce((sum, h) => sum + (h.distanceYards || 0), 0)}y
                </th>
                <th className="masters-tot-col">—</th>
              </tr>
            )}

            {/* Masters Header Row 3: Par Values */}
            <tr className="masters-row-par">
              <th className="masters-label-col">Par</th>
              {holes.map((h) => (
                <th
                  key={h.hole}
                  className={`live-score-th ${h.hole === activeHoleNumber ? "active-hole-col" : ""}`}
                >
                  {h.par}
                </th>
              ))}
              <th className="masters-tot-col">{totalCoursePar}</th>
              <th className="masters-tot-col">E</th>
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team) => (
              <tr key={team.id}>
                <td className="live-score-player-col">
                  <div className="live-team-scramble-cell">
                    <div className="live-team-avatars">
                      {team.playerNames.map((name) => (
                        <PlayerAvatar key={name} name={name} className="small" />
                      ))}
                    </div>
                    <div className="live-team-info">
                      <div className="live-team-row-top">
                        <span className="live-team-title">{team.name}</span>
                        <span
                          className="live-team-hcp-pill"
                          title={`Net Handicap: -${team.handicap}`}
                        >
                          HCP -{team.handicap}
                        </span>
                      </div>
                      <div className="live-team-pair-names">
                        {team.playerNames
                          .map((name) => {
                            const full =
                              name.toLowerCase() === "brian"
                                ? "Brian Scott"
                                : name.toLowerCase() === "john"
                                ? "John Colreavey"
                                : name.toLowerCase() === "tony"
                                ? "Tony McLean"
                                : name.toLowerCase() === "derek"
                                ? "Derek McMillan"
                                : name;
                            return full;
                          })
                          .join(" & ")}
                      </div>
                    </div>
                  </div>
                </td>
                {holes.map((h) => {
                  const scoreObj = team.scores.find((s) => s.hole === h.hole);
                  const isActive = h.hole === activeHoleNumber;
                  const cellClass = `live-score-cell ${isActive ? "active-hole-col" : ""}`;

                  // If hole is not played yet (gross is 0, undefined, or missing)
                  if (!scoreObj || !scoreObj.gross || scoreObj.gross <= 0) {
                    return (
                      <td key={h.hole} className={cellClass}>
                        <div className="live-cell-container">
                          {scoreObj && scoreObj.handicapStrokes > 0 && (
                            <span
                              className="live-hcp-dots"
                              title={`+${scoreObj.handicapStrokes} stroke given on SI ${h.strokeIndex}`}
                            >
                              {Array.from({ length: scoreObj.handicapStrokes }).map((_, i) => (
                                <span key={i} className="live-hcp-pip" />
                              ))}
                            </span>
                          )}
                          <span className="live-score-empty">—</span>
                        </div>
                      </td>
                    );
                  }

                  const scoreDiff = scoreObj.gross - h.par;
                  const badgeClass =
                    scoreDiff <= -2
                      ? "eagle"
                      : scoreDiff === -1
                      ? "birdie"
                      : scoreDiff === 1
                      ? "bogey"
                      : scoreDiff >= 2
                      ? "double-bogey"
                      : "par";

                  return (
                    <td key={h.hole} className={cellClass}>
                      <div className="live-cell-container">
                        {scoreObj.handicapStrokes > 0 && (
                          <span
                            className="live-hcp-dots"
                            title={`+${scoreObj.handicapStrokes} stroke given on SI ${h.strokeIndex}`}
                          >
                            {Array.from({ length: scoreObj.handicapStrokes }).map((_, i) => (
                              <span key={i} className="live-hcp-pip" />
                            ))}
                          </span>
                        )}
                        <span className={`masters-val ${badgeClass}`}>
                          {scoreObj.gross}
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="live-total-col masters-tot-col">
                  {team.scores.length > 0 ? (
                    <div>
                      <strong>{team.netTotal}</strong>
                      <span style={{ fontSize: "11px", opacity: 0.7, marginLeft: "4px" }}>
                        ({team.grossTotal})
                      </span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="live-to-par masters-tot-col">
                  {team.scores.length > 0 ? (
                    <div>
                      <strong>{team.netToParLabel}</strong>
                      <span style={{ fontSize: "11px", opacity: 0.7, marginLeft: "4px" }}>
                        ({team.grossToParLabel})
                      </span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fullscreen && (
        <>
          <div className="live-scorecard-footer">
            <div>
              <div className="live-legend">
                <span className="live-legend-item">
                  <span className="legend-shape eagle" /> Eagle
                </span>
                <span className="live-legend-item">
                  <span className="legend-shape birdie" /> Birdie
                </span>
                <span className="live-legend-item">
                  <span className="legend-shape bogey" /> Bogey
                </span>
                <span className="live-legend-item">
                  <span className="legend-shape double-bogey" /> Double Bogey+
                </span>
                <span className="live-legend-item">
                  <span className="live-hcp-pip legend-pip" /> Stroke given
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={14} className="live-pulse-icon" />
              <span>GSPro Local Live Link · Real-time 18-hole sync</span>
            </div>
          </div>

          <div className="fullscreen-lower-half">
          <div className="fullscreen-dashboard-grid">
            <div className={`fullscreen-stat-card ${data.isMatchFinished ? "final-match-card" : ""}`}>
              <span className="fullscreen-stat-label">
                {data.isMatchFinished ? (
                  <>
                    <Trophy size={14} style={{ color: "#f59e0b" }} /> FINAL MATCH RESULT
                  </>
                ) : (
                  <>
                    <Target size={14} /> MATCH STANDING
                  </>
                )}
              </span>
              <div className="fullscreen-stat-value">
                {data.matchState || "Round Complete"}
              </div>
              <div className="fullscreen-stat-sub">
                {data.isMatchFinished
                  ? `Official Result · 18 holes complete · Total shots: ${data.telemetry?.totalShots || 0}`
                  : `Thru hole ${data.holesCompleted} · Total shots: ${data.telemetry?.totalShots || 0}`}
              </div>
            </div>
            {data.telemetry?.longestDrive && (
              <div className="fullscreen-stat-card">
                <span className="fullscreen-stat-label">
                  <Zap size={14} style={{ color: "#d19a3b" }} /> LONGEST DRIVE · HOLE {data.telemetry.longestDrive.hole}
                </span>
                <div className="fullscreen-stat-value">
                  {data.telemetry.longestDrive.distance} YDS
                  {data.telemetry.longestDrive.carryDistance ? (
                    <span className="fullscreen-stat-carry">
                      {" "}({data.telemetry.longestDrive.carryDistance}y carry)
                    </span>
                  ) : null}
                </div>
                <div className="fullscreen-award-row">
                  <div className="fullscreen-award-avatars">
                    <PlayerAvatar name={data.telemetry.longestDrive.playerName} className="small" />
                  </div>
                  <div className="fullscreen-award-details">
                    <span className="fullscreen-award-winner">
                      {data.telemetry.longestDrive.playerName}
                    </span>
                    <span className="fullscreen-award-sub">
                      {data.telemetry.longestDrive.carryDistance
                        ? `${data.telemetry.longestDrive.carryDistance} yds carry · `
                        : ""}
                      {data.telemetry.longestDrive.ballSpeed} mph ball speed
                    </span>
                  </div>
                </div>
              </div>
            )}
            {data.pinContests && data.pinContests.length > 0 ? (
              data.pinContests.map((contest) => (
                <div className="fullscreen-stat-card" key={contest.hole}>
                  <span className="fullscreen-stat-label">
                    <Flag size={14} /> {contest.title.toUpperCase()} · {contest.awardType === "team" ? "TEAM AWARD" : "SOLO AWARD"}
                  </span>
                  <div className="fullscreen-stat-value">
                    {contest.leader.distanceFeet}
                  </div>
                  <div className="fullscreen-award-row">
                    <div className="fullscreen-award-avatars">
                      {contest.leader.playerNames.map((name) => (
                        <PlayerAvatar key={name} name={name} className="small" />
                      ))}
                    </div>
                    <div className="fullscreen-award-details">
                      <span className="fullscreen-award-winner">
                        {contest.awardType === "team"
                          ? `${contest.leader.teamName} (${contest.leader.playerNames.map((n) => n.split(" ")[0]).join(" & ")})`
                          : contest.leader.playerName}
                      </span>
                      <span className="fullscreen-award-sub">
                        {contest.awardType === "team"
                          ? `Shot by ${contest.leader.playerName}`
                          : `${contest.leader.teamName} · Hole ${contest.hole}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="fullscreen-stat-card">
                  <span className="fullscreen-stat-label">
                    <Flag size={14} /> ACTIVE HOLE ({activeHoleNumber})
                  </span>
                  <div className="fullscreen-stat-value">
                    Par {activeHoleMeta?.par || 4} · {activeHoleMeta?.distanceYards || 393} YDS
                  </div>
                  <div className="fullscreen-stat-sub">
                    Stroke Index {activeHoleMeta?.strokeIndex || activeHoleNumber}
                  </div>
                </div>
                <div className="fullscreen-stat-card">
                  <span className="fullscreen-stat-label">
                    <Compass size={14} /> GSPRO SIMULATOR STATUS
                  </span>
                  <div className="fullscreen-stat-value">Real-Time Sync Active</div>
                  <div className="fullscreen-stat-sub">
                    {data.courseName} · {data.courseLocation}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 4-Column Row: Battle Graph (3 cols) + Live Tournament Standings (1 col) */}
          <div className="battle-standings-row">
            {/* Columns 1-3: Dual-Team Head-to-Head Battle Progress Chart */}
            {data.teams.length >= 2 && data.teams[0].scores.length > 0 && (
              <div className="battle-chart-card">
          {(() => {
            const teamA = data.teams[0];
            const teamB = data.teams[1];
            // Only count holes that have actually been played (gross score > 0)
            const count = Math.min(
              teamA.scores.filter((s) => s.gross > 0).length,
              teamB.scores.filter((s) => s.gross > 0).length,
              18
            );

            if (count === 0) return null;

            // Calculate cumulative scores to par for both teams
            let cumNetA = 0;
            let cumNetB = 0;
            let cumGrossA = 0;
            let cumGrossB = 0;

            const timelinePoints = Array.from({ length: count }, (_, i) => {
              const holeMeta = holes[i] ?? {
                hole: i + 1,
                par: 4,
                distanceYards: 380,
                strokeIndex: i + 1,
              };
              const par = holeMeta.par;
              const sA = teamA.scores[i];
              const sB = teamB.scores[i];

              const grossA = sA?.gross ?? par;
              const grossB = sB?.gross ?? par;
              const netA = sA?.net ?? par;
              const netB = sB?.net ?? par;

              cumGrossA += grossA - par;
              cumGrossB += grossB - par;
              cumNetA += netA - par;
              cumNetB += netB - par;

              const valA = battleMode === "net" ? cumNetA : cumGrossA;
              const valB = battleMode === "net" ? cumNetB : cumGrossB;

              let holeWinner: "teamA" | "teamB" | "halved" = "halved";
              const compA = battleMode === "net" ? netA : grossA;
              const compB = battleMode === "net" ? netB : grossB;
              if (compA < compB) holeWinner = "teamA";
              else if (compB < compA) holeWinner = "teamB";

              return {
                hole: i + 1,
                par,
                distanceYards: holeMeta.distanceYards,
                strokeIndex: holeMeta.strokeIndex,
                grossA,
                grossB,
                netA,
                netB,
                cumGrossA,
                cumGrossB,
                cumNetA,
                cumNetB,
                valA,
                valB,
                holeWinner,
              };
            });

            // SVG Grid Dimensions - Balanced and uniformly scaled with scorecard
            const svgWidth = 840;
            const svgHeight = 148;
            const paddingLeft = 42;
            const paddingRight = 28;
            const paddingTop = 12;
            const innerHeight = 104;
            const plotBottom = paddingTop + innerHeight; // 116
            const innerWidth = svgWidth - paddingLeft - paddingRight; // 770

            // Compute Y Domain across both teams
            const allVals = timelinePoints.flatMap((p) => [p.valA, p.valB]);
            const rawMin = Math.min(0, ...allVals);
            const rawMax = Math.max(0, ...allVals);
            // Better score (more negative / under par) is higher up
            const domainMin = Math.min(-2, Math.floor(rawMin - 1));
            const domainMax = Math.max(1, Math.ceil(rawMax + 1));
            const yRange = domainMax - domainMin || 1;

            const getX = (holeIdx: number) =>
              paddingLeft + (holeIdx / 17) * innerWidth;
            const getY = (val: number) => {
              const ratio = (val - domainMin) / yRange;
              return paddingTop + ratio * innerHeight;
            };

            // Gridline ticks for Y-axis
            const step = yRange > 8 ? 2 : 1;
            const yTicks: number[] = [];
            for (let v = domainMin; v <= domainMax; v += step) {
              yTicks.push(v);
            }
            if (!yTicks.includes(0)) yTicks.push(0);
            yTicks.sort((a, b) => a - b);

            // Paths for both teams
            const pathDataA = timelinePoints
              .map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(p.hole - 1)} ${getY(p.valA)}`)
              .join(" ");

            const pathDataB = timelinePoints
              .map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(p.hole - 1)} ${getY(p.valB)}`)
              .join(" ");

            // Area fills down to plot bottom
            const areaA = `
              M ${getX(0)} ${getY(timelinePoints[0].valA)}
              ${timelinePoints.map((p) => `L ${getX(p.hole - 1)} ${getY(p.valA)}`).join(" ")}
              L ${getX(timelinePoints.length - 1)} ${plotBottom}
              L ${getX(0)} ${plotBottom}
              Z
            `;

            const areaB = `
              M ${getX(0)} ${getY(timelinePoints[0].valB)}
              ${timelinePoints.map((p) => `L ${getX(p.hole - 1)} ${getY(p.valB)}`).join(" ")}
              L ${getX(timelinePoints.length - 1)} ${plotBottom}
              L ${getX(0)} ${plotBottom}
              Z
            `;

            const formatScoreToPar = (val: number) =>
              val > 0 ? `+${val}` : val === 0 ? "E" : `${val}`;

            return (
              <>
                {/* Header with Mode Toggle & Rosters */}
                <div className="battle-chart-header">
                  <div className="battle-chart-title">
                    <Swords size={13} className="battle-swords-icon" /> Match Battle Progression · {battleMode === "net" ? "Net" : "Gross"} to Par
                  </div>

                  <div className="battle-controls">
                    {/* Net / Gross Switcher */}
                    <div className="battle-mode-toggle">
                      <button
                        type="button"
                        className={`battle-mode-btn ${battleMode === "net" ? "active" : ""}`}
                        onClick={() => setBattleMode("net")}
                      >
                        Net
                      </button>
                      <button
                        type="button"
                        className={`battle-mode-btn ${battleMode === "gross" ? "active" : ""}`}
                        onClick={() => setBattleMode("gross")}
                      >
                        Gross
                      </button>
                    </div>

                    {/* Team Badges with Avatars & Current Scores */}
                    <div className="battle-chart-legend">
                      <div className="battle-legend-pill team-a">
                        <span className="battle-legend-line team-a" />
                        {teamA.playerNames && teamA.playerNames[0] && (
                          <PlayerAvatar name={teamA.playerNames[0]} size={13} />
                        )}
                        {teamA.playerNames && teamA.playerNames[1] && (
                          <PlayerAvatar name={teamA.playerNames[1]} size={13} />
                        )}
                        <span>{teamA.name}</span>
                        <span className="font-bold">
                          ({formatScoreToPar(battleMode === "net" ? cumNetA : cumGrossA)})
                        </span>
                      </div>

                      <div className="battle-legend-pill team-b">
                        <span className="battle-legend-line team-b" />
                        {teamB.playerNames && teamB.playerNames[0] && (
                          <PlayerAvatar name={teamB.playerNames[0]} size={13} />
                        )}
                        {teamB.playerNames && teamB.playerNames[1] && (
                          <PlayerAvatar name={teamB.playerNames[1]} size={13} />
                        )}
                        <span>{teamB.name}</span>
                        <span className="font-bold">
                          ({formatScoreToPar(battleMode === "net" ? cumNetB : cumGrossB)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlapping Dual-Team Battle SVG Chart */}
                <div className="battle-svg-wrapper">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="battle-svg"
                    onMouseLeave={() => setHoveredHoleIndex(null)}
                  >
                    <defs>
                      <linearGradient id="battleGradA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--battle-line-a, #0b4d37)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--battle-line-a, #0b4d37)" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="battleGradB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--battle-line-b, #2563eb)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--battle-line-b, #2563eb)" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="battleShadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
                      </filter>
                    </defs>

                    {/* Active Hole Vertical Highlight Column */}
                    {activeHoleNumber <= 18 && (
                      <rect
                        x={getX(activeHoleNumber - 1) - 16}
                        y={paddingTop}
                        width={32}
                        height={plotBottom - paddingTop}
                        fill="var(--battle-active-col, #fef3c7)"
                        fillOpacity="0.4"
                        rx="4"
                      />
                    )}

                    {/* Vertical Subtle Guide Lines Per Hole */}
                    {Array.from({ length: 18 }, (_, i) => {
                      const x = getX(i);
                      return (
                        <line
                          key={`vguide-${i}`}
                          x1={x}
                          y1={paddingTop}
                          x2={x}
                          y2={plotBottom}
                          stroke="var(--battle-grid-subtle, #f1f5f9)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Hovered Hole Vertical Hairline */}
                    {hoveredHoleIndex !== null && (
                      <line
                        x1={getX(hoveredHoleIndex)}
                        y1={paddingTop}
                        x2={getX(hoveredHoleIndex)}
                        y2={plotBottom + 16}
                        stroke="var(--battle-hairline, #0f172a)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        strokeOpacity="0.6"
                      />
                    )}

                    {/* Y-Axis Horizontal Gridlines & Badges */}
                    {yTicks.map((val) => {
                      const y = getY(val);
                      const isEven = val === 0;
                      return (
                        <g key={`ytick-${val}`}>
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={paddingLeft + innerWidth}
                            y2={y}
                            stroke={isEven ? "var(--battle-grid-even, #94a3b8)" : "var(--battle-grid-subtle, #f1f5f9)"}
                            strokeWidth={isEven ? "1.2" : "0.7"}
                            strokeDasharray={isEven ? "4 3" : undefined}
                          />
                          <text
                            x={paddingLeft - 6}
                            y={y + 3}
                            textAnchor="end"
                            fontSize={isEven ? "8" : "7"}
                            fontWeight={isEven ? "700" : "500"}
                            fill={isEven ? "var(--battle-axis-even, #1e293b)" : val < 0 ? "var(--battle-axis-under, #065f46)" : "var(--battle-axis-over, #64748b)"}
                          >
                            {isEven ? "E (Par)" : val > 0 ? `+${val}` : `${val}`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Direction Indicators */}
                    <text
                      x={paddingLeft - 6}
                      y={paddingTop - 4}
                      textAnchor="end"
                      fontSize="6.5"
                      fontWeight="700"
                      fill="var(--battle-axis-under, #065f46)"
                    >
                      ▲ UNDER
                    </text>
                    <text
                      x={paddingLeft - 6}
                      y={plotBottom + 10}
                      textAnchor="end"
                      fontSize="6.5"
                      fontWeight="700"
                      fill="var(--battle-axis-over, #64748b)"
                    >
                      ▼ OVER
                    </text>

                    {/* Team B Area Fill & Trajectory (Blue) */}
                    <path d={areaB} fill="url(#battleGradB)" />
                    <path
                      d={pathDataB}
                      fill="none"
                      stroke="var(--battle-line-b, #2563eb)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Team A Area Fill & Trajectory (Masters Green) */}
                    <path d={areaA} fill="url(#battleGradA)" />
                    <path
                      d={pathDataA}
                      fill="none"
                      stroke="var(--battle-line-a, #0b4d37)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive Hole Nodes */}
                    {timelinePoints.map((p, idx) => {
                      const x = getX(idx);
                      const yA = getY(p.valA);
                      const yB = getY(p.valB);
                      const isTied = Math.abs(yA - yB) < 3.5;
                      const isHovered = hoveredHoleIndex === idx;
                      const isFinal = idx === timelinePoints.length - 1;

                      return (
                        <g
                          key={`node-${p.hole}`}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHoveredHoleIndex(idx)}
                        >
                          {/* Invisible hover capture bar covering node and axis column */}
                          <rect
                            x={x - innerWidth / 34}
                            y={paddingTop}
                            width={innerWidth / 17}
                            height={plotBottom + 20 - paddingTop}
                            fill="transparent"
                          />

                          {isTied ? (
                            /* Tied Node: Concentric Rings */
                            <g>
                              <circle
                                cx={x}
                                cy={yB}
                                r={isHovered ? 4.8 : 3.6}
                                fill="var(--battle-line-b, #2563eb)"
                                stroke="var(--battle-node-stroke, #ffffff)"
                                strokeWidth="1.2"
                              />
                              <circle
                                cx={x}
                                cy={yA}
                                r={isHovered ? 3 : 2}
                                fill="var(--battle-line-a, #0b4d37)"
                                stroke="var(--battle-node-stroke, #ffffff)"
                                strokeWidth="1"
                              />
                            </g>
                          ) : (
                            /* Independent Team Nodes */
                            <g>
                              <circle
                                cx={x}
                                cy={yB}
                                r={isHovered ? 4 : 2.5}
                                fill="var(--battle-line-b, #2563eb)"
                                stroke="var(--battle-node-stroke, #ffffff)"
                                strokeWidth="1.2"
                              />
                              <circle
                                cx={x}
                                cy={yA}
                                r={isHovered ? 4 : 2.5}
                                fill="var(--battle-line-a, #0b4d37)"
                                stroke="var(--battle-node-stroke, #ffffff)"
                                strokeWidth="1.2"
                              />
                            </g>
                          )}

                          {/* Final Hole Score Callout Badges */}
                          {isFinal && (
                            <g>
                              {/* Team A Final Score Badge */}
                              <rect
                                x={x + 5}
                                y={yA - 7}
                                width={20}
                                height={14}
                                rx="2"
                                fill="var(--battle-badge-a, #0b4d37)"
                              />
                              <text
                                x={x + 15}
                                y={yA + 2.5}
                                textAnchor="middle"
                                fontSize="7.5"
                                fontWeight="700"
                                fill="#ffffff"
                              >
                                {formatScoreToPar(p.valA)}
                              </text>

                              {/* Team B Final Score Badge */}
                              <rect
                                x={x + 5}
                                y={yB - 7}
                                width={20}
                                height={14}
                                rx="2"
                                fill="var(--battle-badge-b, #2563eb)"
                              />
                              <text
                                x={x + 15}
                                y={yB + 2.5}
                                textAnchor="middle"
                                fontSize="7.5"
                                fontWeight="700"
                                fill="#ffffff"
                              >
                                {formatScoreToPar(p.valB)}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* X-Axis Baseline directly below plotted area */}
                    <line
                      x1={paddingLeft}
                      y1={plotBottom}
                      x2={paddingLeft + innerWidth}
                      y2={plotBottom}
                      stroke="var(--battle-axis-line, #cbd5e1)"
                      strokeWidth="1"
                    />

                    {/* 18-Hole Indicators: H1..H18 Aligned Mathematically at getX(i) */}
                    {Array.from({ length: 18 }, (_, i) => {
                      const num = i + 1;
                      const x = getX(i);
                      const isActive = num === activeHoleNumber;
                      const isHovered = hoveredHoleIndex === i;

                      return (
                        <g
                          key={`axis-hole-${num}`}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHoveredHoleIndex(i)}
                          onMouseLeave={() => setHoveredHoleIndex(null)}
                        >
                          {/* Invisible hover bar across entire column */}
                          <rect
                            x={x - innerWidth / 34}
                            y={paddingTop}
                            width={innerWidth / 17}
                            height={plotBottom + 20 - paddingTop}
                            fill="transparent"
                          />

                          {/* Hole Axis Tick Mark */}
                          <line
                            x1={x}
                            y1={plotBottom}
                            x2={x}
                            y2={plotBottom + 3}
                            stroke={isActive ? "var(--battle-line-a, #0b4d37)" : "var(--battle-axis-line, #cbd5e1)"}
                            strokeWidth={isActive ? "1.5" : "0.8"}
                          />

                          {/* Hole Number: H1..H18 */}
                          <text
                            x={x}
                            y={plotBottom + 13}
                            textAnchor="middle"
                            fontSize="7.5"
                            fontWeight={isActive ? "800" : isHovered ? "700" : "500"}
                            fill={isActive ? "var(--battle-line-a, #0b4d37)" : isHovered ? "var(--battle-text-hover, #0f172a)" : "var(--battle-text-muted, #64748b)"}
                          >
                            H{num}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Column 4: Live Tournament Standings Table (1 of 4 columns) */}
      {(() => {
        const baseTournamentStandings = standings(mainTournament);
        const livePointsMap: Record<string, { pts: number; reasons: string[] }> = {
          brian: { pts: 0, reasons: [] },
          john: { pts: 0, reasons: [] },
          tony: { pts: 0, reasons: [] },
          derek: { pts: 0, reasons: [] },
        };

        // 1. Team that wins: each player gets 3 points. Draw: 1 pt each
        const tA = data.teams[0];
        const tB = data.teams[1];
        if (tA && tB && tA.scores.length > 0) {
          if (tA.netTotal < tB.netTotal) {
            livePointsMap.brian.pts += 3;
            livePointsMap.brian.reasons.push("Win (+3)");
            livePointsMap.john.pts += 3;
            livePointsMap.john.reasons.push("Win (+3)");
          } else if (tB.netTotal < tA.netTotal) {
            livePointsMap.tony.pts += 3;
            livePointsMap.tony.reasons.push("Win (+3)");
            livePointsMap.derek.pts += 3;
            livePointsMap.derek.reasons.push("Win (+3)");
          } else if (tA.netTotal === tB.netTotal) {
            ["brian", "john", "tony", "derek"].forEach((id) => {
              livePointsMap[id].pts += 1;
              livePointsMap[id].reasons.push("Draw (+1)");
            });
          }
        }

        // 2. Closest to the pin (solo): individual gets 1 point
        // 3. Closest to pin in 2 (team): each player on winning team gets 1 point
        if (data.pinContests) {
          data.pinContests.forEach((contest) => {
            if (contest.awardType === "solo") {
              const pName = (contest.leader.playerName || "").toLowerCase();
              const id = pName.includes("derek")
                ? "derek"
                : pName.includes("tony")
                ? "tony"
                : pName.includes("brian")
                ? "brian"
                : pName.includes("john")
                ? "john"
                : "";

              if (livePointsMap[id]) {
                livePointsMap[id].pts += 1;
                livePointsMap[id].reasons.push(`CTP H${contest.hole} (+1)`);
              }
            } else if (contest.awardType === "team") {
              contest.leader.playerNames.forEach((name) => {
                const pName = name.toLowerCase();
                const id = pName.includes("derek")
                  ? "derek"
                  : pName.includes("tony")
                  ? "tony"
                  : pName.includes("brian")
                  ? "brian"
                  : pName.includes("john")
                  ? "john"
                  : "";

                if (id && livePointsMap[id]) {
                  livePointsMap[id].pts += 1;
                  livePointsMap[id].reasons.push(`In 2 H${contest.hole} (+1)`);
                }
              });
            }
          });
        }

        const liveStandingsList = baseTournamentStandings
          .map((p) => {
            const liveInfo = livePointsMap[p.id] ?? { pts: 0, reasons: [] };
            const totalPoints = p.points + liveInfo.pts;
            return {
              ...p,
              basePoints: p.points,
              livePoints: liveInfo.pts,
              totalPoints,
              liveReasons: liveInfo.reasons,
            };
          })
          .sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.livePoints !== a.livePoints) return b.livePoints - a.livePoints;
            return a.handicap - b.handicap;
          });

        return (
          <div className="live-standings-card masters-leaderboard-card">
            {/* Masters Curved Arch Crest */}
            <div className="masters-arch-crest">
              <span className="masters-arch-title">Masters</span>
            </div>

            {/* Deep Masters Green Column Header Bar */}
            <div className="masters-header-bar">
              <div className="masters-header-left">
                <span>{data.isMatchFinished ? "FINAL STANDINGS" : "LIVE STANDINGS"}</span>
              </div>
              <div className="masters-header-right">
                <span className="masters-col-today">TODAY</span>
                <span className="masters-col-total">TOTAL</span>
              </div>
            </div>

            {/* Slat Leaderboard Rows */}
            <div className="masters-slats-list">
              {liveStandingsList.map((player, idx) => {
                const isLeader = idx === 0;
                return (
                  <div
                    key={player.id}
                    className={`masters-slat-row ${isLeader ? "leader" : ""}`}
                  >
                    {/* Rank Number in Masters Green */}
                    <div className="masters-col-rank">
                      {idx + 1}
                    </div>

                    {/* Player Info */}
                    <div className="masters-col-player">
                      <PlayerAvatar name={player.name} size={24} />
                      <div className="masters-player-text">
                        <span className="masters-player-name">{player.name.toUpperCase()}</span>
                        <span className="masters-player-sub">
                          {player.liveReasons.length > 0
                            ? player.liveReasons.join(" · ")
                            : `HCP ${player.handicap.toFixed(1)}`}
                        </span>
                      </div>
                    </div>

                    {/* Today / Match Gain */}
                    <div className="masters-col-gain">
                      {player.livePoints > 0 ? (
                        <span className="masters-pts-gain">+{player.livePoints}</span>
                      ) : (
                        <span className="masters-pts-even">E</span>
                      )}
                    </div>

                    {/* Iconic Masters Red Tile: Total Points */}
                    <div className="masters-col-total-badge">
                      <div className="masters-red-tile">
                        {player.totalPoints}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Masters Green Footer with Augusta Yellow Stripe */}
            <div className="masters-footer-bar">
              <div className="masters-footer-inner">
                <Flag size={10} style={{ color: "#ffd100" }} />
                <span>
                  {data.isMatchFinished
                    ? "Official Tournament Standings"
                    : "Live Points · Win: 3 pts · CTP: 1 pt · In 2: 1 pt"}
                </span>
              </div>
              <div className="masters-yellow-stripe" />
            </div>
          </div>
        );
      })()}
    </div>
  </div>
</>
)}
</section>
  );
}

