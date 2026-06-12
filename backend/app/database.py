from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DB_PATH

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def _column_exists(table: str, column: str) -> bool:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
        return any(r[1] == column for r in rows)


def _apply_migrations():
    with engine.connect() as conn:
        if not _column_exists("iso_images", "category"):
            conn.execute(text("ALTER TABLE iso_images ADD COLUMN category VARCHAR(50) DEFAULT 'os'"))
        if not _column_exists("iso_images", "notes"):
            conn.execute(text("ALTER TABLE iso_images ADD COLUMN notes TEXT"))
        conn.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from . import models
    Base.metadata.create_all(bind=engine)
    _apply_migrations()
