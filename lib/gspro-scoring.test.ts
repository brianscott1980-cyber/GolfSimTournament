import test from "node:test";
import assert from "node:assert/strict";
import { calculateGSProHandicaps, getStrokesOnHole } from "./gspro-scoring";

const teams = [
  { id: "team-a", name: "Team A", playerIds: ["brian", "john"], playerHandicaps: [25.1, 10.3] },
  { id: "team-b", name: "Team B", playerIds: ["derek", "tony"], playerHandicaps: [9.0, 2.6] },
] as const;

test("scramble handicap applies 35/15 and plays off the lowest team", () => {
  const result = calculateGSProHandicaps("Scramble stroke play", teams as any);
  assert.equal(result.layout, "team");
  if (result.layout === "team") {
    assert.equal(result.teams[0].rawHandicap, 7);
    assert.equal(result.teams[0].playingHandicap, 5);
    assert.equal(result.teams[0].badge, "+5 SHOTS");
    assert.equal(result.teams[1].rawHandicap, 2);
    assert.equal(result.teams[1].playingHandicap, 0);
    assert.equal(result.teams[1].badge, "SCRATCH");
  }
});

test("fourball match play takes 90% of difference off lowest player", () => {
  const result = calculateGSProHandicaps("Fourball match play", teams as any);
  assert.equal(result.layout, "individual");
  if (result.layout === "individual") {
    // Tony is 2.6 (lowest) -> 0 strokes (scratch)
    const tony = result.players.find((p) => p.id === "tony");
    assert.equal(tony?.playingHandicap, 0);
    assert.equal(tony?.badge, "SCRATCH");

    // Derek: 9.0 - 2.6 = 6.4 * 0.9 = 5.76 -> 6
    const derek = result.players.find((p) => p.id === "derek");
    assert.equal(derek?.playingHandicap, 6);

    // John: 10.3 - 2.6 = 7.7 * 0.9 = 6.93 -> 7
    const john = result.players.find((p) => p.id === "john");
    assert.equal(john?.playingHandicap, 7);

    // Brian: 25.1 - 2.6 = 22.5 * 0.9 = 20.25 -> 20
    const brian = result.players.find((p) => p.id === "brian");
    assert.equal(brian?.playingHandicap, 20);
  }
});

test("foursomes match play takes 50% combined and plays off low team", () => {
  const result = calculateGSProHandicaps("Foursomes match play", teams as any);
  assert.equal(result.layout, "team");
  if (result.layout === "team") {
    assert.equal(result.teams[1].badge, "SCRATCH");
    assert.equal(result.teams[0].badge, "+12 SHOTS");
  }
});

test("strokes allocated on stroke index correctly", () => {
  assert.equal(getStrokesOnHole(5, 1), 1);
  assert.equal(getStrokesOnHole(5, 5), 1);
  assert.equal(getStrokesOnHole(5, 6), 0);
  assert.equal(getStrokesOnHole(20, 1), 2);
  assert.equal(getStrokesOnHole(20, 2), 2);
  assert.equal(getStrokesOnHole(20, 3), 1);
});

