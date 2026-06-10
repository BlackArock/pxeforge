import httpx

from ..config import ARIA2_RPC_SECRET, ARIA2_RPC_URL, ISOS_DIR
from ..models import Download, ISOImage

ARIA2_DOWNLOAD_DIR = "/downloads"


def _aria2_rpc(method: str, params: list = None) -> dict:
    payload = {
        "jsonrpc": "2.0",
        "id": "pxeforge",
        "method": method,
        "params": [f"token:{ARIA2_RPC_SECRET}"] + (params or []),
    }
    r = httpx.post(ARIA2_RPC_URL, json=payload, timeout=10)
    r.raise_for_status()
    return r.json()


def start_download(db, url: str, filename: str) -> Download:
    download = Download(url=url, filename=filename, status="starting")
    db.add(download)
    db.commit()

    try:
        result = _aria2_rpc("aria2.addUri", [[url], {"dir": ARIA2_DOWNLOAD_DIR, "out": filename}])
        gid = result["result"]
        download.aria2_gid = gid
        download.status = "downloading"
        db.commit()
    except Exception as e:
        download.status = "error"
        download.error_message = str(e)
        db.commit()

    return download


def tell_aria2(gid: str) -> dict | None:
    try:
        result = _aria2_rpc("aria2.tellStatus", [gid])
        return result["result"]
    except Exception:
        return None


def enrich_download(dl: Download, db=None) -> dict:
    out = {
        "id": dl.id,
        "url": dl.url,
        "filename": dl.filename,
        "total_length": dl.total_length or 0,
        "completed_length": dl.completed_length or 0,
        "download_speed": 0,
        "upload_speed": 0,
        "num_peers": 0,
        "num_seeders": 0,
        "eta_seconds": None,
        "status": dl.status,
        "error_message": dl.error_message,
        "created_at": dl.created_at,
    }

    active = dl.status in ("downloading", "starting")
    if not active or not dl.aria2_gid:
        return out

    data = tell_aria2(dl.aria2_gid)
    if not data:
        return out

    out["total_length"] = int(data.get("totalLength", 0))
    out["completed_length"] = int(data.get("completedLength", 0))
    out["download_speed"] = int(data.get("downloadSpeed", 0))
    out["upload_speed"] = int(data.get("uploadSpeed", 0))
    out["num_peers"] = int(data.get("connections", 0))

    if "numSeeders" in data:
        out["num_seeders"] = int(data["numSeeders"])

    speed = out["download_speed"]
    remaining = out["total_length"] - out["completed_length"]
    if speed > 0 and remaining > 0:
        out["eta_seconds"] = remaining // speed

    aria_status = data.get("status")
    if aria_status == "complete":
        dl.status = "completed"
        if db:
            _register_iso(db, dl.filename)
    elif aria_status == "error":
        dl.status = "error"
        dl.error_message = data.get("errorMessage", dl.error_message or "Unknown error")
    elif aria_status == "removed":
        dl.status = "error"
        dl.error_message = "Download removed"

    dl.completed_length = out["completed_length"]
    dl.total_length = out["total_length"]

    return out


def poll_downloads(db):
    for dl in db.query(Download).filter(Download.status.in_(["downloading", "starting"])).all():
        if dl.aria2_gid:
            enrich_download(dl, db)
    db.commit()


def list_enriched_downloads(db):
    poll_downloads(db)
    return [enrich_download(dl) for dl in db.query(Download).order_by(Download.created_at.desc()).limit(50).all()]


def _register_iso(db, filename: str):
    filepath = ISOS_DIR / filename
    if not filepath.exists():
        base = filename.rsplit(".", 1)[0]
        ext = filename.rsplit(".", 1)[1] if "." in filename else ""
        candidates = sorted(p for p in ISOS_DIR.iterdir() if p.name.startswith(base) and p.name.endswith(f".{ext}"))
        if candidates:
            filepath = candidates[-1]
            filename = filepath.name
        else:
            return

    existing = db.query(ISOImage).filter(ISOImage.filename == filename).first()
    if existing:
        existing.status = "available"
        existing.progress = 100.0
    else:
        iso = ISOImage(
            filename=filename,
            os_name=filename.replace(".iso", "").replace("_", " ").replace("-", " ").title(),
            size_bytes=filepath.stat().st_size,
            status="available",
            progress=100.0,
        )
        db.add(iso)
    db.commit()

    from .iventoy import IventoyClient
    IventoyClient().add_iso(filename)
