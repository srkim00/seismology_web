import { getCollection, type CollectionEntry } from "astro:content";

export type Person = CollectionEntry<"people">;
export type Publication = CollectionEntry<"publications">;

// Tag vocabulary (must match the `areas` enum in content.config.ts). A paper
// may carry several research-area tags.
export type AreaSlug =
  | "geodynamics-structure"
  | "seismological-methods"
  | "earthquake-properties"
  | "earthquake-engineering"
  | "environmental-seismology";

export const AREA_LABELS: Record<AreaSlug, string> = {
  "geodynamics-structure": "Geodynamics and Earth structure",
  "seismological-methods": "Seismological methods",
  "earthquake-properties": "Earthquake properties",
  "earthquake-engineering": "Earthquake engineering",
  "environmental-seismology": "Environmental seismology",
};

// Research-page sections and public descriptions.
export const RESEARCH_GROUPS: { title: string; areas: { slug: AreaSlug; blurb: string }[] }[] = [
  {
    title: "Research areas",
    areas: [
      { slug: "geodynamics-structure", blurb: "Tectonic and geodynamic processes at back-arc and continental margins, intraplate magmatism, and lithosphere, asthenosphere, and mantle-transition-zone structure in Northeast Asia." },
      { slug: "seismological-methods", blurb: "Bayesian inversion, machine-learning methods, and seismic interferometry using diffuse wavefields." },
      { slug: "earthquake-properties", blurb: "Large-volume event detection, source-property estimation, and source-mechanism analysis with quantitative uncertainty." },
      { slug: "earthquake-engineering", blurb: "Ground-motion prediction, seismic hazard, three-dimensional high-frequency simulations, and surface and subsurface structural response in the Korean Peninsula." },
      { slug: "environmental-seismology", blurb: "Seismic responses associated with groundwater and other physical-property changes." },
    ],
  },
];

// Publications filter chips, grouped (slugs reference AREA_LABELS).
export const FILTER_GROUPS: { title: string; slugs: AreaSlug[] }[] = [
  {
    title: "Research area",
    slugs: [
      "geodynamics-structure",
      "seismological-methods",
      "earthquake-properties",
      "earthquake-engineering",
      "environmental-seismology",
    ],
  },
];

/** Research-page groups → each area with its most-recent pubs (capped) + total count. */
export async function getResearchGroups(limit = 4) {
  const pubs = (await getPublications()).filter((publication) => publication.data.status === "published");
  return RESEARCH_GROUPS.map((g) => ({
    title: g.title,
    areas: g.areas.map((a) => {
        const all = pubs.filter((p) => p.data.areas.includes(a.slug));
        return { slug: a.slug, label: AREA_LABELS[a.slug], blurb: a.blurb, pubs: all.slice(0, limit), total: all.length };
      }),
  }));
}

/** Count of publications per area slug (for filter-chip labels). */
export async function getAreaCounts() {
  const pubs = (await getPublications()).filter((publication) => publication.data.status === "published");
  const counts: Partial<Record<AreaSlug, number>> = {};
  for (const p of pubs) for (const a of p.data.areas as AreaSlug[]) counts[a] = (counts[a] || 0) + 1;
  return counts;
}

// Display order of groups within the People page.
export const GROUP_ORDER = [
  "Faculty",
  "Researchers",
  "Staff",
  "Students",
  "Affiliates",
  "Alumni",
  "Former Researchers",
] as const;

const byOrder = (a: Person, b: Person) => a.data.order - b.data.order;

/** People grouped and ordered: current groups, degree alumni, then former researchers. */
export async function getGroupedPeople() {
  const people = await getCollection("people");
  return GROUP_ORDER.map((group) => ({
    group,
    people: people.filter((p) => p.data.group === group).sort(byOrder),
  })).filter((g) => g.people.length > 0);
}

// Publication numbers retain the established bibliographic-year chronology.
// Exact publication dates are displayed separately and do not renumber papers.
const byPublicationChronology = (a: Publication, b: Publication) =>
  a.data.year - b.data.year ||
  a.data.title.localeCompare(b.data.title, "en") ||
  a.id.localeCompare(b.id, "en");

