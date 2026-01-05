# backend/app/api/v1/datasets.py
from __future__ import annotations

import csv
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db import get_conn  # create this helper (sqlite connection) as shown earlier

router = APIRouter(tags=["datasets"])

UPLOAD_ROOT = Path(settings.UPLOAD_DIR)
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

# Map UI dataset types -> DB table names (adjust to your schema_sqlite.sql)
DATASET_TABLE_MAP: Dict[str, str] = {
    "anagrafiche": "customers",     # Customer master
    "prodotti": "holdings",         # Products/Holdings
    "possesso-prodotti": "holdings",  # Alias for prodotti
    "movimenti": "transactions",    # Transactions
}

# Column mapping: CSV column -> DB column
COLUMN_MAPPING: Dict[str, Dict[str, str]] = {
    "customers": {
        # CSV columns -> DB columns for customers/anagrafiche
        "codice_cliente": "customer_id",
        "id_cliente": "customer_id",
        "customer_id": "customer_id",
        "nome": "first_name",
        "first_name": "first_name",
        "cognome": "last_name",
        "last_name": "last_name",
        "data_nascita": "birth_date",
        "birth_date": "birth_date",
        "sesso": "gender",
        "gender": "gender",
        "citta": "city",
        "citta_nascita": "city",  # Also map citta_nascita to city
        "city": "city",
        "paese": "country",
        "stato_nascita": "country",  # Also map stato_nascita to country
        "country": "country",
        "professione": "profession",
        "descrizione_attivita": "profession",  # Map activity description to profession
        "profession": "profession",
        "segmento": "segment_hint",
        "segmento_economico": "segment_hint",  # Map segmento_economico to segment_hint
        "segment_hint": "segment_hint",
        "reddito_annuo": "annual_income",
        "annual_income": "annual_income",
    },
    "transactions": {
        # CSV columns -> DB columns for transactions/movimenti
        "codice_cliente": "customer_id",
        "id_cliente": "customer_id",
        "customer_id": "customer_id",
        "timestamp": "tx_date",
        "data": "tx_date",
        "date": "tx_date",
        "tx_date": "tx_date",
        "importo": "amount",
        "amount": "amount",
        "valore": "amount",
        "valuta": "currency",
        "currency": "currency",
        "merchant": "merchant",
        "negozio": "merchant",
        "macrocategoria": "tx_category",
        "categoria": "tx_category",
        "tx_category": "tx_category",
        "canale": "channel",
        "channel": "channel",
    },
    "holdings": {
        # CSV columns -> DB columns for holdings/prodotti
        "codice_cliente": "customer_id",
        "id_cliente": "customer_id",
        "customer_id": "customer_id",
        "codice_prodotto": "product_code",
        "product_code": "product_code",
        "nome_prodotto": "product_name",
        "product_name": "product_name",
        "descrizione": "product_name",  # descrizione is product description/name
        "categoria": "category",
        "category": "category",
        "saldo": "balance",
        "balance": "balance",
        "data_apertura": "opened_at",
        "opened_at": "opened_at",
        "stato": "status",
        "status": "status",
    },
}


# ----------------------------
# Upload Job (progress) helpers
# ----------------------------
def create_job(dataset_type: str, filename: str) -> int:
    conn = get_conn()
    try:
        cur = conn.execute(
            """
            INSERT INTO upload_jobs(dataset_key, filename, status, progress, processed_rows)
            VALUES (?, ?, 'queued', 0, 0)
            """,
            (dataset_type, filename),
        )
        conn.commit()
        return int(cur.lastrowid)
    finally:
        conn.close()


def update_job(
    job_id: int,
    *,
    status: Optional[str] = None,
    progress: Optional[float] = None,
    processed_rows: Optional[int] = None,
    total_rows: Optional[int] = None,
    error: Optional[str] = None,
) -> None:
    conn = get_conn()
    try:
        fields: List[str] = []
        params: List[Any] = []

        if status is not None:
            fields.append("status=?")
            params.append(status)
        if progress is not None:
            fields.append("progress=?")
            params.append(float(progress))
        if processed_rows is not None:
            fields.append("processed_rows=?")
            params.append(int(processed_rows))
        if total_rows is not None:
            fields.append("total_rows=?")
            params.append(int(total_rows))
        if error is not None:
            fields.append("error=?")
            params.append(error)

        if fields:
            sql = f"""
            UPDATE upload_jobs
            SET {', '.join(fields)}, updated_at=datetime('now')
            WHERE id=?
            """
            params.append(job_id)
            conn.execute(sql, tuple(params))
            conn.commit()
    finally:
        conn.close()


def get_job(job_id: int) -> Dict[str, Any]:
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM upload_jobs WHERE id=?", (job_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        return dict(row)
    finally:
        conn.close()


