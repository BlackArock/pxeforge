import shutil
import zipfile
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from ..config import BACKUPS_DIR, CONFIGS_DIR, DB_PATH, ISOS_DIR
from ..models import Backup, ISOImage


def generate_backup(db: Session) -> Backup:
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    filename = f"backup-{timestamp}.zip"
    zip_path = BACKUPS_DIR / filename

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        if DB_PATH.exists():
            zf.write(DB_PATH, "pxeforge.db")

        for cfg in CONFIGS_DIR.iterdir():
            if cfg.is_file():
                zf.write(cfg, f"configs/{cfg.name}")

        metadata = []
        for iso in db.query(ISOImage).all():
            metadata.append(f"{iso.id}|{iso.filename}|{iso.os_name}|{iso.version}|{iso.size_bytes}|{iso.status}")
        zf.writestr("metadata/isos.txt", "\n".join(metadata))

        zf.writestr("metadata/generated_at.txt", timestamp)

    size = zip_path.stat().st_size
    return Backup(filename=filename, size_bytes=size)