/** Publications newest-first, in the exact reverse of the numbered chronology. */
export async function getPublications() {
  const pubs = await getCollection("publications");
  return pubs.sort((a, b) => byPublicationChronology(b, a));
}

/** Stable published-paper numbers: oldest is 1; in-preparation records are unnumbered. */
export function getPublicationNumberMap(publications: Publication[]) {
  const published = [...publications]
    .filter((publication) => publication.data.status === "published")
    .sort(byPublicationChronology);
  return new Map(published.map((publication, index) => [publication.id, index + 1]));
}

/** First source-checked sentence used as the public figure note and SEO description. */
export function briefFinding(value?: string): string {
  const text = value?.trim() ?? "";
  if (!text) return "";
  const firstSentence = text.match(/^.*?[.!?](?=\s+[A-Z]|$)/)?.[0];
  return firstSentence?.trim() || text;
}

const PUBLICATION_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Format a validated ISO calendar date without a local-time date shift. */
export function formatPublicationDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return PUBLICATION_DATE_FORMATTER.format(new Date(Date.UTC(year, month - 1, day)));
}

// --- author <-> person matching -------------------------------------------

const normAuthorForm = (s: string) =>
  s.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

/** Exact, punctuation-insensitive author forms permitted for this profile. */
export function publicationNamesForPerson(person: Person): string[] {
  return person.data.publicationNames;
}

export function authorMatchesPerson(author: string, person: Person): boolean {
  const key = normAuthorForm(author);
  return Boolean(key) && publicationNamesForPerson(person).some((name) => normAuthorForm(name) === key);
}

/** Return a person only when the author form resolves to exactly one profile. */
export function findPersonForAuthor(author: string, people: Person[]): Person | null {
  const matches = people.filter((person) => authorMatchesPerson(author, person));
  return matches.length === 1 ? matches[0] : null;
}

/** Publications authored by a person, newest-first, using explicit author forms. */
export function publicationsForPerson(person: Person, pubs: Publication[], people: Person[]) {
  return pubs.filter((publication) =>
    publication.data.authors.some((author) => {
      const resolved = findPersonForAuthor(author, people);
      return resolved?.id === person.id;
    }),
  );
}

// Everyone profiled is treated as a "mentee" for publication badges except
// the PI and senior research staff listed here.
export const NON_MENTEE_SLUGS = new Set([
  "seongryong-kim",
  "hyun-jae-yoo",
  "dabeen-heo",
]);

/** Build an `isMentee(authorString)` predicate from the people collection. */
export function menteeMatcher(people: Person[]) {
  return (author: string) => {
    const person = findPersonForAuthor(author, people);
    return Boolean(person && !NON_MENTEE_SLUGS.has(person.id));
  };
}

/** Canonical role flags shared by publication lists and featured-paper cards. */
export function publicationRoleFlags(publication: Publication, people: Person[]) {
  const firstAuthor = publication.data.authors[0] ?? "";
  const lastAuthor = publication.data.authors.at(-1) ?? "";
  const isMentee = menteeMatcher(people);
  const piAt = (author: string) => findPersonForAuthor(author, people)?.id === "seongryong-kim";
  return {
    menteeLed: isMentee(firstAuthor),
    collaboration: !piAt(firstAuthor) && !piAt(lastAuthor),
  };
}

const menteeLed = (p: Publication, isMentee: (a: string) => boolean) =>
  isMentee(p.data.authors[0] ?? "");

/**
 * Featured predicate: a mentee-led paper, or a PI first/senior paper from
 * 2019 on. Mentee status is membership-derived (see menteeMatcher).
 */
export function featuredMatcher(people: Person[]) {
  const isMentee = menteeMatcher(people);
  return (p: Publication) => {
    if (p.data.status !== "published") return false;
    return menteeLed(p, isMentee) || (p.data.piFirstOrSenior && p.data.year >= 2019);
  };
}

/** Sort featured papers: mentee-led first, then most recent. */
export function featuredSorter(people: Person[]) {
  const isMentee = menteeMatcher(people);
  return (a: Publication, b: Publication) => {
    const diff = Number(menteeLed(b, isMentee)) - Number(menteeLed(a, isMentee));
    return diff || b.data.year - a.data.year;
  };
}
