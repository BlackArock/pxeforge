import shutil

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..config import ISOS_DIR, LOGS_DIR
from ..database import get_db
from ..models import AuditLog, BootClient, Download, ISOImage
from ..schemas import AuditLogResponse, DashboardResponse
from ..services.iventoy import IventoyClient

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request)

    iventoy = IventoyClient()
    try:
        status = iventoy.get_status()
        iventoy_status = status.get("status", "unknown")
    except Exception:
        iventoy_status = "unreachable"

    total_isos = db.query(ISOImage).count()
    active = db.query(BootClient).count()

    usage = shutil.disk_usage(ISOS_DIR)
    disk_used_gb = round(usage.used / (1024 ** 3), 2)
    disk_total_gb = round(usage.total / (1024 ** 3), 2)
    disk_percent = round((usage.used / usage.total) * 100, 1)

    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(20).all()

    return DashboardResponse(
        iventoy_status=iventoy_status,
        total_isos=total_isos,
        active_clients=active,
        disk_used_gb=disk_used_gb,
        disk_total_gb=disk_total_gb,
        disk_percent=disk_percent,
        recent_logs=[AuditLogResponse.model_validate(l) for l in logs],
    )


@router.get("/logs", response_model=list[AuditLogResponse])
def list_logs(request: Request, db: Session = Depends(get_db)):
    get_current_user(request)
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()


@router.delete("/logs")
def clear_logs(request: Request, db: Session = Depends(get_db)):
    get_current_user(request)
    count = db.query(AuditLog).delete()
    db.commit()
    return {"deleted": count}
