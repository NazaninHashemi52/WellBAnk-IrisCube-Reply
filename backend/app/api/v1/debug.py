"""
Debug endpoint to check database status and batch runs
"""
from fastapi import APIRouter
from app.db import get_conn
from pathlib import Path
import sqlite3

router = APIRouter()


@router.get("/debug/db-info")
async def get_db_info():
    """Get information about the database connection and batch runs."""
    try:
        conn = get_conn()
        cursor = conn.cursor()
        
        # Get database file path
        db_info = conn.execute("PRAGMA database_list").fetchall()
        db_path = db_info[0][2] if db_info else "unknown"
        
        # Check if batch_runs table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='batch_runs'
        """)
        table_exists = cursor.fetchone() is not None
        
        # Count batch runs
        batch_run_count = 0
        batch_runs = []
        if table_exists:
            cursor.execute("SELECT COUNT(*) FROM batch_runs")
            batch_run_count = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT id, started_at, finished_at, status, notes
                FROM batch_runs
                ORDER BY started_at DESC
                LIMIT 10
            """)
            for row in cursor.fetchall():
                batch_runs.append({
                    "id": row['id'],
                    "started_at": row['started_at'],
                    "finished_at": row['finished_at'],
                    "status": row['status']
                })
        
        # Check other tables
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table'
            ORDER BY name
        """)
        all_tables = [row[0] for row in cursor.fetchall()]
        
        # Check customers count
        customers_count = 0
        if 'customers' in all_tables:
            cursor.execute("SELECT COUNT(*) FROM customers")
            customers_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "database_path": db_path,
            "database_file_exists": Path(db_path).exists() if db_path != "unknown" else False,
            "batch_runs_table_exists": table_exists,
            "batch_runs_count": batch_run_count,
            "batch_runs": batch_runs,
            "all_tables": all_tables,
            "customers_count": customers_count
        }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

