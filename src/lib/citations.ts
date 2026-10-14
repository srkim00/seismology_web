import type { Publication } from "./content";

export type CitationStyleId =
  | "agu"
  | "gji"
  | "ssa"
  | "nature"
  | "elsevier"
  | "springer"
  | "bibtex";

export interface CitationFormat {
  id: CitationStyleId;
  label: string;
  shortLabel: string;
  note: string;
  plain: string;
  html?: string;
}

export const CITATION_STYLE_META: Array<
  Pick<CitationFormat, "id" | "label" | "shortLabel" | "note"> & { guideUrl?: string }
> = [
  {
    id: "agu",
    label: "AGU journals",
    shortLabel: "AGU",
    note: "APA-based AGU reference style with the full journal title and DOI.",
    guideUrl: "https://www.agu.org/publications/authors/journals/grammar-style-guide",
  },
  {
    id: "gji",
    label: "Geophysical Journal International",
    shortLabel: "GJI",
    note: "GJI Harvard reference-list style; an available DOI is retained.",
    guideUrl: "https://academic.oup.com/gji/pages/general_instructions",
  },
  {
    id: "ssa",
    label: "BSSA / Seismological Research Letters",
    shortLabel: "BSSA / SRL",
    note: "SSA reference-list form using journal abbreviations and current production conventions.",
    guideUrl: "https://www.seismosoc.org/publications/bssa-submission-guidelines-2/",
  },
  {
    id: "nature",
    label: "Nature Portfolio",
    shortLabel: "Nature",
    note: "Nature reference number is assigned by order of appearance and is therefore not included.",
    guideUrl: "https://www.nature.com/nature/for-authors/formatting-guide",
  },
  {
    id: "elsevier",
    label: "Elsevier Harvard",
    shortLabel: "Elsevier",
    note: "Author–date form used for Earth-science workflows such as EPSL and Tectonophysics.",
  },
  {
    id: "springer",
    label: "Springer author–date",
    shortLabel: "Springer",
    note: "Author–date form used by journals including Bulletin of Earthquake Engineering.",
  },
  {
    id: "bibtex",
    label: "BibTeX",
    shortLabel: "BibTeX",
    note: "Machine-readable record for LaTeX and reference managers; UTF-8 names are preserved.",
  },
];

const JOURNAL_ABBREVIATIONS: Record<string, string> = {
  "Bulletin of Earthquake Engineering": "Bull. Earthq. Eng.",
  "Bulletin of the Seismological Society of America": "Bull. Seism. Soc. Am.",
  "Earth and Planetary Science Letters": "Earth Planet. Sci. Lett.",
  "Frontiers in Earth Science": "Front. Earth Sci.",
  "Geophysical Journal International": "Geophys. J. Int.",
  "Geophysical Research Letters": "Geophys. Res. Lett.",
  "Geosciences Journal": "Geosci. J.",
  "Gondwana Research": "Gondwana Res.",
  "IEEE Geoscience and Remote Sensing Letters": "IEEE Geosci. Remote Sens. Lett.",
  "Journal of Geophysical Research: Solid Earth": "J. Geophys. Res. Solid Earth",
  "Journal of Seismology": "J. Seismol.",
  "Journal of the Earthquake Engineering Society of Korea": "J. Earthq. Eng. Soc. Korea",
  "Journal of the Geological Society of Korea": "J. Geol. Soc. Korea",
  "Nature Communications": "Nat. Commun.",
  "Pure and Applied Geophysics": "Pure Appl. Geophys.",
  "Seismological Research Letters": "Seismol. Res. Lett.",
  "South African Journal of Geology": "S. Afr. J. Geol.",
  Tectonophysics: "Tectonophysics",
};

interface CitationAuthor {
  given: string;
  family: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character] ?? character);

const initials = (given: string, compact = false) =>
  given
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .filter(Boolean)
        .map((segment) => `${segment.replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase()}.`)
        .join("-"),
    )
    .join(compact ? "" : " ");

const inverted = (author: CitationAuthor, compact = false) => {
  const authorInitials = initials(author.given, compact);
  return authorInitials ? `${author.family}, ${authorInitials}` : author.family;
};

const forward = (author: CitationAuthor, compact = false) => {
  const authorInitials = initials(author.given, compact);
  return authorInitials ? `${authorInitials} ${author.family}` : author.family;
};

const joinFinal = (values: string[], conjunction: "&" | "and", oxfordComma = true) => {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} ${conjunction} ${values[1]}`;
  const comma = oxfordComma ? "," : "";
  return `${values.slice(0, -1).join(", ")}${comma} ${conjunction} ${values.at(-1)}`;
};

const titleWithStop = (title: string) => /[.!?]$/.test(title) ? title : `${title}.`;
// A terminal question or exclamation mark replaces a style's usual title
// delimiter; emitting `?,` or `!,` produces an invalid reference.
const titleWithComma = (title: string) =>
  /[!?]$/.test(title) ? title : `${title.replace(/\.$/, "")},`;
const doiUrl = (doi?: string) => doi ? `https://doi.org/${doi}` : "";

