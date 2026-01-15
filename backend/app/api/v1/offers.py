"""
API endpoints for offers and recommendations
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.db import get_conn
import json

router = APIRouter()

# Product catalog - this should match your product catalog
OFFER_CATALOG = {
    "REWARDS_CREDIT": {"display_name": "Rewards Credit Card", "category": "Credit Cards", "icon": "credit-card"},
    "CADB439": {"display_name": "ZynaFlow Plus", "category": "Credit", "icon": "credit-card"},
    "CACR432": {"display_name": "AureaCard Exclusive", "category": "Credit Cards", "icon": "credit-card"},
    # Add more products as needed
}

@router.get("/offers/recommendations")
async def get_pending_recommendations(
    status: str = Query('pending', description="Filter by status: pending, reviewed, sent, dismissed"),
    limit: int = Query(50, ge=1, le=1000, description="Maximum number of recommendations to return"),
    offset: int = Query(0, ge=0, description="Number of recommendations to skip")
):
    """
    Get pending recommendations for the dashboard (Next Best Actions).
    Returns recommendations with status filter, limit, and offset.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Get latest batch run
            cursor.execute("""
                SELECT id FROM batch_runs 
                WHERE status = 'success' 
                ORDER BY started_at DESC 
                LIMIT 1
            """)
            latest_run = cursor.fetchone()
            if not latest_run:
                return {"recommendations": [], "count": 0, "run_id": None}
            
            run_id = latest_run['id']
            
            # Get recommendations with status filter
            cursor.execute("""
                SELECT 
                    r.id,
                    r.customer_id,
                    r.product_code,
                    r.acceptance_prob,
                    r.expected_revenue,
                    r.status,
                    re.narrative,
                    c.first_name,
                    c.last_name,
                    c.segment_hint,
                    cc.cluster_id
                FROM recommendations r
                LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                LEFT JOIN customers c ON r.customer_id = c.customer_id
                LEFT JOIN customer_clusters cc ON r.customer_id = cc.customer_id AND r.run_id = cc.run_id
                WHERE r.run_id = ? AND r.status = ?
                ORDER BY r.acceptance_prob DESC, r.expected_revenue DESC
                LIMIT ? OFFSET ?
            """, (run_id, status, limit, offset))
            
            recommendations = []
            for row in cursor.fetchall():
                # Get product info from catalog
                product_info = OFFER_CATALOG.get(row['product_code'], {
                    "display_name": row['product_code'],
                    "category": "Unknown",
                    "icon": "wallet"
                })
                
                # Build customer name
                customer_name = f"{row['first_name'] or ''} {row['last_name'] or ''}".strip()
                if not customer_name:
                    customer_name = row['customer_id']
                
                recommendations.append({
                    "id": row['id'],
                    "customer_id": row['customer_id'],
                    "customer_name": customer_name,
                    "product_code": row['product_code'],
                    "product_name": product_info.get("display_name", row['product_code']),
                    "category": product_info.get("category", "Unknown"),
                    "icon": product_info.get("icon", "wallet"),
                    "acceptance_probability": float(row['acceptance_prob']),
                    "expected_revenue": float(row['expected_revenue']),
                    "status": row['status'] or 'pending',
                    "narrative": row['narrative'] or "Pre-calculated recommendation",
                    "cluster_id": row['cluster_id'],
                    "segment_hint": row['segment_hint']
                })
            
            # Get total count for this status
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM recommendations
                WHERE run_id = ? AND status = ?
            """, (run_id, status))
            total_count = cursor.fetchone()['total']
            
            return {
                "recommendations": recommendations,
                "count": len(recommendations),
                "total": total_count,
                "run_id": run_id,
                "status": status
            }
        finally:
            conn.close()
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_pending_recommendations: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading recommendations: {str(e)}")

@router.get("/offers/customer/{customer_id}/top-recommendations")
async def get_customer_top_recommendations(customer_id: str):
    """
    Get top 3 pre-calculated recommendations for a customer (Tier 2 - Instant data).
    Returns acceptance probabilities and revenue from batch processing (no AI generation).
    This is used for instant product switching in the UI.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Get latest batch run
            cursor.execute("""
                SELECT id FROM batch_runs 
                WHERE status = 'success' 
                ORDER BY started_at DESC 
                LIMIT 1
            """)
            latest_run = cursor.fetchone()
            if not latest_run:
                return {"top_recommendations": [], "message": "No batch runs available"}
            
            run_id = latest_run['id']
            
            # Get top 3 recommendations for this customer (pre-calculated from batch)
            cursor.execute("""
                SELECT 
                    r.id,
                    r.product_code,
                    r.acceptance_prob,
                    r.expected_revenue,
                    r.status,
                    re.narrative,
                    re.key_factors_json
                FROM recommendations r
                LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                WHERE r.customer_id = ? AND r.run_id = ?
                ORDER BY r.acceptance_prob DESC, r.expected_revenue DESC
                LIMIT 3
            """, (customer_id, run_id))
            
            recommendations = []
            for row in cursor.fetchall():
                # Get product info from catalog
                product_info = OFFER_CATALOG.get(row['product_code'], {
                    "display_name": row['product_code'],
                    "category": "Unknown",
                    "icon": "wallet"
                })
                
                # Parse key factors if available
                key_benefits = []
                if row['key_factors_json']:
                    try:
                        factors = json.loads(row['key_factors_json'])
                        if isinstance(factors, dict):
                            key_benefits = factors.get('key_benefits', [])
                    except:
                        pass
                
                recommendations.append({
                    "recommendation_id": row['id'],
                    "product_code": row['product_code'],
                    "product_name": product_info.get("display_name", row['product_code']),
                    "category": product_info.get("category", "Unknown"),
                    "icon": product_info.get("icon", "wallet"),
                    "acceptance_probability": float(row['acceptance_prob']),
                    "expected_revenue": float(row['expected_revenue']),
                    "status": row['status'] or 'pending',
                    "narrative": row['narrative'] or "Pre-calculated recommendation",
                    "key_benefits": key_benefits
                })
            
            return {
                "customer_id": customer_id,
                "top_recommendations": recommendations,
                "count": len(recommendations)
            }
        finally:
            conn.close()
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_customer_top_recommendations: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading top recommendations: {str(e)}")
