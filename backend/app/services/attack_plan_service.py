import json
import re
import io

import requests
from bs4 import BeautifulSoup

from app.extensions import db
from app.models.ttp import TTP
from app.models.exercise import Exercise
from app.models.exercise_entry import ExerciseEntry
from app.models.llm_config import LLMConfig


# ── text extraction ────────────────────────────────────────────────────────────

def extract_text_from_url(url: str) -> str:
    resp = requests.get(url, timeout=30, headers={"User-Agent": "TTPForge/1.0"})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.content, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())


def extract_text_from_pdf_bytes(data: bytes) -> str:
    from pdfminer.high_level import extract_text_to_fp
    from pdfminer.layout import LAParams
    buf = io.StringIO()
    extract_text_to_fp(io.BytesIO(data), buf, laparams=LAParams())
    return buf.getvalue()


# ── LLM dispatch ──────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a cyber threat intelligence analyst specialising in MITRE ATT&CK. "
    "Given a threat report, extract every MITRE ATT&CK technique and sub-technique mentioned "
    "or clearly implied. Return ONLY valid JSON — an object with a single key 'ttps' whose value "
    "is an array of objects, each with keys: "
    "\"mitre_id\" (e.g. T1059 or T1059.001), \"name\", \"tactic\", \"justification\". "
    "Do not include any text outside the JSON object."
)


def _call_anthropic(text: str, cfg: LLMConfig) -> list[dict]:
    import anthropic
    import logging
    client = anthropic.Anthropic(api_key=cfg.api_key)
    msg = client.messages.create(
        model=cfg.model,
        max_tokens=cfg.max_tokens,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text[:50000]}],
    )
    if msg.stop_reason == "max_tokens":
        logging.warning("Anthropic response hit max_tokens (%d) — JSON may be truncated; attempting recovery.", cfg.max_tokens)
    raw = msg.content[0].text
    return _parse_json(raw)


def _call_openai_compat(text: str, cfg: LLMConfig) -> list[dict]:
    from openai import OpenAI
    kwargs = {"api_key": cfg.api_key or "ollama"}
    if cfg.base_url:
        kwargs["base_url"] = cfg.base_url
    client = OpenAI(**kwargs)
    resp = client.chat.completions.create(
        model=cfg.model,
        max_tokens=cfg.max_tokens,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": text[:50000]},
        ],
    )
    raw = resp.choices[0].message.content
    return _parse_json(raw)


def _parse_json(raw: str) -> list[dict]:
    """Parse LLM JSON output with recovery for truncated responses."""
    raw = re.sub(r"```(?:json)?", "", raw).strip()

    # Fast path: well-formed JSON
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        return data.get("ttps", [])
    except json.JSONDecodeError:
        pass

    # Recovery: the response was cut off at max_tokens.
    # Walk backwards from the end of the string, find each '}', and try to
    # close the structure with a suffix so that json.loads succeeds.
    cursor = len(raw)
    while cursor > 0:
        idx = raw.rfind("}", 0, cursor)
        if idx == -1:
            break
        fragment = raw[: idx + 1]
        for suffix in ("]}",  "]", "}}", ""):
            try:
                data = json.loads(fragment + suffix)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict):
                    return data.get("ttps", [])
            except json.JSONDecodeError:
                pass
        cursor = idx  # try the next '}' further back

    return []


def call_llm(text: str, cfg: LLMConfig) -> list[dict]:
    if cfg.provider == "anthropic":
        return _call_anthropic(text, cfg)
    return _call_openai_compat(text, cfg)


# ── library enrichment ────────────────────────────────────────────────────────

def enrich_with_library(extracted: list[dict]) -> list[dict]:
    """Merge LLM extraction with local TTP library rows."""
    lib = {t.mitre_id: t for t in TTP.query.all()}
    enriched = []
    seen = set()
    for item in extracted:
        mid = item.get("mitre_id", "").upper()
        if mid in seen:
            continue
        seen.add(mid)
        ttp_row = lib.get(mid)
        enriched.append({
            "mitre_id":     mid,
            "name":         ttp_row.name if ttp_row else item.get("name", ""),
            "tactic":       ttp_row.tactic if ttp_row else item.get("tactic", ""),
            "justification": item.get("justification", ""),
            "in_library":   ttp_row is not None,
            "ttp_id":       ttp_row.id if ttp_row else None,
        })
    return enriched


# ── main analysis entry point ─────────────────────────────────────────────────

def analyze_report(source_type: str, content) -> dict:
    cfg = LLMConfig.query.filter_by(is_active=True).first()
    if not cfg:
        raise ValueError("No active LLM configuration found.")

    if source_type == "url":
        text = extract_text_from_url(content)
    elif source_type == "pdf":
        text = extract_text_from_pdf_bytes(content)
    else:
        text = content

    raw_ttps = call_llm(text, cfg)
    return {"ttps": enrich_with_library(raw_ttps)}


# ── convert plan to exercise ──────────────────────────────────────────────────

def create_exercise_from_plan(data: dict) -> Exercise:
    name        = data.get("name", "Untitled Exercise")
    description = data.get("description", "")
    ttps        = data.get("ttps", [])

    exercise = Exercise(name=name, description=description, status="planned")
    db.session.add(exercise)
    db.session.flush()

    lib = {t.mitre_id: t for t in TTP.query.all()}
    for i, item in enumerate(ttps):
        mid = item.get("mitre_id", "")
        ttp_row = lib.get(mid)
        if not ttp_row:
            continue
        entry = ExerciseEntry(
            exercise_id=exercise.id,
            ttp_id=ttp_row.id,
            attack_path_include=True,
            attack_path_step=i + 1,
            red_notes=item.get("justification", ""),
        )
        db.session.add(entry)

    db.session.commit()
    return exercise
