#!/usr/bin/env python3
"""Create Astro publication Markdown from a DOI or the legacy JSON inventory.

The legacy-import path is deliberately offline: it parses the citation strings
already reviewed on the former site. The DOI path uses Crossref for a new paper
and can optionally store an OpenAI-generated summary as an explicitly labelled
draft for human review.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = ROOT / "src" / "content" / "publications"
PI_NAME = "Seongryong Kim"
AREA_SLUGS = (
    "geodynamics-structure",
    "seismological-methods",
    "earthquake-properties",
    "earthquake-engineering",
    "environmental-seismology",
)
AREA_SLUG_SET = set(AREA_SLUGS)

# Used only when the people collection is not yet available (for example,
# during the one-time legacy import). Future DOI additions read the current and
# alumni names from src/content/people before consulting this fallback.
LEGACY_MENTEE_NAMES = {
    "Hyun Jae Yoo",
    "Dabeen Heo",
    "Inho Kim",
    "Dong Hun Lee",
    "Young-Jun Jeon",
    "Minkyeong Kim",
    "Kyeongjun Jo",
    "Sujin Lee",
    "Jaeyeon Kim",
    "Bosung Suh",
    "Seung Jun Oh",
    "Junseop Lee",
    "Jongwon Han",
    "Yeonjoo Lim",
    "Hayoung Park",
    "Jiyeon Lee",
    "Sigit Ariwibowo",
}

# These profiles are collaborators or senior research staff rather than
# student/alumni mentees. The keys are Markdown file stems.
NON_MENTEE_PROFILE_IDS = {
    "seongryong-kim",
    "hyun-jae-yoo",
    "dabeen-heo",
}

JOURNALS = (
    "Nature Communications",
    "Bulletin of Earthquake Engineering",
    "Seismological Research Letters",
    "Geophysical Journal International",
    "IEEE Geoscience and Remote Sensing Letters",
    "Frontiers in Earth Science",
    "Tectonophysics",
    "Bulletin of the Seismological Society of America",
    "Journal of Geophysical Research: Solid Earth",
    "Journal of the Earthquake Engineering Society of Korea",
    "Journal of the Geological Society of Korea",
    "Gondwana Research",
    "Journal of Seismology",
    "Pure and Applied Geophysics",
    "Earth and Planetary Science Letters",
    "Geophysical Research Letters",
    "South African Journal of Geology",
    "Geosciences Journal",
)

SUMMARY_FIELDS = (
    "summary_en",
    "summary_ko",
    "research_question",
    "data_and_region",
    "methods",
    "main_findings",
    "limitations",
    "source_basis",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_doi(raw: str) -> str:
    value = raw.strip()
    value = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", value, flags=re.I)
    value = re.sub(r"^doi:\s*", "", value, flags=re.I)
    if not value.startswith("10.") or "/" not in value:
        raise ValueError(f"Invalid DOI: {raw!r}")
    return value.lower()


def plain_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def normalized_name(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).strip().lower()
    return re.sub(r"\s+", " ", value)


def request_json(url: str, *, headers: dict[str, str], data: dict | None = None) -> dict:
    encoded = None if data is None else json.dumps(data, ensure_ascii=False).encode("utf-8")
    request = Request(url, data=encoded, headers=headers, method="POST" if data is not None else "GET")
    try:
        with urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"HTTP {error.code} from {url}: {detail}") from error
    except URLError as error:
        raise RuntimeError(f"Could not reach {url}: {error.reason}") from error


def crossref_metadata(doi: str, mailto: str) -> dict:
    user_agent = "KoreaUniversitySeismologyLabSite/1.0"
    if mailto:
        user_agent += f" (mailto:{mailto})"
    payload = request_json(
        f"https://api.crossref.org/works/{quote(doi, safe='')}",
        headers={"Accept": "application/json", "User-Agent": user_agent},
    )
    message = payload.get("message")
    if not isinstance(message, dict):
        raise RuntimeError("Crossref did not return a work record")
    return message


def first_text(metadata: dict, key: str) -> str:
    value = metadata.get(key, [])
    if isinstance(value, list) and value:
        return plain_text(str(value[0]))
    return plain_text(str(value)) if value else ""


def publication_year(metadata: dict) -> int:
    for key in ("published-print", "published-online", "published", "issued"):
        item = metadata.get(key)
        parts = item.get("date-parts", []) if isinstance(item, dict) else []
        if parts and parts[0]:
            return int(parts[0][0])
    raise RuntimeError("Crossref record has no publication year")


def validate_publication_date(value: str) -> str:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("Publication date must use YYYY-MM-DD")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"Invalid publication date: {value}") from error
    if parsed.isoformat() != value:
        raise ValueError(f"Invalid publication date: {value}")
    return value


def publication_date_from_crossref(metadata: dict) -> str | None:
    """Return an exact publication date, never a partial or deposit date."""
    for key in ("published", "published-online", "published-print", "issued"):
        item = metadata.get(key)
        parts = item.get("date-parts", []) if isinstance(item, dict) else []
        if not parts or not isinstance(parts[0], list) or len(parts[0]) != 3:
            continue
        year, month, day = (int(part) for part in parts[0])
        return validate_publication_date(f"{year:04d}-{month:02d}-{day:02d}")
    return None


def authors_from_crossref(metadata: dict) -> list[str]:
    authors: list[str] = []
    for author in metadata.get("author", []):
        if not isinstance(author, dict):
            continue
        name = " ".join(part for part in (author.get("given", ""), author.get("family", "")) if part).strip()
        if name:
            authors.append(name)
    if not authors:
        raise RuntimeError("Crossref record has no named authors")
    return authors


def citation_authors_from_display(authors: list[str]) -> list[dict[str, str]]:
    """Create explicit given/family fields for reviewed legacy display names."""
    structured: list[dict[str, str]] = []
    for name in authors:
        parts = name.split()
        if not parts:
            raise ValueError("Citation author names cannot be empty")
        structured.append({"given": " ".join(parts[:-1]), "family": parts[-1]})
    return structured


def citation_authors_from_crossref(metadata: dict, authors: list[str]) -> list[dict[str, str]]:
    """Retain Crossref's explicit given/family split for citation formatting."""
    structured: list[dict[str, str]] = []
    for author in metadata.get("author", []):
        if not isinstance(author, dict):
            continue
        given = plain_text(str(author.get("given", "")))
        family = plain_text(str(author.get("family", "")))
        if not family:
            continue
        item = {"given": given, "family": family}
        orcid = str(author.get("ORCID", "")).strip()
        if orcid:
            item["orcid"] = re.sub(r"^http://", "https://", orcid)
        structured.append(item)
    if len(structured) != len(authors):
        return citation_authors_from_display(authors)
    return structured


