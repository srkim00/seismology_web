// Verify every publication's DOI + official publisher source URL resolve.
//  - DOI: doi.org handle API (responseCode 1 = registered/valid) — registrar-agnostic, bot-safe.
//  - sourceUrl: HEAD (follow redirects); 403/429 treated as bot-block (not broken).
//  - EESK's legacy TLS endpoint is listed for manual verification when Node fetch cannot negotiate it.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/content/publications");
const v = (t, k) => {
  const m = t.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, "m"));
  return m ? m[1] : "";
};
const pubs = readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const t = readFileSync(join(DIR, f), "utf8");
    return {
      slug: f.replace(/\.md$/, ""),
      doi: v(t, "doi"),
      sourceUrl: v(t, "sourceUrl"),
      scholar: v(t, "scholarUrl"),
      status: v(t, "status"),
    };
  });

async function withTimeout(fn, ms = 15000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  try {
    return await fn(c.signal);
  } finally {
    clearTimeout(id);
  }
}
async function checkDoi(doi) {
  if (!doi) return null;
  try {
    return await withTimeout(async (signal) => {
      const r = await fetch("https://doi.org/api/handles/" + encodeURIComponent(doi), { signal });
      const j = await r.json();
      return j.responseCode === 1 ? "ok" : `NOT-REGISTERED(${j.responseCode})`;
    });
  } catch (e) {
    return "ERR " + (e.name || e.message);
  }
}
async function checkUrl(url) {
  if (!url) return null;
  try {
    return await withTimeout(async (signal) => {
      let r = await fetch(url, { method: "HEAD", redirect: "follow", signal });
      if (r.status === 405) {
        r = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal,
          headers: { Range: "bytes=0-0" },
        });
      }
      return r.status;
    });
  } catch (e) {
    return "ERR " + (e.name || e.message);
  }
}

const queue = [...pubs];
const results = [];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const p = queue.shift();
      const [doiStatus, sourceStatus] = await Promise.all([checkDoi(p.doi), checkUrl(p.sourceUrl)]);
      results.push({ ...p, doiStatus, sourceStatus });
    }
  }),
);
results.sort((a, b) => a.slug.localeCompare(b.slug));

const issues = [];
const blocked = [];
const manualTlsHosts = new Set(["www.eesk-j.or.kr"]);
for (const r of results) {
  const probs = [];
  if (r.doi && r.doiStatus !== "ok") probs.push("DOI " + r.doiStatus);
  if (r.sourceUrl && typeof r.sourceStatus === "number" && r.sourceStatus >= 400) {
    if ([403, 429, 999].includes(r.sourceStatus)) blocked.push(`${r.slug} sourceUrl ${r.sourceStatus}`);
    else probs.push("sourceUrl " + r.sourceStatus);
  }
  if (r.sourceUrl && typeof r.sourceStatus === "string") {
    const host = new URL(r.sourceUrl).hostname;
    if (manualTlsHosts.has(host)) blocked.push(`${r.slug} sourceUrl ${r.sourceStatus} (manual TLS check)`);
    else probs.push("sourceUrl " + r.sourceStatus);
  }
  if (!r.doi && !r.sourceUrl && r.status !== "in-preparation") probs.push("NO LINK");
  if (probs.length) issues.push(`✗ ${r.slug.padEnd(42)} ${probs.join(" | ")}`);
}

console.log(`Checked ${results.length} publications (${results.filter((r) => r.doi).length} with DOI, ${results.filter((r) => r.sourceUrl).length} with sourceUrl).\n`);
console.log(issues.length ? "ISSUES:\n" + issues.join("\n") : "✓ All DOIs registered and all sourceUrl fields resolve.");
if (blocked.length) console.log("\nPublisher bot/TLS restrictions — verify manually:\n  " + blocked.join("\n  "));
if (issues.length) process.exitCode = 1;
