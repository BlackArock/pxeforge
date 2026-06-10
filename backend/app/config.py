import os
from pathlib import Path

DATA_DIR = Path("/data")
ISOS_DIR = DATA_DIR / "isos"
DISABLED_DIR = ISOS_DIR / "_disabled"
CONFIGS_DIR = DATA_DIR / "configs"
BACKUPS_DIR = DATA_DIR / "backups"
LOGS_DIR = DATA_DIR / "logs"
DB_PATH = DATA_DIR / "pxeforge.db"

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
IVENTOY_API_URL = os.getenv("IVENTOY_API_URL", "http://host.docker.internal:26000")
ARIA2_RPC_URL = "http://aria2:6800/jsonrpc"
ARIA2_RPC_SECRET = os.getenv("ARIA2_RPC_SECRET", "pxeforge")
JWT_SECRET = os.getenv("JWT_SECRET", "pxeforge-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

PRELOADED_ISOS = {
    "Ubuntu 24.04 LTS": "https://releases.ubuntu.com/24.04/ubuntu-24.04.1-desktop-amd64.iso",
    "Ubuntu Server 24.04 LTS": "https://releases.ubuntu.com/24.04/ubuntu-24.04.1-live-server-amd64.iso",
    "Debian 13 (Trixie)": "https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-13.0.0-amd64-netinst.iso",
    "Clonezilla": "https://sourceforge.net/projects/clonezilla/files/clonezilla_live_stable/3.2.1-9/clonezilla-live-3.2.1-9-amd64.iso/download",
    "GParted": "https://sourceforge.net/projects/gparted/files/gparted-live-stable/1.6.0-1/gparted-live-1.6.0-1-amd64.iso/download",
    "Proxmox VE 8": "https://www.proxmox.com/en/downloads/proxmox-virtual-environment/iso/proxmox-ve_8.2-1.iso",
}