def bibliographic_fields_from_crossref(metadata: dict) -> dict[str, str]:
    fields: dict[str, str] = {}
    volume = plain_text(str(metadata.get("volume", "")))
    issue = plain_text(str(metadata.get("issue", "")))
    locator = plain_text(str(metadata.get("page") or metadata.get("article-number") or ""))
    if volume:
        fields["volume"] = volume
    if issue:
        fields["issue"] = issue
    if locator:
        fields["locator"] = locator
    return fields


def display_authors(authors: list[str]) -> str:
    if len(authors) == 1:
        return authors[0]
    if len(authors) == 2:
        return f"{authors[0]}, and {authors[1]}"
    return f"{', '.join(authors[:-1])}, and {authors[-1]}"


def citation_from_crossref(metadata: dict, doi: str, year: int, authors: list[str]) -> str:
    title = first_text(metadata, "title") or "Untitled"
    journal = first_text(metadata, "container-title")
    bibliographic: list[str] = []
    volume = plain_text(str(metadata.get("volume", "")))
    issue = plain_text(str(metadata.get("issue", "")))
    pages = plain_text(str(metadata.get("page") or metadata.get("article-number") or ""))
    if volume:
        bibliographic.append(f"{volume}({issue})" if issue else volume)
    if pages:
        bibliographic.append(pages)
    tail = ", ".join(part for part in (journal, *bibliographic) if part)
    if tail:
        tail = f", {tail}"
    return f"{display_authors(authors)} ({year}), {title}{tail}, doi: https://doi.org/{doi}."


def split_authors(value: str) -> list[str]:
    normalized = value.replace(", and ", ", ")
    authors = [item.strip() for item in normalized.split(",") if item.strip()]
    if not authors:
        raise ValueError(f"Could not parse authors from {value!r}")
    return authors


