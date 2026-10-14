# GitHub Pages setup

## 1. Repository

The site is deployed from the `main` branch of `srkim00/seismology_web`.

Repository: <https://github.com/srkim00/seismology_web>

## 2. Enable GitHub Pages

In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. The included `.github/workflows/deploy.yml` workflow builds the Astro site and deploys the `dist/` output.

## 3. Check the GitHub Pages URL

The current configuration is prepared for the project-page URL:

- <https://srkim00.github.io/seismology_web/>
- `astro.config.mjs` uses `site: "https://srkim00.github.io"` and `base: "/seismology_web"`.
- No `public/CNAME` is present while the existing domain remains connected to Google Sites.

Verify the navigation, publication citation dialog, figures, and embedded tool from this address before a custom-domain cutover.

## 4. Configure the custom domain

Do not change DNS until the GitHub Pages project URL has been reviewed and approved. At cutover:

1. Set `site: "https://seismology.korea.ac.kr"` in `astro.config.mjs` and remove `base`.
2. Add `public/CNAME` containing `seismology.korea.ac.kr`.
3. In **Settings → Pages → Custom domain**, enter `seismology.korea.ac.kr`.
4. Replace the existing DNS record only with approval and use the value requested by GitHub Pages.
5. Wait for GitHub's DNS check to pass, then enable **Enforce HTTPS**.

## 5. Configure publication automation

In **Settings → Actions → General**, allow GitHub Actions to create and approve pull requests if the repository policy requires it. The workflow itself requests only `contents: write` and `pull-requests: write`.

For Crossref metadata, optionally add the repository variable `CROSSREF_MAILTO`.

The publication workflow requires an exact `YYYY-MM-DD` date for every published paper. It uses a complete Crossref publication date when available. If Crossref provides only a year or month, enter a date verified on the publisher page in the workflow's optional `publication_date` field; the automation does not invent a first day of the month.

The workflow also stores ordered author names as `citationAuthors` objects with separate `given` and `family` values, together with `volume`, optional `issue`, and `locator`. `locator` is the inclusive page range or the electronic article identifier. Compare these fields with the publisher record before merging, especially when Crossref supplies incomplete names or online-first metadata. Every published record must have structured citation authors matching the number and order of the public `authors` list. The work-in-preparation record must not contain `citationAuthors`, `volume`, `issue`, or `locator` values that imply an issued publication.

For AI-generated summary drafts, add:

- Secret `OPENAI_API_KEY`
- Variable `OPENAI_MODEL`

AI output is never published solely because the workflow ran. The generated file is proposed through a pull request and remains hidden from the rendered site while `summaryStatus` is `draft`.

Before changing `summaryStatus` to `source-checked` or `approved`, compare the summary metadata and `mainFindings` with the paper or a documented source and record the supporting source in the publication file. Use `source-checked` when author review is still recommended and `approved` only after the designated reviewer accepts the interpretation. Once reviewed, the public page renders only the first English sentence of `mainFindings`, limited to 30 words; the longer summary, evidence fields, and source list remain internal. Do not infer a DOI, figure, summary, publication alias, ORCID, or other researcher identifier from a similar name.

## 6. Pre-cutover checks

