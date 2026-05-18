import io
from app.extensions import db
from app.models.tactic import Tactic
from app.models.ttp import TTP

_DEFAULT_TACTICS_URL = (
    "https://github.com/CyberCX-STA/PurpleOps-Deps/raw/master/attack.mitre/15.1"
    "/enterprise-attack-v15.1-tactics.xlsx"
)
_DEFAULT_TECHNIQUES_URL = (
    "https://github.com/CyberCX-STA/PurpleOps-Deps/raw/master/attack.mitre/15.1"
    "/enterprise-attack-v15.1-techniques.xlsx"
)


def _get_url(component: str) -> str:
    from app.models.app_setting import AppSetting
    key = "mitre_tactics_url" if component == "tactics" else "mitre_techniques_url"
    default = _DEFAULT_TACTICS_URL if component == "tactics" else _DEFAULT_TECHNIQUES_URL
    return AppSetting.get(key, default) or default


def _download_workbook(component):
    import requests
    from openpyxl import load_workbook
    url = _get_url(component)
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    wb = load_workbook(io.BytesIO(resp.content), read_only=True)
    ws = wb.active
    rows = list(ws.rows)
    headers = [cell.value for cell in rows[0]]
    return rows[1:], headers


def _get(row, headers, col_name, default=""):
    try:
        idx = headers.index(col_name)
        val = row[idx].value
        return val if val is not None else default
    except (ValueError, IndexError):
        return default


def refresh_tactics():
    rows, headers = _download_workbook("tactics")
    count = 0
    for row in rows:
        mitre_id = _get(row, headers, "ID")
        name = _get(row, headers, "name")
        if not mitre_id or not name:
            continue
        tactic = Tactic.query.filter_by(mitre_id=mitre_id).first()
        if tactic:
            tactic.name = name
        else:
            tactic = Tactic(mitre_id=mitre_id, name=name)
            db.session.add(tactic)
        count += 1
    db.session.commit()
    return count


def refresh_techniques():
    rows, headers = _download_workbook("techniques")

    # Build name → Tactic map for association lookup (case-insensitive)
    tactic_map = {t.name.strip().lower(): t for t in Tactic.query.all()}

    count = 0
    for row in rows:
        mitre_id = _get(row, headers, "ID")
        name = _get(row, headers, "name")
        if not mitre_id or not name:
            continue

        description = _get(row, headers, "description")
        tactics_str = _get(row, headers, "tactics")
        # MITRE Excel uses "platforms" (plural)
        platform_val = _get(row, headers, "platforms") or _get(row, headers, "platform")

        tactic_names = [t.strip() for t in tactics_str.split(",") if t.strip()]
        primary_tactic = tactic_names[0] if tactic_names else "Unknown"
        tactic_objs = [tactic_map[n.lower()] for n in tactic_names if n.lower() in tactic_map]

        ttp = TTP.query.filter_by(mitre_id=mitre_id).first()
        if ttp:
            ttp.name = name
            ttp.tactic = primary_tactic
            ttp.description = description
            ttp.platform = platform_val
        else:
            ttp = TTP(
                mitre_id=mitre_id,
                name=name,
                tactic=primary_tactic,
                description=description,
                platform=platform_val,
            )
            db.session.add(ttp)
            db.session.flush()

        ttp.tactics = tactic_objs
        count += 1

    db.session.commit()
    return count


def refresh_all():
    tactics_count = refresh_tactics()
    techniques_count = refresh_techniques()
    return {"tactics_updated": tactics_count, "techniques_updated": techniques_count}