def parse_legacy_citation(item: dict) -> dict:
    citation = str(item["citation"]).strip()
    match = re.match(r"^(.*?) \((\d{4})\), (.*)$", citation)
    if not match:
        raise ValueError(f"Could not parse citation header: {citation}")
    authors = split_authors(match.group(1))
    year = int(match.group(2))
    if year != int(item["year"]):
        raise ValueError(f"Year mismatch for {item['id']}: {year} != {item['year']}")

    remainder = match.group(3)
    status = "in-preparation" if item.get("status") == "in_preparation" else "published"
    if status == "in-preparation":
        suffix = ", in prep."
        if not remainder.endswith(suffix):
            raise ValueError(f"Unexpected in-preparation citation: {citation}")
        title = remainder[: -len(suffix)]
        journal = "In preparation"
    else:
        marker = ", doi:"
        if marker not in remainder:
            raise ValueError(f"Published citation has no DOI marker: {citation}")
        title_and_bibliography = remainder.split(marker, 1)[0]
        matches = [journal for journal in JOURNALS if f", {journal}" in title_and_bibliography]
        if len(matches) != 1:
            raise ValueError(f"Could not identify one journal for {item['id']}: {matches}")
        journal = matches[0]
        separator = f", {journal}"
        title, bibliography = title_and_bibliography.rsplit(separator, 1)

    doi = item.get("doi")
    if doi:
        cited = re.search(r"doi:\s*https?://doi\.org/([^\s]+)", citation, flags=re.I)
        if not cited:
            raise ValueError(f"Citation DOI is missing for {item['id']}")
        cited_doi = cited.group(1).rstrip(".")
        if normalize_doi(cited_doi) != normalize_doi(str(doi)):
            raise ValueError(f"DOI mismatch for {item['id']}: {cited_doi} != {doi}")

    record = publication_record(
        title=title,
        authors=authors,
        year=year,
        publication_date=item.get("publicationDate"),
        journal=journal,
        doi=str(doi) if doi else None,
        open_access=bool(item.get("open_access")),
        status=status,
        full_citation=citation,
    )
    if status == "published":
        record["citationAuthors"] = citation_authors_from_display(authors)
        tail = bibliography.lstrip(", ")
        standard = re.fullmatch(r"(\d+)(?:\(([^)]+)\))?,\s*(.+)", tail)
        colon = re.fullmatch(r"(\d+):(.+)", tail)
        if standard:
            record["volume"] = standard.group(1)
            if standard.group(2):
                record["issue"] = standard.group(2)
            record["locator"] = standard.group(3)
        elif colon:
            record["volume"] = colon.group(1)
            record["locator"] = colon.group(2)
    return record


def classify_areas(title: str) -> list[str]:
    text = title.lower()
    areas: list[str] = []

    def contains(*terms: str) -> bool:
        return any(term in text for term in terms)

    if contains("groundwater", "hydrolog", "environmental"):
        areas.append("environmental-seismology")
    if contains(
        "crust", "mantle", "lithosph", "slab", "volcan", "magma", "cratonic",
        "rift", "velocity structure", "tomography", "receiver function", "plate",
    ):
        areas.append("geodynamics-structure")
    if contains(
        "deep learning", "neural network", "generative model", "bayesian", "inversion",
        "phase picking", "polarity determination", "receiver function", "waveform modelling",
        "waveform simulation", "moment tensor", "eikonal tomography", "tomography",
        "ppsd", "catalog", "determination",
    ):
        areas.append("seismological-methods")
    if contains(
        "earthquake", "seismicity", "rupture", "fault", "aftershock", "source mechanism",
        "moment tensor", "seismic event", "nuclear test", "first-motion polarity",
    ):
        areas.append("earthquake-properties")
    if contains(
        "site class", "ground motion", "intensity", "shallow s-wave", "basin structure",
        "wave propagation", "accelerometer station", "surface wave survey",
    ):
        areas.append("earthquake-engineering")

    # A method-only record should not be left without a scientific grouping,
    # but no speculative topic tag is added when the title does not support it.
    if not areas:
        areas.append("seismological-methods")
    return [slug for slug in AREA_SLUGS if slug in areas]


def _frontmatter_scalar(text: str, key: str) -> str | None:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+)$", text)
    if not match:
        return None
    raw = match.group(1).strip()
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        value = raw.strip("\"'")
    return value if isinstance(value, str) else None


