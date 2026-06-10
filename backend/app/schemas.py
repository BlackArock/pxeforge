from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class ISOImageResponse(BaseModel):
    id: int
    filename: str
    os_name: Optional[str] = None
    version: Optional[str] = None
    size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    download_url: Optional[str] = None
    status: str
    progress: float
    display_order: int = 0
    enabled: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class ReorderRequest(BaseModel):
    items: list[dict]  # [{"id": 1, "display_order": 0}, ...]


class BootClientResponse(BaseModel):
    id: int
    mac_address: str
    ip_address: Optional[str] = None
    hostname: Optional[str] = None
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True


class BackupResponse(BaseModel):
    id: int
    filename: str
    size_bytes: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DownloadResponse(BaseModel):
    id: int
    url: Optional[str] = None
    filename: str
    total_length: int
    completed_length: int
    download_speed: int = 0
    upload_speed: int = 0
    num_peers: int = 0
    num_seeders: int = 0
    eta_seconds: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    iventoy_status: str
    total_isos: int
    active_clients: int
    disk_used_gb: float
    disk_total_gb: float
    disk_percent: float
    recent_logs: list


class AuditLogResponse(BaseModel):
    id: int
    action: str
    username: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DownloadRequest(BaseModel):
    url: str
    filename: Optional[str] = None


class TorrentDownloadRequest(BaseModel):
    magnet: str
