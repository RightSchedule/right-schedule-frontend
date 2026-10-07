import { appendFileSync, readFileSync } from "node:fs";

const summary = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf8"));
const root = process.cwd().replaceAll("\\", "/") + "/";
const pct = (m) => `${m.pct}% (${m.covered}/${m.total})`;
const icon = (p) => (p >= 80 ? "🟢" : p >= 50 ? "🟡" : "🔴");

const rows = Object.entries(summary)
  .filter(([key]) => key !== "total")
  .map(([key, m]) => [key.replaceAll("\\", "/").replace(root, ""), m])
  .sort((a, b) => a[1].lines.pct - b[1].lines.pct);

const { total } = summary;
const lines = [
  "## Unit test coverage",
  "",
  "| Metric | Coverage |",
  "| --- | --- |",
  `| Statements | ${icon(total.statements.pct)} ${pct(total.statements)} |`,
  `| Branches | ${icon(total.branches.pct)} ${pct(total.branches)} |`,
  `| Functions | ${icon(total.functions.pct)} ${pct(total.functions)} |`,
  `| Lines | ${icon(total.lines.pct)} ${pct(total.lines)} |`,
  "",
  "<details><summary>Per file (lowest line coverage first)</summary>",
  "",
  "| File | Lines | Branches | Functions |",
  "| --- | --- | --- | --- |",
  ...rows.map(
    ([file, m]) => `| \`${file}\` | ${m.lines.pct}% | ${m.branches.pct}% | ${m.functions.pct}% |`
  ),
  "",
  "</details>",
  "",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines);
else console.log(lines);
