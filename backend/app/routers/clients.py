from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import BootClient
from ..schemas import BootClientResponse
from ..services.iventoy import IventoyClient

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[BootClientResponse])
def list_clients(db: Session = Depends(get_db)):
    iventoy = IventoyClient()
    remote = iventoy.list_clients()

    seen_macs = set()
    for c in remote:
        mac = c.get("mac", "").upper()
        if not mac:
            continue
        seen_macs.add(mac)
        existing = db.query(BootClient).filter(BootClient.mac_address == mac).first()
        if existing:
            existing.ip_address = c.get("ip", existing.ip_address)
            existing.hostname = c.get("hostname", existing.hostname)
        else:
            db.add(BootClient(
                mac_address=mac,
                ip_address=c.get("ip"),
                hostname=c.get("hostname"),
            ))
    db.commit()

    return db.query(BootClient).order_by(BootClient.last_seen.desc()).all()
