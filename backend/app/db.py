# backend/app/db.py
from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Optional


def _default_db_path() -> Path:
    # backend/app/db.py -> parents[1] is backend/
    return Path(__file__).resolve().parents[1] / "wellbank.db"


def get_conn(db_path: Optional[str] = None) -> sqlite3.Connection:
    """
    Returns a SQLite connection with:
    - foreign keys enabled
    - Row factory (dict-like access)
    """
    path = Path(db_path) if db_path else _default_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(path), check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA busy_timeout = 30000;")  # 30 second timeout for locked database
    return conn