def _frontmatter_string_array(text: str, key: str) -> list[str] | None:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(\[[^\n]*\])\s*$", text)
    if not match:
        return None
    try:
        value = json.loads(match.group(1))
    except json.JSONDecodeError as error:
        raise ValueError(f"{key} must be a one-line JSON-style YAML array") from error
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError(f"{key} must contain only strings")
    return value


def mentee_publication_names() -> set[str]:
    people_dir = ROOT / "src" / "content" / "people"
    paths = sorted(people_dir.glob("*.md"))
    if not paths:
        return set(LEGACY_MENTEE_NAMES)

    names: set[str] = set()
    for path in paths:
        if path.stem in NON_MENTEE_PROFILE_IDS:
            continue
        text = path.read_text(encoding="utf-8")
        status = _frontmatter_scalar(text, "status")
        name = _frontmatter_scalar(text, "name")
        if status not in {"current", "alumni"} or not name:
            continue
        publication_names = _frontmatter_string_array(text, "publicationNames")
        if publication_names is None:
            publication_names = [name.split(",")[0].strip()]
        names.update(publication_names)
    return names


def author_flags(authors: list[str]) -> dict[str, bool]:
    pi_key = normalized_name(PI_NAME)
    mentee_keys = {normalized_name(name) for name in mentee_publication_names()} - {pi_key}
    author_keys = [normalized_name(author) for author in authors]
    return {
        "isMenteePaper": any(key in mentee_keys for key in author_keys),
        "menteeFirstAuthor": bool(author_keys and author_keys[0] in mentee_keys),
        "piFirstOrSenior": bool(author_keys and (author_keys[0] == pi_key or author_keys[-1] == pi_key)),
        # Corresponding authorship must be entered from an explicit source.
        "piCorresponding": False,
    }


def publication_record(
    *,
    title: str,
    authors: list[str],
    year: int,
    publication_date: str | None,
    journal: str,
    doi: str | None,
    open_access: bool,
    status: str,
    full_citation: str,
    areas: list[str] | None = None,
) -> dict:
    record: dict = {
        "title": title,
        "authors": authors,
        "year": year,
        "journal": journal,
        "openAccess": open_access,
        "status": status,
        "fullCitation": full_citation,
        "areas": areas if areas is not None else classify_areas(title),
    }
    if status == "published":
        if not publication_date:
            raise ValueError("Published records require an exact publicationDate (YYYY-MM-DD)")
        record["publicationDate"] = validate_publication_date(publication_date)
    elif publication_date:
        raise ValueError("In-preparation records must not include publicationDate")
    if doi:
        normalize_doi(doi)  # validate while retaining the source's DOI spelling
        record["doi"] = doi
    record.update(author_flags(authors))
    return record


def summary_schema() -> dict:
    properties = {
        "summary_en": {"type": "string", "description": "A concise English summary."},
        "summary_ko": {"type": "string", "description": "A concise Korean summary."},
        "research_question": {"type": "string"},
        "data_and_region": {"type": "string"},
        "methods": {"type": "string"},
        "main_findings": {
            "type": "string",
            "description": (
                "One neutral English sentence, no more than 30 words, stating the principal "
                "source-supported result."
            ),
        },
        "limitations": {"type": "string"},
        "source_basis": {
            "type": "string",
            "enum": ["crossref_abstract", "author_notes", "crossref_abstract_and_author_notes"],
        },
    }
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }


def extract_response_text(response: dict) -> str:
    chunks: list[str] = []
    refusals: list[str] = []
    for item in response.get("output", []):
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            if content.get("type") == "output_text" and content.get("text"):
                chunks.append(content["text"])
            elif content.get("type") == "refusal" and content.get("refusal"):
                refusals.append(content["refusal"])
    if refusals:
        raise RuntimeError(f"OpenAI refused the summary request: {' '.join(refusals)}")
    if not chunks:
        reason = response.get("incomplete_details") or response.get("status") or "unknown response state"
        raise RuntimeError(f"OpenAI returned no output text: {reason}")
    return "".join(chunks)


