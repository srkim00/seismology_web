# Notices

## Template

This project is derived from `bchcohenlab/lab-website-template` by Alexander Li Cohen, using upstream commit `877ee317337e5b077414e59c45070b346f5dfa30` as the retained source snapshot. The upstream template is distributed under the MIT License retained in `LICENSE`.

## Laboratory content

Laboratory text, member photographs, publication records, and the 3D Gravity Forward Modeller were migrated from the public Korea University Seismology Laboratory website. Their inclusion in this repository does not, by itself, grant reuse rights beyond those held by the respective rights holders.

The publication dataset contains 45 records: 43 published papers and 2 works in preparation. The 43 published-paper records include verified DOI metadata, source-checked summaries, evidence fields, source lists, and figure records. The longer summaries, evidence fields, and source lists are retained as internal editorial data and are not rendered publicly. Each published-paper detail page presents a representative figure or publisher figure link, the first English sentence of source-checked `mainFindings` (no more than 30 words), and the citation. Sixteen published records are marked `PI corresponding` from explicit corresponding-author labels on the former laboratory website; this status is not inferred solely from author order. The borehole ground-motion manuscript's author order, name spellings, and PI corresponding-author designation were supplied with its title page by the PI on 25 October 2026. Exact profile emails establish its author-to-person links. Work-in-preparation pages have no representative figure, public brief note, DOI, exact publication date, published-paper number, or citation-copy control.

Nineteen figures are included locally: 13 under CC BY 4.0, 5 unmodified originals under CC BY-NC-ND 4.0, and the author-provided RPNet Figure 1. The CC BY-NC-ND 4.0 figures are presented for non-commercial use without modification; their source attribution and license notice must remain with the figures. The RPNet image is provided only for display on this laboratory website and is not licensed for reuse. The remaining 24 figure records link to article or publisher pages and do not copy the figure into this repository. The project license does not relicense publication text, metadata, or figures.

The PI curriculum vitae at `public/cv/Seongryong-Kim-CV.pdf` is provided for personal academic reference and is not covered by the template's MIT License.

The Research page also displays the existing representative figures and brief notes alongside each paper's bibliographic and author information. This layout reuses the same local images, source links, attribution, reuse notices, and reviewed brief text as the publication records. Figures are fitted to compact frames without cropping, recoloring, or filtering; linked-only figure records remain links to the publisher rather than copied images. Draft summaries are not displayed.

The public people dataset contains 22 laboratory profiles, including 7 profiles with verified ORCID identifiers. Names, publication aliases, and identifiers are connected only when supported by explicit evidence. Similar names are not assumed to represent the same person. The non-laboratory mathematics faculty member named Donghun Lee is not included as a laboratory profile, and his publication author name is not assigned to KIGAM-affiliated Dong Hun Lee. Internal identifier-review status, dates, notes, and evidence sources are retained in the content records but are not rendered on public people pages. Publication author markers do not distinguish current from former members; a profile without a photograph is shown with initials only.

## Additional member photographs

The following portraits were obtained from public person-level pages on 16 October 2026 after matching the person's academic history or institutional affiliation to the laboratory record. Original files are retained locally and displayed with the site's existing image sizing and circular framing. Exact source-image URLs and check dates are retained in each profile's internal `headshotSource` field.