# ----------------------------
# CSV -> SQLite import (with progress)
# ----------------------------
def _table_columns(conn, table_name: str) -> List[str]:
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    if not rows:
        raise RuntimeError(f"Table not found: {table_name}")
    return [r["name"] for r in rows]


def _map_csv_to_db_columns(csv_columns: List[str], table_name: str, allowed_cols: List[str]) -> Dict[str, str]:
    """Map CSV column names to database column names."""
    mapping = COLUMN_MAPPING.get(table_name, {})
    result = {}
    for csv_col in csv_columns:
        # Try direct mapping first
        if csv_col in mapping:
            db_col = mapping[csv_col]
            if db_col in allowed_cols:
                result[csv_col] = db_col
        # Try case-insensitive match
        else:
            found = False
            for k, v in mapping.items():
                if k.lower() == csv_col.lower():
                    if v in allowed_cols:
                        result[csv_col] = v
                        found = True
                    break
            # If no mapping found but column name matches DB column exactly, use as-is
            if not found and csv_col in allowed_cols:
                result[csv_col] = csv_col
    return result


def _sanitize_row(row: Dict[str, str], column_mapping: Dict[str, str], allowed_cols: List[str]) -> Dict[str, Any]:
    """Sanitize and map CSV row to database columns."""
    out: Dict[str, Any] = {}
    for csv_col, db_col in column_mapping.items():
        if db_col in allowed_cols and csv_col in row:
            v = row[csv_col]
            vv = v.strip() if isinstance(v, str) else v
            # Handle date conversion for timestamp -> tx_date
            if db_col == "tx_date" and csv_col == "timestamp":
                # Try to extract date from timestamp (assuming ISO format or similar)
                try:
                    from datetime import datetime
                    if isinstance(vv, str):
                        # Try parsing common timestamp formats
                        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"]:
                            try:
                                dt = datetime.strptime(vv.split()[0] if " " in vv else vv, fmt)
                                vv = dt.strftime("%Y-%m-%d")
                                break
                            except:
                                continue
                except:
                    pass
            out[db_col] = vv if vv != "" else None
    return out


def import_csv_job(job_id: int, dataset_type: str, table_name: str, csv_path: Path) -> None:
    update_job(job_id, status="running", progress=0, processed_rows=0, error=None)

    conn = get_conn()
    try:
        allowed_cols = _table_columns(conn, table_name)

        # Compute total rows (header excluded) for % progress
        total_lines = 0
        with csv_path.open("r", encoding="utf-8", newline="") as f:
            for _ in f:
                total_lines += 1
        total_rows = max(0, total_lines - 1)
        update_job(job_id, total_rows=total_rows)

        processed = 0
        batch_size = 500

        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                raise RuntimeError("CSV has no header row")

            # Map CSV columns to DB columns
            column_mapping = _map_csv_to_db_columns(reader.fieldnames, table_name, allowed_cols)
            if not column_mapping:
                # Provide helpful error message with suggestions
                csv_cols_str = ", ".join(reader.fieldnames)
                db_cols_str = ", ".join(allowed_cols)
                error_msg = (
                    f"No matching columns between CSV header and table '{table_name}'. "
                    f"\nCSV columns: [{csv_cols_str}]"
                    f"\nTable columns: [{db_cols_str}]"
                    f"\n\nPossible issues:"
                    f"\n1. Wrong dataset type selected (file appears to be '{dataset_type}' but CSV columns suggest different type)"
                    f"\n2. CSV column names don't match expected format"
                    f"\n\nTip: If this is a transactions file, use dataset_type='movimenti'. "
                    f"If this is a customers file, use dataset_type='anagrafiche'."
                )
                raise RuntimeError(error_msg)

            # Get unique DB columns from mapping
            insert_cols = list(set(column_mapping.values()))
            insert_cols = [c for c in insert_cols if c in allowed_cols]
            
            if not insert_cols:
                raise RuntimeError(
                    f"No matching columns after mapping. CSV columns: {reader.fieldnames}, "
                    f"DB columns: {allowed_cols}, Mapping: {column_mapping}"
                )

            placeholders = ", ".join(["?"] * len(insert_cols))
            col_sql = ", ".join(insert_cols)
            sql = f"INSERT INTO {table_name} ({col_sql}) VALUES ({placeholders})"

            buf: List[tuple] = []
            for row in reader:
                clean = _sanitize_row(row, column_mapping, allowed_cols)
                buf.append(tuple(clean.get(c) for c in insert_cols))
                processed += 1

                if len(buf) >= batch_size:
                    conn.executemany(sql, buf)
                    conn.commit()
                    buf.clear()

                    pct = 100.0 if total_rows == 0 else min(100.0, (processed / total_rows) * 100.0)
                    update_job(job_id, processed_rows=processed, progress=pct)

            if buf:
                conn.executemany(sql, buf)
                conn.commit()

        update_job(job_id, processed_rows=processed, progress=100.0, status="done")

    except Exception as e:
        update_job(job_id, status="failed", error=str(e))
        raise
    finally:
        conn.close()


