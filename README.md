# Korea University Seismology Laboratory

GitHub Pages source for the Seismology Laboratory in the Department of Earth and Environmental Sciences at Korea University.

This site retains the structure and components of the MIT-licensed [`bchcohenlab/lab-website-template`](https://github.com/bchcohenlab/lab-website-template), built with Astro and Tailwind CSS. The laboratory's public content has been migrated into the template. Pages that were hidden on the former site were not migrated.

## Public sections

- Home: laboratory scope, three papers in Featured recent research, and five research areas with distinct symbols
- People: 13 current members, 5 alumni, and 4 former researchers, with profile pages, current affiliations for former members where publicly confirmed, and a downloadable PI CV
- Research: publications grouped by research area
- Publications: 43 published papers numbered No. 1–No. 43, with search, filters, and an in-page citation-copy dialog, plus 1 unnumbered work-in-preparation record in a separate bottom section linked from the top of the page
- Tools & Teaching: 3D Gravity Forward Modeller
- Contact: public address and external profiles

## Migrated data

- Publications: 44 records, comprising 43 published papers and 1 work in preparation
- DOI metadata: 43 verified DOI records with exact publication dates
- Structured citation metadata: 43 published-paper records with ordered given and family names; 42 have issued volume and locator metadata, while one SRL article is explicitly recorded as online-first pending assignment of those fields
- Internal research metadata: 43 source-checked summaries, evidence fields, and source lists for published papers
- Figures: 43 figure records, comprising 19 locally included figures (13 under CC BY 4.0, 5 unmodified originals under CC BY-NC-ND 4.0, and 1 author-provided image not licensed for reuse) and 24 links to figures on article or publisher pages
- Research-area classification: all 44 publication records retain one or more `areas` values; no paper is currently assigned to `environmental-seismology`
- PI corresponding authorship: 16 records, based on the explicit corresponding-author labels on the former laboratory website
- People: 22 public laboratory profiles (13 current members, 5 alumni, and 4 former researchers), including 7 profiles with verified ORCID identifiers

Names, publication aliases, and researcher identifiers are connected only when explicit supporting evidence is available. Similar names are not treated as evidence of identity. The non-laboratory mathematics faculty member named Donghun Lee is not included in the people collection. His author name remains bibliographic text on relevant papers and is not connected to the KIGAM-affiliated laboratory member Dong Hun Lee.

Public people pages show the available profile and researcher links without displaying the internal identifier-review status, review date, notes, or evidence sources.

The People page separates degree alumni from former researchers. Alumni are Jongwon Han, Yeonjoo Lim, Hayoung Park, Jiyeon Lee, and Sigit Ariwibowo; former researchers are Lav Joshi, Michael Witek, Satbyul Kim, and Sang-Jun Lee. Both sections show the person's current affiliation below the name when it has been confirmed from a public source. Satbyul Kim is marked as having no publicly confirmed current affiliation. Three former undergraduate-intern profiles were removed, while the current undergraduate intern remains in the current-member list. An `Institutional profile` link is displayed only for a reviewed person-level page: Korea University Pure for Seongryong Kim, the KNUE faculty page for Sang-Jun Lee, and the Charles University directory for Lav Joshi. General rosters, theses, articles, conference abstracts, and unit pages remain internal identity sources rather than public profile links.

Publication cards show every author who resolves to a laboratory profile, including current and former members, without adding a membership-status label to the author marker. A profile without a headshot is represented by initials; an abbreviated publication author name is never assigned to a profile from initials alone. Sixteen papers carry a `PI corresponding` marker and can be filtered on that basis; this field follows the explicit corresponding-author labels on the former laboratory website rather than author order alone.

Each of the five research areas has a distinct monochrome symbol. The Geodynamics and Earth structure symbol shows a simplified Pangaea silhouette within a globe, and the Earthquake properties symbol uses a double-couple focal-mechanism form. The same symbol-to-area mapping is used on the Home and Research pages, in the Publications area filters, on publication cards, and on publication detail pages. Each Publications-list tag displays the symbol together with the full research-area name, and papers display every tag corresponding to their existing `areas` values. All 44 records have at least one area value; the Environmental seismology area remains visible in the taxonomy and filters with a current publication count of zero.

The interface uses a dark navy scientific canvas with differentiated blue surfaces and brighter cyan-blue links, controls, and research symbols. Korea University crimson is limited to the favicon, navigation state, short section rules, the separator between the linked department and university names, and the official university mark in the Footer. Bounded content panels use translucent blue glass surfaces with restrained highlights and shadows. Scientific figures remain fully opaque and unfiltered on a white paper surface, with a separate translucent mat around that surface so the glass treatment remains visible beside white figures. Their asynchronous motion is limited to 4 px and 0.06 degrees; keyboard focus pauses the affected panel, touch-sized screens use a rotation-free 1 px drift, and system motion preferences remain effective. No motion control is displayed; previously saved pause settings are retained. Large figure and iframe panels retain the same glass appearance without live backdrop blur. Reduced-motion, reduced-transparency, increased-contrast, and forced-colors preferences have explicit fallbacks. The Home hero uses the observed vertical-component record `IU.INCN.00.BHZ` from 05:45–06:30 UTC on 11 March 2011. The 54,000 raw instrument-count samples were mean-removed, reduced with a min–max envelope, and tapered only at the two display edges before being normalized for the background graphic. Two copies of the same path move continuously from right to left over 44 seconds so that a fixed screen position encounters progressively later samples; `prefers-reduced-motion` shows a stationary trace. No event or station label is rendered in the hero. The source URL, DOI, units, and processing record remain in `src/data/tohokuWaveform.ts` and `NOTICE.md`. Home, Footer, and Contact link `Department of Earth and Environmental Sciences` to the current official department site (`https://ees.korea.ac.kr/eaes/index.do`) and `Korea University` to the university's English site. The official Korea University Global Symbol is confined to the Footer so that it remains distinct from the laboratory mark and the moving waveform.

The Home-page **Featured recent research** section is restricted to recent papers led by a laboratory member or the PI and is ordered by the official 2025 Journal Impact Factor values: *Nature Communications* (2026; JIF 18.1; PI corresponding author), *Bulletin of Earthquake Engineering* (2026; JIF 4.2; Member-led and PI corresponding author), and *Seismological Research Letters* (2025; JIF 2.9; Member-led and PI corresponding author). Featured cards and the Publications list share one badge component and therefore use the same `Member-led`, `PI corresponding author`, `Collaboration`, and `Open access` labels, rules, and styles. The section uses one wide editorial row per paper; all three local figures occupy the larger panel, reach 34rem high at desktop widths, remain uncropped, and retain their source attribution and rights notice. The SRL card uses the author-provided RPNet Figure 1 and labels it as not licensed for reuse.

The 43 published papers show an exact day-month-year publication date in lists, Featured recent research, and detail pages. Citation years remain unchanged because they describe the journal volume or issue. Papers are numbered from oldest to newest using the publisher-verified publication date, with title and publication ID used only as deterministic tie-breakers. Work in preparation is excluded from both exact-date validation and numbering.

Published-paper detail pages use a figure-first format: a representative figure or publisher figure link, the first English sentence of the source-checked `mainFindings` field (no more than 30 words), and the citation. The longer summaries, evidence fields, and source lists remain in the publication Markdown for editorial review but are not rendered publicly. The work-in-preparation record is shown only in the separate bottom section and its detail page; it has neither a representative figure nor a public brief note.

## Research layout

The Research page presents each paper with its representative figure and existing brief note on the left, and bibliographic details, author markers, area tags, DOI, and citation control on the right. On narrow screens the figure and note precede the bibliographic information. Figure frames use one third of the corresponding Featured research frame height (22, 28, or 34rem divided by three), without cropping or filtering scientific images. Source attribution and reuse notices remain below local figures; linked-only figures retain publisher links. The redundant `Figure and brief note` link is omitted only in this Research layout. Publications and personal profiles retain their standard lists.

## Citation copying

Each published paper provides a **Cite** control in the Publications list, Research, Featured recent research, and the publication detail page. The control opens one modal dialog within the current page; it does not open a new window. Seven output forms are available:

- AGU journals
- *Geophysical Journal International* (GJI)
- *Bulletin of the Seismological Society of America* / *Seismological Research Letters* (SSA)
- Nature Portfolio
- Elsevier Harvard, for workflows such as *Earth and Planetary Science Letters* and *Tectonophysics*
- Springer author–date, for journals such as *Bulletin of Earthquake Engineering*
- BibTeX

The formatted preview is generated at build time from `citationAuthors`, `year`, `journal`, `volume`, `issue`, `locator`, and `doi`. `citationAuthors` stores given and family names separately so that author order and initials can be adapted without parsing the public display string. `locator` contains either the inclusive page range or the electronic article identifier supplied by the publisher.

The copy action remains in a fixed dialog footer while the reference controls and preview scroll independently on short screens. It writes both rich HTML and plain text when the browser supports it; the plain-text form remains available for other editors and BibTeX. Nature references omit a fixed reference number because numbering is assigned by order of appearance in a manuscript. A normal detail-page `#citation` link remains as the no-JavaScript or script-error fallback. The work-in-preparation record has no **Cite** control because it lacks issued bibliographic metadata.

The formatters follow the journal instructions and production conventions reviewed during implementation, but journal requirements can change. Authors must compare the copied reference with the current instructions for the target journal before submission.

## Local development

Node.js 22.12 or later is required.

```bash
npm ci
npm run dev
```

The local development server is available at `http://localhost:4321`.

Run the production build before publishing:

```bash
npm run build
```

## Content locations

```text
src/content/people/          one Markdown file per person
src/content/publications/    one Markdown file per publication
src/data/site.ts             laboratory identity, address, links, and navigation
src/data/tohokuWaveform.ts   observed waveform path, provenance, and processing record
src/lib/content.ts           research-area taxonomy and content queries
src/pages/                   page routes
public/brand/                official institutional mark used in the Footer
public/cv/                   downloadable PI curriculum vitae
public/publication-figures/  figures with a documented display or reuse basis
public/tools/                standalone interactive tools
```

## Add a publication

The repository includes an `Add publication draft` GitHub Actions workflow.

1. Open **Actions → Add publication draft → Run workflow**.
2. Enter a DOI and, if needed, choose research-area slugs and open-access status.
3. If Crossref provides only a year or month, enter the exact publisher-verified date in the optional `publication_date` field.
4. The workflow retrieves Crossref metadata, including structured author names and available volume, issue, and page or article-identifier fields; creates a publication Markdown file; validates the site build; and opens a pull request.
5. Before merging, compare `citationAuthors`, `volume`, `issue`, `locator`, DOI, publication date, and research-area classification with the publisher record. For an online-first paper whose volume and locator have not been assigned, set `onlineFirst: true` and omit those unassigned fields. The workflow never converts a partial date into the first day of a month.

Optional AI summaries require repository configuration:

- Secret: `OPENAI_API_KEY`
- Variable: `OPENAI_MODEL`
- Optional variable: `CROSSREF_MAILTO`

The workflow uses only the Crossref abstract and optional author-supplied notes. Generated metadata is saved with `summaryStatus: draft` and remains excluded from public pages. After a reviewer changes the value to `source-checked` or `approved`, the public detail page uses only the first English sentence of `mainFindings` as its brief note. The longer summary, evidence fields, and source list remain internal editorial data.

Before changing that status, the reviewer must compare the summary metadata and `mainFindings` with the paper or a documented source, record the supporting source, and confirm that the public sentence does not overstate the evidence. A draft produced by the workflow remains excluded from the public page and page metadata.

## Deployment

The `Deploy to GitHub Pages` workflow builds and publishes the site on pushes to `main`. The production address is <https://seismology.korea.ac.kr/>. In the repository settings, **Pages → Source** is **GitHub Actions** and **Custom domain** is `seismology.korea.ac.kr`. Astro uses the custom-domain URL without a repository `base` prefix. The university-managed DNS CNAME points to `srkim00.github.io`. Custom GitHub Actions deployments use the Pages setting rather than a `CNAME` file. See [SETUP.md](./SETUP.md) for deployment and domain configuration.

## Rights and attribution

The upstream template code is distributed under the MIT License in [LICENSE](./LICENSE). Laboratory text, photographs, publication metadata, the EarthScope waveform data, the official Korea University mark, and the interactive teaching tool are not automatically relicensed by that file. The waveform record is attributed to the Global Seismographic Network (`IU`, DOI `10.7914/SN/IU`) and NSF NGF/EarthScope. Five locally included figures use CC BY-NC-ND 4.0 and therefore must remain non-commercial and unmodified, with source attribution and the license notice retained. See [NOTICE.md](./NOTICE.md).
