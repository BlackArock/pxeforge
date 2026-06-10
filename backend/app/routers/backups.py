from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import AuditLog, Backup
from ..schemas import BackupResponse
from ..services.backup_service import generate_backup

router = APIRouter(prefix="/backups", tags=["backups"])


@router.get("", response_model=list[BackupResponse])
def list_backups(db: Session = Depends(get_db)):
    return db.query(Backup).order_by(Backup.created_at.desc()).all()


@router.post("")
def create_backup(request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request)
    try:
        backup = generate_backup(db)
        db.add(backup)
        db.add(AuditLog(action="create_backup", username=user, details=f"Backup: {backup.filename}", ip_address=request.client.host))
        db.commit()
        return BackupResponse.model_validate(backup)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{backup_id}")
def delete_backup(backup_id: int, request: Request, db: Session = Depends(get_db)):
    user = get_current_user(request)
    backup = db.query(Backup).filter(Backup.id == backup_id).first()
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    db.delete(backup)
    db.add(AuditLog(action="delete_backup", username=user, details=f"Deleted backup: {backup.filename}", ip_address=request.client.host))
    db.commit()
    return {"ok": True}