# ----------------------------
# API endpoints
# ----------------------------
@router.post("/datasets/upload")
async def upload_dataset(
    background: BackgroundTasks,
    dataset_type: str = Form(..., description="anagrafiche | movimenti | prodotti"),
    file: UploadFile = File(...),
    import_to_db: bool = Form(True, description="If true, import CSV into SQLite after upload"),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Auto-detect dataset type from filename if possible
    filename_lower = file.filename.lower()
    detected_type = None
    if "movimenti" in filename_lower or "transaction" in filename_lower:
        detected_type = "movimenti"
    elif "anagrafiche" in filename_lower or "customer" in filename_lower or "cliente" in filename_lower:
        detected_type = "anagrafiche"
    elif "possesso" in filename_lower or "prodotti" in filename_lower or "holdings" in filename_lower or "products" in filename_lower:
        detected_type = "prodotti"
    
    # Warn if detected type differs from selected type
    if detected_type and detected_type != dataset_type:
        # Still use the user-selected type, but this will be logged
        pass

    if dataset_type not in DATASET_TABLE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid dataset_type. Allowed: {', '.join(DATASET_TABLE_MAP.keys())}",
        )

    # create type-specific subfolder
    target_dir = UPLOAD_ROOT / dataset_type
    target_dir.mkdir(parents=True, exist_ok=True)

    target_path = target_dir / Path(file.filename).name

    # Remove old versions of this file from ALL dataset type directories (keep only latest)
    filename = Path(file.filename).name
    for dataset_type_dir in UPLOAD_ROOT.iterdir():
        if dataset_type_dir.is_dir():
            old_file_path = dataset_type_dir / filename
            if old_file_path.exists() and old_file_path != target_path:
                old_file_path.unlink()

    # save file in chunks
    with target_path.open("wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            buffer.write(chunk)

    # create upload job for progress
    job_id = create_job(dataset_type=dataset_type, filename=target_path.name)

    if import_to_db:
        table_name = DATASET_TABLE_MAP[dataset_type]
        background.add_task(import_csv_job, job_id, dataset_type, table_name, target_path)
    else:
        update_job(job_id, status="done", progress=100.0)

    return JSONResponse(
        {
            "message": "File uploaded successfully",
            "dataset_type": dataset_type,
            "filename": target_path.name,
            "path": str(target_path),
            "job_id": job_id,
            "status": "queued" if import_to_db else "done",
        }
    )


@router.get("/datasets/jobs/{job_id}")
def get_upload_job(job_id: int):
    return get_job(job_id)


@router.get("/datasets/list")
def list_uploaded_files():
    """List all uploaded files with their metadata. Shows only the latest version of each filename."""
    files_info = []
    seen_filenames = {}  # filename -> (file_info, upload_time)
    
    conn = get_conn()
    try:
        for dataset_type_dir in UPLOAD_ROOT.iterdir():
            if dataset_type_dir.is_dir():
                csv_files = list(dataset_type_dir.glob("*.csv"))
                for csv_file in csv_files:
                    stat = csv_file.stat()
                    filename = csv_file.name
                    
                    # Get the latest upload job for this file (any status)
                    job = conn.execute(
                        """
                        SELECT created_at, status, processed_rows, total_rows, dataset_key
                        FROM upload_jobs
                        WHERE dataset_key = ? AND filename = ?
                        ORDER BY created_at DESC
                        LIMIT 1
                        """,
                        (dataset_type_dir.name, filename)
                    ).fetchone()
                    
                    # Get upload time for comparison
                    upload_time = None
                    if job:
                        upload_time = job["created_at"]
                    else:
                        # Use file modification time if no job record
                        upload_time = datetime.fromtimestamp(stat.st_mtime).isoformat()
                    
                    file_info = {
                        "dataset_type": dataset_type_dir.name,
                        "filename": filename,
                        "size_kb": round(stat.st_size / 1024, 2),
                        "uploaded_at": job["created_at"] if job else None,
                        "status": job["status"] if job else "pending",
                        "rows_imported": job["processed_rows"] if job else 0,
                        "total_rows": job["total_rows"] if job else None,
                        "path": str(csv_file.relative_to(UPLOAD_ROOT)),
                    }
                    
                    # Keep only the most recent version of each filename
                    if filename not in seen_filenames or upload_time > seen_filenames[filename][1]:
                        seen_filenames[filename] = (file_info, upload_time)
    finally:
        conn.close()
    
    # Convert to list and sort by upload time (most recent first)
    files_info = [info for info, _ in seen_filenames.values()]
    files_info.sort(key=lambda x: x["uploaded_at"] or "", reverse=True)
    
    return {"files": files_info}
