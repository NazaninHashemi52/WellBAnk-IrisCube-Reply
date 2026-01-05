"""
Batch Processing API endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Optional, Dict
import sys
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import json

# Add parent directory to path to import clustering module
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
# Lazy import - only import when needed to avoid import errors at startup
# from customer_clustering import run_batch_processing
from app.db import get_conn

# Create a thread pool executor for CPU-intensive tasks
executor = ThreadPoolExecutor(max_workers=1)

router = APIRouter()


@router.get("/batch/test")
async def test_batch_endpoint():
    """Simple test endpoint to verify the batch router is working."""
    return {
        "status": "ok",
        "message": "Batch endpoint is accessible",
        "timestamp": datetime.now().isoformat()
    }


class BatchRunResponse(BaseModel):
    run_id: int
    status: str
    customers_processed: Optional[int] = None
    clusters_count: Optional[int] = None
    message: str


@router.post("/batch/run", response_model=BatchRunResponse)
async def run_batch(
    background_tasks: BackgroundTasks,
    use_category_clustering: bool = Query(True, description="Use category-based clustering (recommended)")
):
    """
    Run batch processing for customer clustering and service assignment.
    
    Args:
        use_category_clustering: If True, uses category-based clustering (transaction/product categories).
                                 If False, uses aggregated numeric features clustering.
    """
    try:
        # Check if required packages are available
        try:
            import numpy
            import pandas
            import sklearn
        except ImportError as e:
            missing_pkg = str(e).split("'")[1] if "'" in str(e) else "unknown"
            raise HTTPException(
                status_code=500,
                detail=f"Missing required package: {missing_pkg}. Please install: pip install numpy pandas scikit-learn"
            )
        
        # Run in thread pool to avoid blocking the event loop
        print("=" * 50)
        print("Starting batch processing...")
        print(f"Using {'category-based' if use_category_clustering else 'aggregated features'} clustering")
        print("=" * 50)
        
        import time
        start_time = time.time()
        
        try:
            if use_category_clustering:
                # Use category-based clustering (recommended)
                from implement_best_clustering_categories import run_clustering
                
                # Run clustering (it will create batch_runs entry internally)
                if hasattr(asyncio, 'to_thread'):
                    clustering_result = await asyncio.to_thread(run_clustering, n_clusters=6, save_to_db=True)
                else:
                    loop = asyncio.get_event_loop()
                    clustering_result = await loop.run_in_executor(executor, run_clustering, 6, True)
                
                # Convert to batch run format
                result = {
                    'run_id': clustering_result.get('run_id'),
                    'status': clustering_result['status'],
                    'customers_processed': clustering_result['n_customers'],
                    'clusters_count': clustering_result['n_clusters'],
                    'message': f'Successfully processed {clustering_result["n_customers"]} customers using category-based clustering'
                }
            else:
                # Use aggregated features clustering (original method)
                from customer_clustering import run_batch_processing
                
                if hasattr(asyncio, 'to_thread'):
                    result = await asyncio.to_thread(run_batch_processing)
                else:
                    loop = asyncio.get_event_loop()
                    result = await loop.run_in_executor(executor, run_batch_processing)
            
            elapsed = time.time() - start_time
            print("=" * 50)
            print(f"Batch processing completed in {elapsed:.2f} seconds")
            print(f"Result: {result}")
            print("=" * 50)
            
            return BatchRunResponse(**result)
        except Exception as exec_error:
            elapsed = time.time() - start_time
            print("=" * 50)
            print(f"Batch processing FAILED after {elapsed:.2f} seconds")
            print(f"Error: {exec_error}")
            import traceback
            traceback.print_exc()
            print("=" * 50)
            raise
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print("=" * 50)
        print("BATCH PROCESSING ERROR:")
        print("=" * 50)
        print(error_details)
        print("=" * 50)
        raise HTTPException(
            status_code=500,
            detail=f"Batch processing failed: {str(e)}"
        )


@router.get("/batch/last-run")
async def get_last_run():
    """
    Get information about the last batch run.
    """
    conn = get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                id,
                started_at,
                finished_at,
                status,
                notes
            FROM batch_runs
            ORDER BY started_at DESC
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        
        if not row:
            return {
                "status": "no_runs",
                "message": "No batch runs found"
            }
        
        # Parse notes if available
        notes = {}
        if row['notes']:
            try:
                import json
                notes = json.loads(row['notes'])
            except:
                pass
        
        return {
            "run_id": row['id'],
            "started_at": row['started_at'],
            "finished_at": row['finished_at'],
            "status": row['status'],
            "clusters_count": notes.get('clusters_count'),
            "customers_processed": notes.get('customers_processed')
        }
    finally:
        conn.close()