def ai_summary(*, model: str, api_key: str, title: str, abstract: str, author_notes: str) -> dict:
    if abstract and author_notes:
        basis = "crossref_abstract_and_author_notes"
    elif abstract:
        basis = "crossref_abstract"
    else:
        basis = "author_notes"
    source = [f"TITLE\n{title}"]
    if abstract:
        source.append(f"CROSSREF ABSTRACT\n{abstract}")
    if author_notes:
        source.append(f"AUTHOR NOTES\n{author_notes}")
    request = {
        "model": model,
        "store": False,
        "instructions": (
            "Prepare a factual research-group publication summary using only the supplied text. "
            "Do not infer unstated sample sizes, locations, methods, results, causality, novelty, "
            "or limitations. For a missing English field write 'Not stated in the supplied source.' "
            "For a missing Korean field write '제공된 자료에 명시되지 않음.' Use precise, neutral "
            "academic language. Write main_findings as one neutral English sentence of no more "
            "than 30 words that states the principal source-supported result. The response must "
            "follow the supplied JSON schema."
        ),
        "input": "\n\n".join(source),
        "max_output_tokens": 2200,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "publication_summary",
                "strict": True,
                "schema": summary_schema(),
            }
        },
    }
    response = request_json(
        "https://api.openai.com/v1/responses",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "KoreaUniversitySeismologyLabSite/1.0",
        },
        data=request,
    )
    result = json.loads(extract_response_text(response))
    for field in SUMMARY_FIELDS:
        if not isinstance(result.get(field), str) or not result[field].strip():
            raise RuntimeError(f"OpenAI structured output is missing {field!r}")
        result[field] = result[field].strip()
    result["source_basis"] = basis
    return result


def summary_frontmatter(summary: dict, model: str) -> dict:
    return {
        "summaryEn": summary["summary_en"],
        "summaryKo": summary["summary_ko"],
        "researchQuestion": summary["research_question"],
        "dataAndRegion": summary["data_and_region"],
        "methods": summary["methods"],
        "mainFindings": summary["main_findings"],
        "limitations": summary["limitations"],
        "summarySourceBasis": summary["source_basis"],
        "summaryStatus": "draft",
        "aiModel": model,
        "aiGeneratedAt": utc_now(),
    }


def summary_body(record: dict) -> str:
    if record.get("summaryStatus") != "draft":
        return ""
    return "\n".join(
        (
            "## AI-generated summary draft",
            "",
            "> Review status: draft. Verify this text against the paper before publication.",
            "",
            "### English summary",
            "",
            record["summaryEn"],
            "",
            "### 한국어 요약",
            "",
            record["summaryKo"],
            "",
            "### Evidence fields",
            "",
            f"- Research question: {record['researchQuestion']}",
            f"- Data and region: {record['dataAndRegion']}",
            f"- Methods: {record['methods']}",
            f"- Main findings: {record['mainFindings']}",
            f"- Limitations: {record['limitations']}",
        )
    )


def yaml_value(value: object) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return json.dumps(value, ensure_ascii=False)


def markdown_text(record: dict) -> str:
    preferred_order = (
        "title",
        "authors",
        "citationAuthors",
        "year",
        "publicationDate",
        "journal",
        "volume",
        "issue",
        "locator",
        "doi",
        "sourceUrl",
        "openAccess",
        "status",
        "fullCitation",
        "areas",
        "isMenteePaper",
        "menteeFirstAuthor",
        "piFirstOrSenior",
        "piCorresponding",
        "piCorrespondingSource",
        "summaryEn",
        "summaryKo",
        "researchQuestion",
        "dataAndRegion",
        "methods",
        "mainFindings",
        "limitations",
        "summarySourceBasis",
        "summaryStatus",
        "aiModel",
        "aiGeneratedAt",
    )
    lines = ["---"]
    lines.extend(f"{key}: {yaml_value(record[key])}" for key in preferred_order if key in record)
    lines.extend(("---", ""))
    body = summary_body(record)
    if body:
        lines.extend((body, ""))
    return "\n".join(lines)


def filename_for(*, doi: str | None, record_id: str | None = None) -> str:
    source = doi or record_id or "publication"
    return re.sub(r"[^a-z0-9]+", "-", source.lower()).strip("-") + ".md"