| Local asset | Source |
| --- | --- |
| `src/assets/people/jongwon-han.jpg` | [Jongwon Han's personal academic website](https://www.jongwon-han.com/) |
| `src/assets/people/sigit-ariwibowo.jpg` | [POSCO TJ Park Foundation fellowship directory, 2023 cohort](https://www.postf.org/en/asia/abroad/fellow?p=9) |
| `src/assets/people/satbyul-kim.png` | [Pukyong National University Geophysics Laboratory People page](https://geophysics.pknu.ac.kr/People.html) |
| `src/assets/people/sang-jun-lee.jpg` | [Korea National University of Education faculty profile](https://www.knue.ac.kr/www/selectProfInfoWebView.do?code=UNIV25&key=507&userNo=110054) |

No Creative Commons or other open reuse license was stated for these portraits on the checked pages. Copyright remains with the respective rights holders; inclusion does not relicense the photographs under the template's MIT License or grant permission for further reuse. Profiles for which no usable, identity-matched portrait was found retain initials; generic silhouettes and photographs of similarly named people were not substituted.

## Astronomical background imagery

Home, People, Research, Publications, Tools & Teaching, Contact, and the related person and publication detail pages use spacecraft observations and an optical sky panorama, not AI-generated astronomical images:

- `public/backgrounds/earth-dscovr-epic.webp`: NASA/NOAA DSCOVR EPIC natural-color image `epic_1b_20150706051132`, from [6 July 2015](https://epic.gsfc.nasa.gov/?date=2015-07-06). The observation metadata gives 05:01:32 UTC and a disk center of 19.108887 degrees N, 112.668457 degrees E. [Source PNG](https://epic.gsfc.nasa.gov/archive/natural/2015/07/06/png/epic_1b_20150706051132.png). The color image combines successive filter exposures of the observed Earth disk; it is not a rendered globe.
- `public/backgrounds/moon-lro.webp`: [Nearside Spectacular, PIA14011](https://science.nasa.gov/photojournal/nearside-spectacular/), credit NASA/GSFC/Arizona State University. This is an observation mosaic of approximately 1,300 LRO Wide Angle Camera images acquired in December 2010.
- `public/backgrounds/mars-viking.webp`: [Mars Planet Globe](https://science.nasa.gov/resource/mars-planet-globe/), credit NASA/JPL-Caltech. This perspective-projected observation mosaic contains 102 Viking Orbiter images and shows Valles Marineris and Tharsis.
- `public/backgrounds/milky-way-eso.webp`: [The Milky Way panorama, eso0932a](https://www.eso.org/public/images/eso0932a/), credit ESO/S. Brunier, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and the [ESO usage conditions](https://www.eso.org/public/outreach/copyright/). This is an optical all-sky photographic panorama. The 6000-by-3000-pixel source is resized to 1920 by 960 pixels and converted to WebP. CSS applies viewport cropping, rotation, blur, saturation, and brightness adjustments, placing it behind the three Solar System bodies as the faintest image layer. A visible, linked credit and adaptation notice appear in the footer of every page using the background.

The files are resized WebP derivatives. A shared component places each image once in a fixed layer behind each applicable page. Front to back, the opaque layers are Earth, Moon, Mars, and Milky Way. Normal compositing and disk-shaped clipping prevent background images from showing through a foreground body; brightness filters replace the previous transparency-based dimming. The source files, celestial-body positions and scales, blur, and saturation settings are retained. The Milky Way has additional uniform enlargement and brightness adjustment to make its band distinguishable; lateral cropping is intentional and does not stretch the image. Earth's clipping radius excludes the source photograph's dark outer fringe. Home preserves the clearer hero and darkens the lower content. All other content pages use a darker veil above all four image layers and greater image blur for reading; person photographs, publication figures, text, and embedded tools are not blurred. The standalone gravity tool and 404 page retain their previous backgrounds. Research-area panels and tags share a consistent five-color palette. The relative sizes and positions are a page composition, not an astronomical scale diagram. Source credits are retained here in accordance with [NASA image and media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/); the template's MIT License does not relicense these images or imply NASA endorsement.

## Observed waveform

The Home hero trace is derived from the 2011 Tohoku-Oki earthquake record `IU.INCN.00.BHZ`, acquired for 05:45–06:30 UTC on 11 March 2011 through the NSF NGF/EarthScope FDSN data service. The source contains 54,000 vertical-component samples at 20 Hz in raw instrument counts. For the display path, the full-record mean was removed, a 2.5% cosine taper was applied at each edge to close the visual loop, the series was reduced with a 760-bin min–max envelope, and the display amplitude was normalized. These operations produce a background visualization and do not convert the record to physical ground-motion units.

Credit the Global Seismographic Network (`IU`, DOI [`10.7914/SN/IU`](https://doi.org/10.7914/SN/IU)) and NSF NGF/EarthScope when reusing the waveform-derived display. The generated path and source metadata are in `src/data/tohokuWaveform.ts`. The MIT License for the template code does not relicense the underlying waveform data.

## Korea University mark

`public/brand/korea-university-global-symbol-crimson-negative.gif` is the unmodified Crimson 2-color Negative Global Symbol distributed through the [official Korea University symbol page](https://www.korea.ac.kr/ko/372/subview.do) and its basic UI archive. It is used only as an institutional identifier in the Footer. The mark is not covered by the template's MIT License; Korea University's identity and trademark conditions continue to apply.

## Automated publication summaries

AI-generated summaries are drafts. They remain excluded from public pages and page metadata until they have been checked against the paper or another documented source, the supporting source has been recorded, and a reviewer changes the publication frontmatter to `source-checked` or `approved`. After review, only the first English sentence of `mainFindings` is used as the public brief note; the longer summary, evidence fields, and source list remain internal.
