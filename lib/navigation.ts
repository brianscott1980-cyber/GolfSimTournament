export const tournamentTabs = [
  "Overview",
  "Schedule",
  "Leaderboard",
  "Players",
  "Courses",
] as const;
export type TournamentTab = (typeof tournamentTabs)[number];
export type ClubhouseRoute = {
  kind: "dashboard" | "players" | "courses" | "tournament";
  tournamentId: string | null;
  tab: TournamentTab;
  canonical: string;
};
export function tournamentHref(id: string, tab: TournamentTab = "Overview") {
  return `/tournaments/${encodeURIComponent(id)}${tab === "Overview" ? "" : `/${tab.toLowerCase()}`}`;
}
export function resolveRoute(parts: string[] = []): ClubhouseRoute | null {
  if (!parts.length || (parts.length === 1 && parts[0] === "tournaments"))
    return {
      kind: "dashboard",
      tournamentId: null,
      tab: "Overview",
      canonical: "/",
    };
  if (parts.length === 1 && (parts[0] === "players" || parts[0] === "courses"))
    return {
      kind: parts[0],
      tournamentId: null,
      tab: parts[0] === "players" ? "Players" : "Courses",
      canonical: `/${parts[0]}`,
    };
  if (parts[0] !== "tournaments" || !parts[1] || parts.length > 3) return null;
  const tab =
    parts[2] === undefined
      ? "Overview"
      : tournamentTabs.find((tab) => tab.toLowerCase() === parts[2]);
  if (!tab) return null;
  return {
    kind: "tournament",
    tournamentId: parts[1],
    tab,
    canonical: tournamentHref(parts[1], tab),
  };
}
