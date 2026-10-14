# Notices

## Template

This project is derived from `bchcohenlab/lab-website-template` by Alexander Li Cohen, using upstream commit `877ee317337e5b077414e59c45070b346f5dfa30` as the retained source snapshot. The upstream template is distributed under the MIT License retained in `LICENSE`.

## Laboratory content

Laboratory text, member photographs, publication records, and the 3D Gravity Forward Modeller were migrated from the public Korea University Seismology Laboratory website. Their inclusion in this repository does not, by itself, grant reuse rights beyond those held by the respective rights holders.

The publication dataset contains 44 records: 43 published papers and 1 work in preparation. The 43 published-paper records include verified DOI metadata, source-checked summaries, evidence fields, source lists, and figure records. The longer summaries, evidence fields, and source lists are retained as internal editorial data and are not rendered publicly. Each published-paper detail page presents a representative figure or publisher figure link, the first English sentence of source-checked `mainFindings` (no more than 30 words), and the citation. Sixteen records are marked `PI corresponding` from explicit corresponding-author labels on the former laboratory website; this status is not inferred solely from author order. The work-in-preparation page has no representative figure or public brief note.

Nineteen figures are included locally: 13 under CC BY 4.0, 5 unmodified originals under CC BY-NC-ND 4.0, and the author-provided RPNet Figure 1. The CC BY-NC-ND 4.0 figures are presented for non-commercial use without modification; their source attribution and license notice must remain with the figures. The RPNet image is provided only for display on this laboratory website and is not licensed for reuse. The remaining 24 figure records link to article or publisher pages and do not copy the figure into this repository. The project license does not relicense publication text, metadata, or figures.

The PI curriculum vitae at `public/cv/Seongryong-Kim-CV.pdf` is provided for personal academic reference and is not covered by the template's MIT License.

The public people dataset contains 22 laboratory profiles, including 7 profiles with verified ORCID identifiers. Names, publication aliases, and identifiers are connected only when supported by explicit evidence. Similar names are not assumed to represent the same person. The non-laboratory mathematics faculty member named Donghun Lee is not included as a laboratory profile, and his publication author name is not assigned to KIGAM-affiliated Dong Hun Lee. Internal identifier-review status, dates, notes, and evidence sources are retained in the content records but are not rendered on public people pages. Publication author markers do not distinguish current from former members; a profile without a photograph is shown with initials only.

## Observed waveform

The Home hero trace is derived from the 2011 Tohoku-Oki earthquake record `IU.INCN.00.BHZ`, acquired for 05:45–06:30 UTC on 11 March 2011 through the NSF NGF/EarthScope FDSN data service. The source contains 54,000 vertical-component samples at 20 Hz in raw instrument counts. For the display path, the full-record mean was removed, a 2.5% cosine taper was applied at each edge to close the visual loop, the series was reduced with a 760-bin min–max envelope, and the display amplitude was normalized. These operations produce a background visualization and do not convert the record to physical ground-motion units.

Credit the Global Seismographic Network (`IU`, DOI [`10.7914/SN/IU`](https://doi.org/10.7914/SN/IU)) and NSF NGF/EarthScope when reusing the waveform-derived display. The generated path and source metadata are in `src/data/tohokuWaveform.ts`. The MIT License for the template code does not relicense the underlying waveform data.

## Korea University mark

`public/brand/korea-university-global-symbol-crimson-negative.gif` is the unmodified Crimson 2-color Negative Global Symbol distributed through the [official Korea University symbol page](https://www.korea.ac.kr/ko/372/subview.do) and its basic UI archive. It is used only as an institutional identifier in the Footer. The mark is not covered by the template's MIT License; Korea University's identity and trademark conditions continue to apply.

## Automated publication summaries

AI-generated summaries are drafts. They remain excluded from public pages and page metadata until they have been checked against the paper or another documented source, the supporting source has been recorded, and a reviewer changes the publication frontmatter to `source-checked` or `approved`. After review, only the first English sentence of `mainFindings` is used as the public brief note; the longer summary, evidence fields, and source list remain internal.