const volumeIssue = (volume?: string, issue?: string) =>
  volume ? `${volume}${issue ? `(${issue})` : ""}` : "";

const aguAuthors = (authors: CitationAuthor[]) => {
  const formatted = authors.map((author) => inverted(author));
  return authors.length >= 8
    ? `${formatted.slice(0, 6).join(", ")}, et al.`
    : joinFinal(formatted, "&", true);
};

const gjiAuthors = (authors: CitationAuthor[]) => {
  if (authors.length >= 9) return `${inverted(authors[0], true)} et al.`;
  return joinFinal(authors.map((author) => inverted(author, true)), "&", false);
};

const ssaAuthors = (authors: CitationAuthor[]) => {
  const selected = authors.length > 10 ? authors.slice(0, 10) : authors;
  const formatted = selected.map((author, index) => index === 0 ? inverted(author) : forward(author));
  return authors.length > 10 ? `${formatted.join(", ")}, et al.` : joinFinal(formatted, "and", true);
};

const natureAuthors = (authors: CitationAuthor[]) =>
  authors.length > 5
    ? `${inverted(authors[0])} et al.`
    : joinFinal(authors.map((author) => inverted(author)), "&", false);

const elsevierAuthors = (authors: CitationAuthor[]) =>
  authors.map((author) => inverted(author, true)).join(", ");

const springerAuthors = (authors: CitationAuthor[]) =>
  authors.map((author) => `${author.family} ${initials(author.given, true).replaceAll(".", "")}`.trim()).join(", ");

const richAuthors = (value: string) => escapeHtml(value);

const bibtexKey = (family: string, year: number, title: string) => {
  const normalizedFamily = family.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const titleWords = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/gi)?.slice(0, 2).join("") ?? "article";
  return `${normalizedFamily || "article"}${year}${titleWords.toLowerCase()}`;
};

const bibtexValue = (value: string) => value.replaceAll("&", "\\&");