def write_record(
    record: dict,
    output_dir: Path,
    *,
    record_id: str | None = None,
    overwrite: bool = False,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / filename_for(doi=record.get("doi"), record_id=record_id)
    if path.exists() and not overwrite:
        raise ValueError(f"Publication file already exists: {path}")
    path.write_text(markdown_text(record), encoding="utf-8")
    return path


def import_legacy(path: Path, output_dir: Path, *, overwrite: bool = False) -> list[Path]:
    records = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError(f"Legacy publication inventory is not an array: {path}")
    created: list[Path] = []
    for item in records:
        if not isinstance(item, dict):
            raise ValueError("Legacy publication entry is not an object")
        record = parse_legacy_citation(item)
        created.append(
            write_record(
                record,
                output_dir,
                record_id=str(item.get("id", "publication")),
                overwrite=overwrite,
            )
        )
    return created


def parse_areas(raw: str, title: str) -> list[str]:
    if not raw.strip():
        return classify_areas(title)
    values = [item.strip() for item in raw.split(",") if item.strip()]
    invalid = sorted(set(values) - AREA_SLUG_SET)
    if invalid:
        raise ValueError(f"Unsupported area slug(s): {', '.join(invalid)}")
    return list(dict.fromkeys(values))


def record_from_crossref(args: argparse.Namespace) -> dict:
    doi = normalize_doi(args.doi)
    metadata = crossref_metadata(doi, os.environ.get("CROSSREF_MAILTO", "").strip())
    year = publication_year(metadata)
    publication_date = args.publication_date or publication_date_from_crossref(metadata)
    if not publication_date:
        raise RuntimeError(
            "Crossref does not provide a complete publication date; verify the publisher page "
            "and rerun with --publication-date YYYY-MM-DD"
        )
    publication_date = validate_publication_date(publication_date)
    authors = authors_from_crossref(metadata)
    title = first_text(metadata, "title") or "Untitled"
    journal = first_text(metadata, "container-title") or ""
    record = publication_record(
        title=title,
        authors=authors,
        year=year,
        publication_date=publication_date,
        journal=journal,
        doi=doi,
        open_access=args.open_access,
        status="published",
        full_citation=citation_from_crossref(metadata, doi, year, authors),
        areas=parse_areas(args.areas, title),
    )
    record["citationAuthors"] = citation_authors_from_crossref(metadata, authors)
    record.update(bibliographic_fields_from_crossref(metadata))
    resource = metadata.get("resource")
    primary = resource.get("primary") if isinstance(resource, dict) else None
    source_url = primary.get("URL") if isinstance(primary, dict) else None
    if not source_url:
        source_url = metadata.get("URL")
    if isinstance(source_url, str) and source_url.startswith(("https://", "http://")):
        record["sourceUrl"] = source_url

    abstract = plain_text(str(metadata.get("abstract", "")))
    author_notes = os.environ.get("AUTHOR_NOTES", "").strip()
    model = os.environ.get("OPENAI_MODEL", "").strip()
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not args.skip_ai and (abstract or author_notes) and api_key and model:
        summary = ai_summary(
            model=model,
            api_key=api_key,
            title=title,
            abstract=abstract,
            author_notes=author_notes,
        )
        record.update(summary_frontmatter(summary, model))
        print(f"Added Crossref metadata and an AI summary draft for {doi}")
    else:
        reasons: list[str] = []
        if args.skip_ai:
            reasons.append("--skip-ai was set")
        if not (abstract or author_notes):
            reasons.append("no abstract or author notes were supplied")
        if not api_key:
            reasons.append("OPENAI_API_KEY is unset")
        if not model:
            reasons.append("OPENAI_MODEL is unset")
        print(f"Added Crossref metadata for {doi}; AI summary skipped ({'; '.join(reasons)})")
    return record


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--doi", help="DOI or https://doi.org URL for a new publication")
    source.add_argument("--import-json", type=Path, help="Offline import of the legacy publications JSON")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--open-access", action="store_true")
    parser.add_argument(
        "--publication-date",
        help="Verified publication date (YYYY-MM-DD) when Crossref provides only a year or month",
    )
    parser.add_argument("--areas", default="", help="Comma-separated research-area slugs")
    parser.add_argument("--skip-ai", action="store_true", help="Do not request a summary")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace matching files during an explicit legacy re-import",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.import_json:
        created = import_legacy(args.import_json, args.output_dir, overwrite=args.overwrite)
        print(f"Imported {len(created)} publications from {args.import_json}")
        return 0

    record = record_from_crossref(args)
    path = write_record(record, args.output_dir)
    print(f"Wrote {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError, json.JSONDecodeError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