- `npm ci` and `npm run build` complete successfully.
- Home, People, Research, Publications, Tools & Teaching, and Contact load at desktop and mobile widths.
- The five research areas use distinct symbols, and each symbol has the same meaning on Home, Research, the Publications area filters, publication lists, and publication detail pages. Publications-list tags show the symbol and full area name together. Geodynamics and Earth structure uses a simplified Pangaea silhouette within a globe; Earthquake properties uses a double-couple focal-mechanism form.
- The interface uses a dark navy canvas, differentiated blue surfaces, and brighter cyan-blue links, controls, and research symbols. Korea University crimson is limited to small brand accents and the official Footer mark rather than page-wide backgrounds or controls.
- Bounded content panels use translucent blue glass surfaces and float asynchronously by no more than 4 px and 0.06 degrees. Keyboard focus pauses the affected panel; touch-sized screens use a rotation-free 1 px drift. The navigation `Pause motion` control persists the visitor's choice and stops the panels and Home hero motion. Large figure and iframe panels omit live backdrop blur. Scientific figures stay fully opaque and unfiltered on a white paper surface, with a translucent mat left visible around the paper. Reduced-motion, reduced-transparency, increased-contrast, and forced-colors preferences use explicit fallbacks.
- The Home hero displays the observed `IU.INCN.00.BHZ` vertical-component record for the 2011 Tohoku-Oki earthquake from 05:45–06:30 UTC. The source link, station/channel code, network DOI, raw-count units, and display processing remain recorded in `src/data/tohokuWaveform.ts`.
- The same observed path is tiled twice and moves continuously from right to left with a 44-second linear transform-only animation, so that a fixed screen position encounters progressively later samples. The hero renders no event or station label; provenance remains in the source module and `NOTICE.md`. `prefers-reduced-motion: reduce` leaves one stationary observed trace.
- The unmodified official Korea University Crimson 2-color Negative Global Symbol appears only in the Footer, links to the university site, retains its original proportions and color, and is not filtered or animated.
- `Department of Earth and Environmental Sciences` links to the current official site at `https://ees.korea.ac.kr/eaes/index.do`; `Korea University` links independently to the university English site on Home, Footer, and Contact.
- All 42 publication records are present: 41 published papers and 1 work in preparation.
- Every published paper has a validated exact publication date and renders it through semantic `<time datetime="YYYY-MM-DD">` markup on list, Featured, and detail views. The work-in-preparation record has no fabricated month or day.
- Every publication retains its existing one-or-more `areas` values. All 42 records have at least one area; `environmental-seismology` currently has no assigned publication and therefore shows a count of zero.
- The Publications page searches, filters, sorts, and counts only the 41 published papers. The work-in-preparation record appears in a separate bottom section reached by the top-page link.
- The 41 published papers are numbered continuously from No. 1 (the oldest, 2009) to No. 41. The work-in-preparation record has no number. Within a shared publication year, title and then publication ID provide deterministic ordering; filtering and partial lists do not renumber papers.
- Home-page Featured recent research is ordered by the official 2025 Journal Impact Factor values: *Nature Communications* (2026; JIF 18.1; PI corresponding author), *Bulletin of Earthquake Engineering* (2026; JIF 4.2; Member-led and PI corresponding author), and *Seismological Research Letters* (2025; JIF 2.9; Member-led and PI corresponding author). Its authorship, collaboration, and access badges use the same component, labels, and rules as the Publications list.
- The 41 published-paper records include 41 verified DOI records, 41 source-checked internal summaries, and 41 figure records.
- Every published-paper record contains ordered `citationAuthors`, `volume`, and `locator` values; `issue` is included only when supplied by the journal. The structured author count and order agree with the public author list.
- A **Cite** control is available in the Publications list, Featured recent research, and each published-paper detail page. It opens a modal dialog in the current page rather than a new window and offers AGU, GJI, BSSA/SRL, Nature Portfolio, Elsevier Harvard, Springer author–date, and BibTeX output.
- Changing the selected format updates the preview for the same paper. Copying provides rich HTML and plain text when supported, with a plain-text fallback; closing the dialog with its close control, backdrop, or Escape restores focus to the originating **Cite** control.
- The work-in-preparation record has no **Cite** control. If JavaScript is unavailable or the dialog payload cannot be read, the published-paper control falls back to the detail page's `#citation` section.
- At 800 × 600 desktop and 390 × 844 mobile viewports, the dialog remains within the viewport, its copy control stays in the fixed footer, the scrollable content remains keyboard accessible, and opening it does not introduce horizontal overflow.
- The generated reference forms are compared against representative AGU, GJI, SSA, and Nature records during quality assurance. Because journal instructions and production conventions can change, the copied reference must still be checked against the current target-journal guide immediately before submission.
- Each published-paper detail page shows a representative figure or publisher figure link, the first English sentence of source-checked `mainFindings` (no more than 30 words), and the citation; it does not render the longer summary, evidence fields, or source list.
- The figure records comprise 18 locally included figures (12 under CC BY 4.0, 5 unmodified originals under CC BY-NC-ND 4.0, and the author-provided RPNet Figure 1) and 23 links to figures on article or publisher pages. The CC BY-NC-ND 4.0 figures remain non-commercial and unmodified. The RPNet image is displayed with an explicit notice that reuse is not permitted.
- Locally included figures, including all three Featured recent research cards, display the complete figure frame without cropping and retain their source attribution and license or rights notice. Featured cards use wide single-row layouts and local figure panels reach 34rem high at desktop widths.
- The work-in-preparation page has no representative figure or public brief note.
- The `PI corresponding` marker and filter identify 16 papers for which the former laboratory website explicitly identified the PI as a corresponding author; author order alone is not used to infer this status.
- All 22 public laboratory people records are present: 13 current members, 5 alumni, and 4 former researchers. The 7 verified ORCID identifiers resolve to the intended people.
- Three former undergraduate-intern profiles are absent, while the current undergraduate intern remains in the current-member list.
- Alumni and Former Researchers are separate People-page sections. Both display the current affiliation below the name when publicly confirmed. Satbyul Kim is explicitly marked as having no publicly confirmed current affiliation.
- `Institutional profile` appears only on the reviewed person-level pages for Seongryong Kim, Sang-Jun Lee, and Lav Joshi. Theses, publication pages, conference abstracts, shared rosters, and organizational pages are not presented as personal profiles.
- The non-laboratory mathematics faculty member named Donghun Lee has no people profile or author-profile link, and the same author string is not assigned to KIGAM-affiliated Dong Hun Lee.
- Current and former laboratory authors appear below their publications without a membership-status label; profiles without photographs use initials only.
- Public people pages do not render internal identifier-review status, review dates, review notes, or evidence-source lists.
- DOI links, article or publisher links, figure links, and the 3D Gravity Forward Modeller load correctly.
- Hidden CV and photo pages are absent.
- The existing domain remains unchanged until the new GitHub Pages deployment is approved.