/** Build reviewed journal-specific reference-list entries at build time. */
export function getCitationFormats(publication: Publication): CitationFormat[] {
  const data = publication.data;
  if (data.status !== "published" || !data.citationAuthors?.length) return [];

  const authors = data.citationAuthors as CitationAuthor[];
  const journal = data.journal ?? "";
  const shortJournal = JOURNAL_ABBREVIATIONS[journal] ?? journal;
  const volume = data.volume ?? "";
  const issue = data.issue ?? "";
  const locator = data.locator ?? "";
  const volIssue = volumeIssue(volume, issue);
  const doi = doiUrl(data.doi);

  const aguBibliography = [volIssue, locator].filter(Boolean).join(", ");
  const aguPlain = `${aguAuthors(authors)} (${data.year}). ${titleWithStop(data.title)} ${journal}${aguBibliography ? `, ${aguBibliography}` : ""}.${doi ? ` ${doi}` : ""}`;
  const aguRichVolume = volume ? `<em>${escapeHtml(volume)}</em>${issue ? `(${escapeHtml(issue)})` : ""}` : "";
  const aguRichBibliography = [aguRichVolume, locator ? escapeHtml(locator) : ""].filter(Boolean).join(", ");
  const aguHtml = `${richAuthors(aguAuthors(authors))} (${data.year}). ${escapeHtml(titleWithStop(data.title))} <em>${escapeHtml(journal)}</em>${aguRichBibliography ? `, ${aguRichBibliography}` : ""}.${doi ? ` <a href="${escapeHtml(doi)}">${escapeHtml(doi)}</a>` : ""}`;

  // GJI's current examples omit issue numbers and express an available DOI as
  // `doi:...`; keep the resolver URL only in the rich-text hyperlink target.
  const gjiBibliography = [volume, locator].filter(Boolean).join(", ");
  const gjiDoi = data.doi ? `doi:${data.doi}` : "";
  const gjiPlain = `${gjiAuthors(authors)}, ${data.year}. ${titleWithComma(data.title)} ${shortJournal}${gjiBibliography ? `, ${gjiBibliography}` : ""}${gjiDoi ? `, ${gjiDoi}` : ""}.`;
  const gjiHtml = `${richAuthors(gjiAuthors(authors))}, ${data.year}. ${escapeHtml(titleWithComma(data.title))} <em>${escapeHtml(shortJournal)}</em>${gjiBibliography ? `, ${escapeHtml(gjiBibliography)}` : ""}${gjiDoi ? `, <a href="${escapeHtml(doi)}">${escapeHtml(gjiDoi)}</a>` : ""}.`;

  const ssaVolume = volume ? ` ${volume}` : "";
  const ssaIssue = issue ? `, no. ${issue}` : "";
  const ssaLocator = locator ? `, ${locator}` : "";
  const ssaPlain = `${ssaAuthors(authors)} (${data.year}). ${titleWithComma(data.title)} ${shortJournal}${ssaVolume}${ssaIssue}${ssaLocator}${data.doi ? `, doi: ${data.doi}` : ""}.`;
  const ssaHtml = `${richAuthors(ssaAuthors(authors))} (${data.year}). ${escapeHtml(titleWithComma(data.title))} <em>${escapeHtml(shortJournal)}</em>${volume ? ` <strong>${escapeHtml(volume)}</strong>` : ""}${ssaIssue ? escapeHtml(ssaIssue) : ""}${ssaLocator ? escapeHtml(ssaLocator) : ""}${data.doi ? `, doi: <a href="${escapeHtml(doi)}">${escapeHtml(data.doi)}</a>` : ""}.`;

  const natureBibliography = [volume, locator].filter(Boolean).join(", ");
  const natureWebOnly = !natureBibliography && doi ? ` ${doi}` : "";
  const naturePlain = `${natureAuthors(authors)} ${titleWithStop(data.title)} ${shortJournal}${natureBibliography ? ` ${natureBibliography}` : natureWebOnly} (${data.year}).`;
  const natureHtml = `${richAuthors(natureAuthors(authors))} ${escapeHtml(titleWithStop(data.title))} <em>${escapeHtml(shortJournal)}</em>${volume ? ` <strong>${escapeHtml(volume)}</strong>` : ""}${locator ? `, ${escapeHtml(locator)}` : ""}${natureWebOnly ? ` <a href="${escapeHtml(doi)}">${escapeHtml(doi)}</a>` : ""} (${data.year}).`;

  const elsevierBibliography = [volIssue, locator].filter(Boolean).join(", ");
  const elsevierPlain = `${elsevierAuthors(authors)}, ${data.year}. ${titleWithStop(data.title)} ${shortJournal}${elsevierBibliography ? ` ${elsevierBibliography}` : ""}.${doi ? ` ${doi}` : ""}`;
  const elsevierHtml = `${richAuthors(elsevierAuthors(authors))}, ${data.year}. ${escapeHtml(titleWithStop(data.title))} <em>${escapeHtml(shortJournal)}</em>${elsevierBibliography ? ` ${escapeHtml(elsevierBibliography)}` : ""}.${doi ? ` <a href="${escapeHtml(doi)}">${escapeHtml(doi)}</a>` : ""}`;

  const springerBibliography = volume
    ? ` ${volume}${issue ? `(${issue})` : ""}${locator ? `:${locator}` : ""}`
    : "";
  const springerPlain = `${springerAuthors(authors)} (${data.year}) ${titleWithStop(data.title)} ${shortJournal}${springerBibliography}.${doi ? ` ${doi}` : ""}`;
  const springerHtml = `${richAuthors(springerAuthors(authors))} (${data.year}) ${escapeHtml(titleWithStop(data.title))} <em>${escapeHtml(shortJournal)}</em>${springerBibliography ? ` ${escapeHtml(springerBibliography.trim())}` : ""}.${doi ? ` <a href="${escapeHtml(doi)}">${escapeHtml(doi)}</a>` : ""}`;

  const bibtexLines = [
    `@article{${bibtexKey(authors[0]?.family ?? "article", data.year, data.title)},`,
    `  author = {${bibtexValue(authors.map((author) => `${author.given} ${author.family}`.trim()).join(" and "))}},`,
    `  title = {${bibtexValue(data.title)}},`,
    `  journal = {${bibtexValue(journal)}},`,
    `  year = {${data.year}},`,
    ...(volume ? [`  volume = {${bibtexValue(volume)}},`] : []),
    ...(issue ? [`  number = {${bibtexValue(issue)}},`] : []),
    ...(locator ? [`  pages = {${bibtexValue(locator.replace(/[–—]/g, "--"))}},`] : []),
    ...(data.doi ? [`  doi = {${bibtexValue(data.doi)}},`, `  url = {${bibtexValue(doi)}}`] : []),
    "}",
  ];
  const bibtexPlain = bibtexLines.join("\n");

  const byId = new Map(CITATION_STYLE_META.map((style) => [style.id, style]));
  const make = (id: CitationStyleId, plain: string, html?: string): CitationFormat => {
    const meta = byId.get(id);
    if (!meta) throw new Error(`Missing citation style metadata for ${id}`);
    return { id, label: meta.label, shortLabel: meta.shortLabel, note: meta.note, plain, html };
  };

  return [
    make("agu", aguPlain, aguHtml),
    make("gji", gjiPlain, gjiHtml),
    make("ssa", ssaPlain, ssaHtml),
    make("nature", naturePlain, natureHtml),
    make("elsevier", elsevierPlain, elsevierHtml),
    make("springer", springerPlain, springerHtml),
    make("bibtex", bibtexPlain),
  ];
}

export function getCitationPayload(publication: Publication) {
  const formats = getCitationFormats(publication);
  if (!formats.length) return null;
  return {
    publicationId: publication.id,
    title: publication.data.title,
    doi: publication.data.doi ?? "",
    formats,
  };
}
