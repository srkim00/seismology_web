import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/i;
const ORCID_PATTERN = /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/*
  Content collections for the lab site (Astro 6 Content Layer API).

  Content lives in src/content/<collection>/*.md so a CMS can be layered on
  later without changing the page components.
*/

// People — bio lives in the markdown body (use render()).
const people = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/people" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      status: z.enum(["current", "alumni"]),
      group: z.enum([
        "Faculty",
        "Researchers",
        "Staff",
        "Students",
        "Affiliates",
        "Alumni",
        "Former Researchers",
      ]),
      role: z.string(),
      title: z.string().optional(),
      affiliation: z.string().optional(),
      currentAffiliation: z.string().optional(),
      headshot: image().optional(),
      // Only these reviewed author forms are used for publication matching.
      // An empty array disables automatic author matching (fail closed).
      publicationNames: z.array(z.string().min(1)).default([]),
      links: z
        .object({
          email: z.email().optional(),
          twitter: z.url().optional(),
          scholar: z.url().optional(),
          orcid: z.url().regex(ORCID_PATTERN, "ORCID must use the canonical orcid.org URL format").optional(),
          linkedin: z.url().optional(),
          website: z.url().optional(),
          institutional: z.url().optional(),
          researchgate: z.url().optional(),
          github: z.url().optional(),
          cv: z
            .string()
            .regex(/^\/[A-Za-z0-9/_-]+\.pdf$/i, "CV must be a root-relative PDF path")
            .optional(),
        })
        .default({}),
      identifierStatus: z
        .enum(["verified", "not-found", "ambiguous", "unreviewed"])
        .default("unreviewed"),
      identifierCheckedAt: z.string().optional(),
      identifierNote: z.string().optional(),
      identitySources: z
        .array(z.object({ label: z.string(), url: z.url() }))
        .default([]),
      order: z.number().default(0),
      featured: z.boolean().default(false),
    }),
});

// Publications — frontmatter only (any markdown body is optional notes).
const publicationSchema = z
  .object({
    title: z.string(),
    // Optional reference-list casing. The display title remains exactly as
    // supplied by the publisher.
    citationTitle: z.string().optional(),
    authors: z.array(z.string()),
    // Structured names are retained separately from the public display form so
    // journal-specific reference styles can place surnames and initials safely.
    citationAuthors: z
      .array(
        z.object({
          given: z.string(),
          family: z.string().min(1),
          orcid: z.url().optional(),
        }),
      )
      .optional(),
    year: z.number(),
    publicationDate: z.iso.date().optional(),
    journal: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    // Inclusive pages or an electronic article identifier, as supplied by the publisher.
    locator: z.string().optional(),
    doi: z.string().regex(DOI_PATTERN, "Invalid DOI format").optional(),
    sourceUrl: z.url().optional(),
    pmid: z.string().optional(),
    pmcid: z.string().optional(),
    url: z.url().optional(),
    scholarUrl: z.url().optional(),
    citations: z.number().optional(),
    isMenteePaper: z.boolean().default(false),
    menteeFirstAuthor: z.boolean().default(false),
    // The lab PI is first or last (senior) author.
    piFirstOrSenior: z.boolean().default(false),
    // Set only when an explicit source identifies the lab PI as a corresponding author.
    piCorresponding: z.boolean().default(false),
    piCorrespondingSource: z.url().optional(),
    featured: z.boolean().default(false),
    openAccess: z.boolean().default(false),
    status: z.enum(["published", "in-preparation"]).default("published"),
    // A published-online article whose volume, issue, and locator have not yet
    // been assigned by the journal. Replace this flag with issued metadata once
    // those fields become available.
    onlineFirst: z.boolean().default(false),
    fullCitation: z.string().optional(),
    summaryEn: z.string().optional(),
    summaryKo: z.string().optional(),
    researchQuestion: z.string().optional(),
    dataAndRegion: z.string().optional(),
    methods: z.string().optional(),
    mainFindings: z.string().optional(),
    quantitativeEvidence: z.string().optional(),
    limitations: z.string().optional(),
    summarySourceBasis: z
      .enum([
        "crossref_abstract",
        "author_notes",
        "crossref_abstract_and_author_notes",
        "publisher_abstract",
        "publisher_abstract_and_figure_caption",
      ])
      .optional(),
    summaryStatus: z.enum(["draft", "source-checked", "approved"]).optional(),
    summarySources: z.array(z.url()).default([]),
    sourceCheckedAt: z.string().optional(),
    aiModel: z.string().optional(),
    aiGeneratedAt: z.string().optional(),
    figure: z
      .discriminatedUnion("reuse", [
        z.object({
          reuse: z.literal("local"),
          rightsBasis: z.enum(["open-license", "author-provided"]).default("open-license"),
          number: z.string().optional(),
          caption: z.string(),
          alt: z.string().min(1),
          sourceUrl: z.url(),
          image: z.string().min(1),
          attribution: z.string(),
          license: z.string(),
          licenseUrl: z.url().optional(),
        }),
        z.object({
          reuse: z.literal("linked-only"),
          number: z.string().optional(),
          caption: z.string(),
          sourceUrl: z.url(),
          attribution: z.string(),
          license: z.string(),
          licenseUrl: z.url().optional(),
          image: z.never().optional(),
        }),
      ])
      .optional(),
    // Research tags drive the Research page and Publications filters. The
    // vocabulary is mirrored in src/lib/content.ts.
    areas: z
      .array(
        z.enum([
          "geodynamics-structure",
          "seismological-methods",
          "earthquake-properties",
          "earthquake-engineering",
          "environmental-seismology",
        ]),
      )
      .default([]),
  })
  .superRefine((publication, context) => {
    if (publication.status === "published" && !publication.publicationDate) {
      context.addIssue({
        code: "custom",
        path: ["publicationDate"],
        message: "Published records require an exact ISO publication date",
      });
    }
    if (publication.status === "published" && !publication.citationAuthors) {
      context.addIssue({
        code: "custom",
        path: ["citationAuthors"],
        message: "Published records require structured citation authors",
      });
    }
    if (
      publication.citationAuthors &&
      publication.citationAuthors.length !== publication.authors.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["citationAuthors"],
        message: "citationAuthors must match the display author count",
      });
    }
    if (publication.status === "in-preparation" && publication.publicationDate) {
      context.addIssue({
        code: "custom",
        path: ["publicationDate"],
        message: "In-preparation records must not contain a publication date",
      });
    }
    if (publication.onlineFirst && publication.status !== "published") {
      context.addIssue({
        code: "custom",
        path: ["onlineFirst"],
        message: "Only published records can be marked online-first",
      });
    }
    if (
      publication.onlineFirst &&
      (publication.volume || publication.issue || publication.locator)
    ) {
      context.addIssue({
        code: "custom",
        path: ["onlineFirst"],
        message: "Online-first records must not contain unassigned issue metadata",
      });
    }
    if (
      publication.status === "in-preparation" &&
      (publication.volume || publication.issue || publication.locator)
    ) {
      context.addIssue({
        code: "custom",
        path: ["volume"],
        message: "In-preparation records must not contain issued bibliographic metadata",
      });
    }
  });

const publications = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/publications" }),
  schema: publicationSchema,
});

export const collections = { people, publications };
