from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, Float, Integer, String, Text

from .database import Base


class ISOImage(Base):
    __tablename__ = "iso_images"

    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    os_name = Column(String(255))
    version = Column(String(100))
    size_bytes = Column(BigInteger)
    checksum = Column(String(64))
    download_url = Column(Text)
    status = Column(String(50), default="available")
    progress = Column(Float, default=100.0)
    display_order = Column(Integer, default=0)
    enabled = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.now)


class BootClient(Base):
    __tablename__ = "boot_clients"

    id = Column(Integer, primary_key=True)
    mac_address = Column(String(17), unique=True)
    ip_address = Column(String(45))
    hostname = Column(String(255))
    last_seen = Column(DateTime, default=datetime.now)


class Backup(Base):
    __tablename__ = "backups"

    id = Column(Integer, primary_key=True)
    filename = Column(String(255))
    size_bytes = Column(BigInteger)
    created_at = Column(DateTime, default=datetime.now)


class Download(Base):
    __tablename__ = "downloads"

    id = Column(Integer, primary_key=True)
    url = Column(Text)
    filename = Column(String(255))
    total_length = Column(BigInteger, default=0)
    completed_length = Column(BigInteger, default=0)
    status = Column(String(50), default="downloading")
    error_message = Column(Text)
    aria2_gid = Column(String(100))
    created_at = Column(DateTime, default=datetime.now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    action = Column(String(255))
    username = Column(String(100))
    details = Column(Text)
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=datetime.now)
