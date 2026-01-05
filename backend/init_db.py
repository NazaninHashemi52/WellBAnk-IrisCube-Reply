import sqlite3
from pathlib import Path

DB_PATH = "wellbank.db"
SCHEMA_PATH = "schema_sqlite.sql"

sql = Path(SCHEMA_PATH).read_text(encoding="utf-8")

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = ON")
conn.executescript(sql)
conn.commit()
conn.close()

print("OK: wellbank.db created and schema applied")
