import { test } from "node:test";
import assert from "node:assert/strict";
import {
  drawTeams,
  drawTournamentTeams,
  standings,
  demo,
  applyInitialTournamentSetup,
  validateScores,
  createTournament,
} from "./golf";
test("draw gives all three unique partnerships exactly once", () => {
  for (let i = 0; i < 100; i++) {
    const rounds = drawTeams(["a", "b", "c", "d"]);
    assert.equal(rounds.length, 3);
    const pairs = new Set(
      rounds.flatMap((r) => r.map((team) => team.slice().sort().join(""))),
    );
    assert.equal(pairs.size, 6);
    for (const round of rounds)
      assert.deepEqual(round.flat().sort(), ["a", "b", "c", "d"]);
  }
});
test("win awards 3 each, draw 1 each, pins award no points; edits recalculate", () => {
  const t = structuredClone(demo);
  t.rounds[0].result = "A";
  t.rounds[1].result = "draw";
  const rows = standings(t);
  assert.equal(rows.find((p) => p.id === "brian")?.points, 4);
  assert.equal(rows.find((p) => p.id === "derek")?.points, 1);
  t.rounds[0].result = "B";
  assert.equal(standings(t).find((p) => p.id === "brian")?.points, 1);
  assert.equal(standings(t).find((p) => p.id === "derek")?.points, 4);
});
test("score imports reject invalid, duplicate and unknown player rows", () => {
  const valid = {
    player: "Brian Scott",
    hole: "1",
    strokes: "4",
    putts: "2",
    fairway: "true",
    gir: "false",
  };
  assert.equal(validateScores([valid], demo.players)[0].strokes, 4);
  for (const bad of [
    { ...valid, hole: "19" },
    { ...valid, strokes: "0" },
    { ...valid, player: "Unknown" },
    { ...valid, putts: "5" },
    { ...valid, gir: "maybe" },
  ])
    assert.throws(() => validateScores([bad], demo.players));
  assert.throws(() => validateScores([valid, valid], demo.players));
});
test("new tournaments have 3 rounds, 2 pins each and no results", () => {
  const t = createTournament("Test", demo.players, "2026-11-01");
  assert.equal(t.rounds.length, 3);
  assert.equal(t.rounds[2].date, "2026-11-15");
  assert.ok(t.rounds.every((r) => r.pins.length === 2 && !r.result));
  assert.ok(standings(t).every((p) => p.points === 0));
});

test("tonight's tournament replaces only placeholder setup, preserving subsequent edits", () => {
  const legacy = structuredClone(demo);
  legacy.rounds[0] = {
    ...legacy.rounds[0],
    courseId: "bandon",
    date: "2026-10-15",
    result: "A",
    pins: [
      { hole: 6, playerId: "john", distance: 5.2 },
      { hole: 15, playerId: "derek", distance: 8.4 },
    ],
  };
  legacy.rounds[1].date = "2026-10-22";
  legacy.rounds[2].date = "2026-10-29";
  const updated = applyInitialTournamentSetup([legacy])[0];
  assert.equal(updated.rounds[0].courseId, "currahee");
  assert.equal(updated.rounds[0].date, "2026-10-21");
  assert.ok(standings(updated).every((p) => p.points === 0));
  assert.equal(updated.rounds[1].date, "2026-10-28");
  updated.rounds[0].result = "B";
  assert.deepEqual(applyInitialTournamentSetup([updated])[0], updated);
});

test("initial score reset clears saved results once and preserves future play", () => {
  const saved = structuredClone(demo);
  delete saved.scoreResetVersion;
  for (const round of saved.rounds) {
    round.result = "A";
    round.scores = [{ playerId: "brian", hole: 1, strokes: 4 }];
    round.pins[0] = {
      hole: round.pins[0].hole,
      playerId: "brian",
      distance: 2,
    };
  }
  const reset = applyInitialTournamentSetup([saved])[0];
  assert.ok(
    standings(reset).every(
      (player) =>
        player.points === 0 && player.played === 0 && player.pins === 0,
    ),
  );
  assert.ok(
    reset.rounds.every((round) => !round.result && round.scores.length === 0),
  );
  assert.deepEqual(
    reset.rounds.map((r) => r.teams),
    saved.rounds.map((r) => r.teams),
  );
  reset.rounds[0].result = "B";
  assert.deepEqual(applyInitialTournamentSetup([reset])[0], reset);
  const other = { ...saved, id: "other-tournament" };
  assert.deepEqual(applyInitialTournamentSetup([other])[0], other);
});

test("fixed Trump partnership survives random redraws with all partnerships covered", () => {
  for (let i = 0; i < 100; i++) {
    const teams = drawTournamentTeams(demo);
    assert.ok(
      teams[1].some((team) => team.includes("brian") && team.includes("tony")),
    );
    assert.equal(
      new Set(
        teams.flatMap((match) =>
          match.map((team) => team.slice().sort().join(":")),
        ),
      ).size,
      6,
    );
  }
  const previous = structuredClone(demo);
  delete previous.fixedPairing;
  const configured = applyInitialTournamentSetup([previous])[0];
  assert.ok(
    configured.rounds[1].teams.some(
      (team) => team.includes("brian") && team.includes("tony"),
    ),
  );
  assert.deepEqual(applyInitialTournamentSetup([configured])[0], configured);
});
