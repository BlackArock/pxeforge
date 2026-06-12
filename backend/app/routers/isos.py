import hashlib
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import DISABLED_DIR, ISOS_DIR, PRELOADED_ISOS
from ..database import get_db
from ..models import AuditLog, Download, ISOImage
from ..schemas import DownloadResponse, ISOImageResponse, ReorderRequest
from ..services.download_service import list_enriched_downloads, start_download
from ..services.iventoy import IventoyClient

router = APIRouter(prefix="/isos", tags=["isos"])


def _log_audit(db: Session, username: str, action: str, details: str = None, ip: str = None):
    db.add(AuditLog(action=action, username=username, details=details, ip_address=ip))
    db.commit()


@router.get("", response_model=list[ISOImageResponse])
def list_isos(db: Session = Depends(get_db)):
    _reconcile_isos(db)
    return db.query(ISOImage).order_by(ISOImage.created_at.desc()).all()


def _reconcile_isos(db: Session):
    known = {r.filename for r in db.query(ISOImage.filename).all()}
    for fpath in ISOS_DIR.iterdir():
        if not fpath.suffix.lower() == ".iso":
            continue
        if fpath.name not in known:
            iso = ISOImage(
                filename=fpath.name,
                os_name=fpath.name.replace(".iso", "").replace("_", " ").replace("-", " ").title(),
                size_bytes=fpath.stat().st_size,
                status="available",
                progress=100.0,
            )
            db.add(iso)
            known.add(fpath.name)
            iventoy = IventoyClient()
            iventoy.add_iso(fpath.name)

    if DISABLED_DIR.exists():
        for fpath in DISABLED_DIR.iterdir():
            if not fpath.suffix.lower() == ".iso":
                continue
            if fpath.name not in known:
                iso = ISOImage(
                    filename=fpath.name,
                    os_name=fpath.name.replace(".iso", "").replace("_", " ").replace("-", " ").title(),
                    size_bytes=fpath.stat().st_size,
                    status="available",
                    progress=100.0,
                    enabled=0,
                )
                db.add(iso)
                known.add(fpath.name)
    db.commit()


@router.get("/preloaded")
def preloaded_isos():
    return [{"name": name, "url": url} for name, url in PRELOADED_ISOS.items()]


@router.get("/downloads", response_model=list[DownloadResponse])
def list_downloads(db: Session = Depends(get_db)):
    return list_enriched_downloads(db)


@router.delete("/downloads")
def clear_downloads(request: Request, db: Session = Depends(get_db)):
    get_current_user(request)
    count = db.query(Download).filter(Download.status.in_(["completed", "error"])).delete()
    db.commit()
    return {"deleted": count}


@router.delete("/downloads/{download_id}")
def delete_download(download_id: int, request: Request, db: Session = Depends(get_db)):
    get_current_user(request)
    dl = db.query(Download).filter(Download.id == download_id).first()
    if not dl:
        raise HTTPException(status_code=404, detail="Download not found")
    db.delete(dl)
    db.commit()
    return {"ok": True}


@router.delete("/{iso_id}")
def delete_iso(iso_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request)
    iso = db.query(ISOImage).filter(ISOImage.id == iso_id).first()
    if not iso:
        raise HTTPException(status_code=404, detail="ISO not found")

    filepath = ISOS_DIR / iso.filename
    if filepath.exists():
        filepath.unlink()

    iventoy = IventoyClient()
    iventoy.remove_iso(iso.filename)

    db.delete(iso)
    _log_audit(db, user, "delete_iso", f"Deleted ISO: {iso.filename}", request.client.host)
    db.commit()
    return {"ok": True}


@router.post("/upload")
async def upload_iso(
    file: UploadFile,
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user(request)
    filename = file.filename
    if not filename.lower().endswith(".iso"):
        raise HTTPException(status_code=400, detail="File must be an ISO image")

    filepath = ISOS_DIR / filename

    checksum = hashlib.sha256()
    size = 0
    with open(filepath, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)
            checksum.update(chunk)
            size += len(chunk)

    iso = ISOImage(
        filename=filename,
        os_name=filename.replace(".iso", ""),
        size_bytes=size,
        checksum=checksum.hexdigest(),
        status="available",
        progress=100.0,
    )
    db.add(iso)
    _log_audit(db, user, "upload_iso", f"Uploaded ISO: {filename} ({size} bytes)", request.client.host)
    db.commit()

    iventoy = IventoyClient()
    iventoy.add_iso(filename)

    return ISOImageResponse.model_validate(iso)


@router.post("/download")
def download_iso(
    url: str = Query(...),
    filename: str = Query(None),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = get_current_user(request)
    if filename:
        name = filename
    else:
        name = url.split("/")[-1].split("?")[0] or "downloaded.iso"
        name = unquote(name)

    download = start_download(db, url, name)
    _log_audit(db, user, "download_iso", f"Started download: {name}", request.client.host)
    return {"download_id": download.id, "filename": name}


@router.post("/download-torrent")
def download_torrent(
    magnet: str = Query(...),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = get_current_user(request)
    download = start_download(db, magnet, "torrent-download.iso")
    _log_audit(db, user, "download_torrent", f"Started torrent: {magnet[:60]}...", request.client.host)
    return {"download_id": download.id}


@router.post("/download-preloaded")
def download_preloaded(
    name: str = Query(...),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = get_current_user(request)
    url = PRELOADED_ISOS.get(name)
    if not url:
        raise HTTPException(status_code=404, detail="Preloaded ISO not found")

    filename = f"{name.replace(' ', '_').lower()}.iso"
    download = start_download(db, url, filename)
    _log_audit(db, user, "download_preloaded", f"Started preloaded: {name}", request.client.host)
    return {"download_id": download.id, "filename": filename}


@router.put("/{iso_id}/toggle")
def toggle_iso(iso_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request)
    iso = db.query(ISOImage).filter(ISOImage.id == iso_id).first()
    if not iso:
        raise HTTPException(status_code=404, detail="ISO not found")

    iso.enabled = 0 if iso.enabled else 1
    src = ISOS_DIR / iso.filename
    dst_dir = ISOS_DIR if iso.enabled else DISABLED_DIR
    dst = dst_dir / iso.filename

    if src.exists() and src.parent != dst_dir:
        dst_dir.mkdir(exist_ok=True)
        src.rename(dst)
    elif dst.exists() and dst.parent == dst_dir and iso.enabled:
        dst.rename(src)

    _log_audit(db, user, "toggle_iso", f"{'Enabled' if iso.enabled else 'Disabled'} ISO: {iso.filename}", request.client.host)
    db.commit()
    return {"enabled": bool(iso.enabled)}


@router.put("/reorder")
def reorder_isos(body: ReorderRequest, request: Request, db: Session = Depends(get_db)):
    get_current_user(request)
    for item in body.items:
        db.query(ISOImage).filter(ISOImage.id == item["id"]).update({"display_order": item["display_order"]})
    db.commit()
    return {"ok": True}


@router.get("/{iso_id}/download")
def download_iso_file(iso_id: int, request: Request, db: Session = Depends(get_db)):
    get_current_user(request)
    iso = db.query(ISOImage).filter(ISOImage.id == iso_id).first()
    if not iso:
        raise HTTPException(status_code=404, detail="ISO not found")
    filepath = ISOS_DIR / iso.filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(filepath, filename=iso.filename, media_type="application/octet-stream")


