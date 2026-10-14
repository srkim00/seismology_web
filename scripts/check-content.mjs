import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const markdownFiles = (directory) =>
  readdirSync(join(root, directory)).filter((name) => name.endsWith(".md"));
const rawValue = (text, key, indent = "") => {
  const match = text.match(new RegExp(`^${indent}${key}:\\s*(.+)\\s*$`, "m"));
  return match ? match[1].trim() : "";
};
const scalar = (text, key, indent = "") => {
  const raw = rawValue(text, key, indent);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return raw.replace(/^["']|["']$/g, "");
  }
};
const jsonValue = (text, key) => {
  const raw = rawValue(text, key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${key} must be valid one-line JSON-compatible YAML: ${error.message}`);
  }
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const normalizeAuthor = (value) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

function validIsoCalendarDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function validOrcidChecksum(url) {
  const id = url.split("/").at(-1);
  const compact = id.replaceAll("-", "");
  if (!/^\d{15}[\dX]$/.test(compact)) return false;
  let total = 0;
  for (const digit of compact.slice(0, 15)) total = (total + Number(digit)) * 2;
  const result = (12 - (total % 11)) % 11;
  const check = result === 10 ? "X" : String(result);
  return check === compact.at(-1);
}

function validImageSignature(path) {
  const bytes = readFileSync(path).subarray(0, 12);
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  return png || jpeg || webp;
}

const publicationFiles = markdownFiles("src/content/publications");
const publications = publicationFiles.map((name) => ({
  name,
  text: read(`src/content/publications/${name}`),
}));
const published = publications.filter(({ text }) => scalar(text, "status") === "published");
const inPreparation = publications.filter(({ text }) => scalar(text, "status") === "in-preparation");
const dois = published.map(({ text }) => scalar(text, "doi"));
const localImages = new Set();
const localFigureLicenses = new Map([
  ["CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"],
  ["CC BY-NC-ND 4.0", "https://creativecommons.org/licenses/by-nc-nd/4.0/"],
]);
const authorProvidedFigureRights = "Author-provided image; reuse not permitted";
let authorProvidedLocalFigures = 0;

assert(publicationFiles.length > 0, "No publication records were found");
assert(new Set(dois.map((doi) => doi.toLowerCase())).size === dois.length, "Publication DOI values are not unique");

for (const { name, text } of published) {
  const doi = scalar(text, "doi");
  const publicationDate = scalar(text, "publicationDate");
  const sourceUrl = scalar(text, "sourceUrl");
  const authors = jsonValue(text, "authors");
  const citationAuthors = jsonValue(text, "citationAuthors");
  const volume = scalar(text, "volume");
  const issue = scalar(text, "issue");
  const locator = scalar(text, "locator");
  const onlineFirst = scalar(text, "onlineFirst");
  const piCorresponding = scalar(text, "piCorresponding");
  const piCorrespondingSource = scalar(text, "piCorrespondingSource");
  const status = scalar(text, "summaryStatus");
  const mainFindings = jsonValue(text, "mainFindings");
  const publicBrief = typeof mainFindings === "string"
    ? (mainFindings.trim().match(/^.*?[.!?](?=\s+[A-Z]|$)/)?.[0] ?? mainFindings.trim())
    : "";
  const sources = jsonValue(text, "summarySources");
  assert(/^10\.\d{4,9}\/\S+$/i.test(doi), `${name}: invalid or missing DOI`);
  assert(validIsoCalendarDate(publicationDate), `${name}: publicationDate must be a valid YYYY-MM-DD calendar date`);
  assert(name === `${doi.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.md`, `${name}: filename does not match DOI`);
  assert(sourceUrl.startsWith("https://"), `${name}: sourceUrl must use HTTPS`);
  assert(Array.isArray(authors) && authors.length > 0, `${name}: authors must be a non-empty array`);
  assert(Array.isArray(citationAuthors), `${name}: citationAuthors must be an array`);
  assert(citationAuthors.length === authors.length, `${name}: citationAuthors count must match authors count`);
  for (const [index, author] of citationAuthors.entries()) {
    assert(author && typeof author === "object" && !Array.isArray(author), `${name}: citationAuthors[${index}] must be an object`);
    assert(typeof author.given === "string" && author.given.trim(), `${name}: citationAuthors[${index}].given is missing`);
    assert(typeof author.family === "string" && author.family.trim(), `${name}: citationAuthors[${index}].family is missing`);
    if (author.orcid !== undefined) {
      assert(
        typeof author.orcid === "string" && /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(author.orcid),
        `${name}: citationAuthors[${index}].orcid must be a canonical ORCID URL`,
      );
      assert(validOrcidChecksum(author.orcid), `${name}: citationAuthors[${index}].orcid checksum failed`);
    }
  }
  assert(["", "true", "false"].includes(onlineFirst), `${name}: invalid onlineFirst value`);
  if (onlineFirst === "true") {
    assert(!volume && !issue && !locator, `${name}: online-first record must omit unassigned issue metadata`);
  } else {
    assert(volume.length > 0, `${name}: volume is required for an issued reference`);
    assert(locator.length > 0, `${name}: locator is required for an issued reference`);
    if (/^issue:/m.test(text)) assert(issue.length > 0, `${name}: issue must not be empty when present`);
  }
  assert(["", "true", "false"].includes(piCorresponding), `${name}: invalid piCorresponding value`);
  if (piCorresponding === "true") {
    assert(Array.isArray(authors) && authors.some((author) => normalizeAuthor(author) === "seongryong kim"), `${name}: PI corresponding flag requires Seongryong Kim in the author list`);
    assert(piCorrespondingSource.startsWith("https://"), `${name}: PI corresponding flag requires an explicit source URL`);
  } else {
    assert(!piCorrespondingSource, `${name}: PI corresponding source is present without a true flag`);
  }
  assert(["source-checked", "approved"].includes(status), `${name}: summary is not source checked`);
  assert(typeof jsonValue(text, "summaryEn") === "string", `${name}: English summary is missing`);
  assert(typeof jsonValue(text, "summaryKo") === "string", `${name}: Korean summary is missing`);
  assert(typeof mainFindings === "string" && mainFindings.trim(), `${name}: mainFindings is missing`);
  assert(mainFindings.length <= 220, `${name}: mainFindings exceeds 220 characters`);
  assert(publicBrief.split(/\s+/).filter(Boolean).length <= 30, `${name}: public brief exceeds 30 words`);
  assert(Array.isArray(sources) && sources.length > 0, `${name}: summarySources is empty`);
  assert(Boolean(scalar(text, "sourceCheckedAt")), `${name}: sourceCheckedAt is missing`);
  assert(/^figure:/m.test(text), `${name}: figure record is missing`);

  const reuse = scalar(text, "reuse", "  ");
  const image = scalar(text, "image", "  ");
  const license = scalar(text, "license", "  ");
  const figureSource = scalar(text, "sourceUrl", "  ");
  assert(figureSource.startsWith("https://"), `${name}: figure sourceUrl must use HTTPS`);
  assert(Boolean(scalar(text, "caption", "  ")), `${name}: figure caption is missing`);
  assert(Boolean(scalar(text, "attribution", "  ")), `${name}: figure attribution is missing`);
  if (reuse === "local") {
    const licenseUrl = scalar(text, "licenseUrl", "  ");
    const alt = scalar(text, "alt", "  ");
    const rightsBasis = scalar(text, "rightsBasis", "  ") || "open-license";
    if (rightsBasis === "author-provided") {
      assert(license === authorProvidedFigureRights, `${name}: author-provided figure rights statement does not match`);
      assert(!licenseUrl, `${name}: author-provided figure must not imply an external reuse license`);
      authorProvidedLocalFigures += 1;
    } else {
      assert(rightsBasis === "open-license", `${name}: invalid local-figure rights basis`);
      assert(localFigureLicenses.has(license), `${name}: open-license local figure must use an allowed Creative Commons license`);
      assert(licenseUrl === localFigureLicenses.get(license), `${name}: license name and URL do not match`);
    }
    assert(Boolean(alt), `${name}: local figure alt text is missing`);
    assert(image.startsWith("/publication-figures/"), `${name}: local figure path is outside publication-figures`);
    const imagePath = normalize(join(root, "public", image.slice(1)));
    assert(imagePath.startsWith(join(root, "public", "publication-figures")), `${name}: unsafe local figure path`);
    assert(existsSync(imagePath), `${name}: local figure file does not exist: ${image}`);
    assert(validImageSignature(imagePath), `${name}: local figure is not PNG, JPEG, or WebP: ${image}`);
    localImages.add(image.slice(1));
  } else {
    assert(reuse === "linked-only", `${name}: invalid figure reuse policy`);
    assert(!image, `${name}: linked-only figure must not include a local image`);
  }
}

for (const { name, text } of inPreparation) {
  assert(!scalar(text, "publicationDate"), `${name}: in-preparation record must not have a publicationDate`);
  assert(!scalar(text, "doi"), `${name}: in-preparation record must not have a DOI`);
  assert(!/^citationAuthors:/m.test(text), `${name}: in-preparation record must not have citationAuthors`);
  assert(!/^volume:/m.test(text), `${name}: in-preparation record must not have a volume`);
  assert(!/^issue:/m.test(text), `${name}: in-preparation record must not have an issue`);
  assert(!/^locator:/m.test(text), `${name}: in-preparation record must not have a locator`);
  assert(!scalar(text, "summaryStatus"), `${name}: in-preparation summary must not be inferred`);
  assert(!/^mainFindings:/m.test(text), `${name}: in-preparation mainFindings must not be inferred`);
  assert(!/^figure:/m.test(text), `${name}: in-preparation figure must not be inferred`);
}

const figureDirectory = join(root, "public", "publication-figures");
const figureFiles = existsSync(figureDirectory) ? readdirSync(figureDirectory) : [];
assert(figureFiles.length === localImages.size, "Publication figure directory contains an unreferenced or missing file");
for (const file of figureFiles) assert(localImages.has(`publication-figures/${file}`), `Unreferenced publication figure: ${file}`);

const peopleFiles = markdownFiles("src/content/people");
const people = peopleFiles.map((name) => ({ name, text: read(`src/content/people/${name}`) }));
const current = people.filter(({ text }) => scalar(text, "status") === "current");
const formerMembers = people.filter(({ text }) => scalar(text, "status") === "alumni");
const alumni = people.filter(({ text }) => scalar(text, "group") === "Alumni");
const formerResearchers = people.filter(({ text }) => scalar(text, "group") === "Former Researchers");
const headshots = people.filter(({ text }) => /^headshot:/m.test(text));
const aliases = new Map();
const approvedInstitutionalProfiles = new Map([
  ["seongryong-kim.md", "https://pure.korea.ac.kr/en/persons/seongryong-kim/"],
  ["sang-jun-lee.md", "https://www.knue.ac.kr/www/selectProfInfoWebView.do?code=UNIV25&key=507&userNo=110054"],
  ["lav-joshi.md", "https://is.cuni.cz/webapps/whois2/osoba/1234145145449483/?lang=en"],
]);
let institutionalProfileCount = 0;

assert(peopleFiles.length > 0, "No people records were found");
assert(current.length > 0, "No current people records were found");
assert(alumni.length === 5, `Expected 5 alumni, found ${alumni.length}`);
assert(formerResearchers.length === 4, `Expected 4 former researchers, found ${formerResearchers.length}`);
assert(!people.some(({ text }) => scalar(text, "role") === "Former Intern"), "Former undergraduate interns must not be public profiles");
for (const { name, text } of formerMembers) {
  assert(Boolean(scalar(text, "currentAffiliation")), `${name}: former-member currentAffiliation is missing`);
}

for (const { name, text } of people) {
  const publicationNames = jsonValue(text, "publicationNames");
  const identifierStatus = scalar(text, "identifierStatus");
  const institutionalProfile = scalar(text, "institutional", "  ");
  assert(Array.isArray(publicationNames), `${name}: publicationNames must be explicit`);
  assert(["verified", "not-found", "ambiguous", "unreviewed"].includes(identifierStatus), `${name}: invalid identifierStatus`);
  assert(identifierStatus !== "unreviewed", `${name}: identity audit is incomplete`);
  if (identifierStatus === "verified") assert(/^identitySources:\n\s+-/m.test(text), `${name}: verified identity has no source`);
  if (institutionalProfile) {
    institutionalProfileCount += 1;
    assert(
      institutionalProfile === approvedInstitutionalProfiles.get(name),
      `${name}: institutional must be a reviewed person-level institutional profile`,
    );
  }
  for (const alias of publicationNames) {
    assert(typeof alias === "string" && alias.trim(), `${name}: empty publication alias`);
    const key = normalizeAuthor(alias);
    assert(!aliases.has(key), `${name}: publication alias duplicates ${aliases.get(key)} (${alias})`);
    aliases.set(key, name);
  }
  const orcid = scalar(text, "orcid", "  ");
  if (orcid) {
    assert(/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid), `${name}: noncanonical ORCID URL`);
    assert(validOrcidChecksum(orcid), `${name}: ORCID checksum failed`);
  }
}
assert(
  institutionalProfileCount === approvedInstitutionalProfiles.size,
  `Expected ${approvedInstitutionalProfiles.size} reviewed institutional profiles, found ${institutionalProfileCount}`,
);

const kigamLee = people.find(({ name }) => name === "dong-hun-lee.md");
const mathLee = people.find(({ name }) => name === "donghun-lee-mathematics.md");
assert(Boolean(kigamLee), "KIGAM Dong Hun Lee profile is missing");
assert(!mathLee, "A non-lab mathematics faculty profile must not be present");
assert(JSON.stringify(jsonValue(kigamLee.text, "publicationNames")) === "[]", "KIGAM Dong Hun Lee must remain disconnected from name-only matching");
assert(scalar(kigamLee.text, "orcid", "  ") === "", "KIGAM Dong Hun Lee must not inherit the mathematics ORCID");
assert(!aliases.has(normalizeAuthor("Donghun Lee")), "Non-lab Donghun Lee must not resolve to a lab profile");

for (const { name, text } of publications) {
  const authors = jsonValue(text, "authors") ?? [];
  for (const author of authors) {
    const matches = aliases.has(normalizeAuthor(author)) ? 1 : 0;
    assert(matches <= 1, `${name}: author resolves to multiple profiles (${author})`);
  }
}

assert(existsSync(join(root, "public/tools/gravity-forward/index.html")), "Gravity tool is missing");
for (const route of ["photos", "figures", "lab-life"]) {
  assert(!existsSync(join(root, `src/pages/${route}.astro`)), `Hidden or excluded route is present: ${route}`);
  if (existsSync(join(root, "dist"))) {
    assert(!existsSync(join(root, `dist/${route}`)), `Excluded route was built: ${route}`);
  }
}
assert(!existsSync(join(root, "src/pages/cv.astro")), "A hidden CV page must not be restored");
if (existsSync(join(root, "dist"))) {
  assert(!existsSync(join(root, "dist/cv/index.html")), "A hidden CV page was built");
}
const cvPath = join(root, "public/cv/Seongryong-Kim-CV.pdf");
assert(existsSync(cvPath), "Public CV PDF is missing");
assert(readFileSync(cvPath).subarray(0, 5).toString() === "%PDF-", "Public CV asset is not a PDF");
const piProfile = people.find(({ name }) => name === "seongryong-kim.md");
assert(scalar(piProfile?.text ?? "", "cv", "  ") === "/cv/Seongryong-Kim-CV.pdf", "PI profile CV link is missing or invalid");

console.log(
  `Content checks passed: ${publicationFiles.length} publications (${published.length} published, ${dois.length} DOI, ` +
    `${localImages.size} local figures: ${localImages.size - authorProvidedLocalFigures} open-license, ` +
    `${authorProvidedLocalFigures} author-provided), ${inPreparation.length} in preparation; ` +
    `${peopleFiles.length} people (${current.length} current, ${alumni.length} alumni, ` +
    `${formerResearchers.length} former researchers, ${aliases.size} reviewed author aliases), ` +
    `${headshots.length} headshots; excluded routes absent.`,
);
