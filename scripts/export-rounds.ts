import fs from "fs";
import path from "path";
import { getGSProHistoricalRoundsList, getGSProHistoricalRoundState } from "../lib/gspro-db";

const outDir = path.join(process.cwd(), "data", "gspro-rounds");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const list = getGSProHistoricalRoundsList(10);
const top5 = list.slice(0, 5);

fs.writeFileSync(
  path.join(outDir, "rounds-index.json"),
  JSON.stringify(top5, null, 2),
  "utf8"
);
console.log(`Saved rounds-index.json with ${top5.length} rounds.`);

for (const r of top5) {
  const state = getGSProHistoricalRoundState(r.id);
  if (state) {
    fs.writeFileSync(
      path.join(outDir, `round-${r.id}.json`),
      JSON.stringify(state, null, 2),
      "utf8"
    );
    console.log(`Saved round-${r.id}.json (${r.courseName})`);
  }
}

console.log("Done exporting rounds!");
