import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRoute, tournamentHref, tournamentTabs } from "./navigation";

test("every tournament tab has a unique canonical path and resolves on a direct visit", () => {
  const paths = tournamentTabs.map((tab) =>
    tournamentHref("autumn-series", tab),
  );
  assert.equal(new Set(paths).size, tournamentTabs.length);
  for (const tab of tournamentTabs) {
    const path = tournamentHref("autumn-series", tab);
    assert.deepEqual(resolveRoute(path.split("/").slice(1)), {
      kind: "tournament",
      tournamentId: "autumn-series",
      tab,
      canonical: path,
    });
  }
});
test("global navigation and overview aliases resolve to a single canonical URL", () => {
  assert.equal(resolveRoute()?.canonical, "/");
  assert.equal(resolveRoute(["tournaments"])?.canonical, "/");
  assert.equal(resolveRoute(["players"])?.tab, "Players");
  assert.equal(resolveRoute(["courses"])?.tab, "Courses");
  assert.equal(
    resolveRoute(["tournaments", "autumn-series", "overview"])?.canonical,
    "/tournaments/autumn-series",
  );
});
test("invalid paths are rejected and tournament IDs are escaped", () => {
  for (const parts of [
    ["other"],
    ["players", "extra"],
    ["tournaments", "id", "bad"],
    ["tournaments", "id", "players", "extra"],
  ])
    assert.equal(resolveRoute(parts), null);
  assert.equal(
    tournamentHref("id/with?chars", "Schedule"),
    "/tournaments/id%2Fwith%3Fchars/schedule",
  );
});
