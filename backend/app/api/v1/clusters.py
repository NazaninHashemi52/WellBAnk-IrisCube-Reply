"""
API endpoints for viewing clustering results

SECURITY NOTE:
This API currently has no authentication/authorization. For a production banking system,
the following security measures should be implemented:
- Role-based access control (RBAC) - restrict endpoints by user role
- API token authentication (OAuth2, JWT tokens)
- Rate limiting to prevent abuse
- Input validation and sanitization
- Audit logging for all data access
- Restricted data exposure (PII masking, data anonymization)
- HTTPS/TLS encryption for all communications

For this challenge demo, these security features are not implemented but should be
mentioned in the report/presentation as non-functional requirements.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
from app.db import get_conn
import json

router = APIRouter()


@router.get("/clusters/runs")
async def list_cluster_runs():
    """
    Get list of all batch runs with their status.
    
    Note: This endpoint returns empty lists with warnings instead of errors
    to prevent frontend crashes. All errors are logged to backend console.
    """
    print("\n" + "=" * 60)
    print("[CLUSTERS API] /clusters/runs called")
    print("=" * 60)
    
    try:
        conn = get_conn()
        try:
            # Debug: Print database path
            db_info = conn.execute("PRAGMA database_list").fetchall()
            db_path = db_info[0][2] if db_info else "unknown"
            print(f"[CLUSTERS API] Database file: {db_path}")
            
            cursor = conn.cursor()
            
            # Check if table exists, if not return empty list with warning
            try:
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='batch_runs'
                """)
                table_exists = cursor.fetchone()
                if not table_exists:
                    warning = "batch_runs table does not exist. Please run batch processing first."
                    print(f"[CLUSTERS API] ERROR: {warning}")
                    return {"runs": [], "warning": warning}
                print("[CLUSTERS API] batch_runs table exists")
            except Exception as table_check_error:
                warning = f"Error checking for batch_runs table: {str(table_check_error)}"
                print(f"[CLUSTERS API] {warning}")
                import traceback
                print(traceback.format_exc())
                return {"runs": [], "warning": warning}
            
            # Query batch runs
            try:
                cursor.execute("""
                    SELECT 
                        id,
                        started_at,
                        finished_at,
                        status,
                        notes
                    FROM batch_runs
                    ORDER BY started_at DESC
                    LIMIT 20
                """)
                print(f"[CLUSTERS API] Query executed, fetching results...")
                
                rows = cursor.fetchall()
                print(f"[CLUSTERS API] Found {len(rows)} batch run(s) in database")
                
                # Print details of each run found
                for idx, row in enumerate(rows):
                    print(f"[CLUSTERS API]   Run #{idx+1}: ID={row['id']}, Status={row['status']}, Started={row['started_at']}")
                
                runs = []
                for row in rows:
                    notes = {}
                    if row['notes']:
                        try:
                            notes = json.loads(row['notes'])
                        except:
                            pass
                    
                    runs.append({
                        "run_id": row['id'],
                        "started_at": row['started_at'],
                        "finished_at": row['finished_at'],
                        "status": row['status'],
                        "customers_processed": notes.get('customers_processed'),
                        "clusters_count": notes.get('clusters_count')
                    })
                
                print(f"[CLUSTERS API] Returning {len(runs)} runs to frontend")
                print("=" * 60 + "\n")
                return {"runs": runs}
            except Exception as query_error:
                warning = f"Error querying batch_runs table: {str(query_error)}. Table structure may be incorrect."
                print(f"[CLUSTERS API] {warning}")
                import traceback
                print(traceback.format_exc())
                return {"runs": [], "warning": warning}
        finally:
            conn.close()
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        warning = f"Unexpected error loading batch runs: {str(e)}"
        print(f"[CLUSTERS API] ERROR in list_cluster_runs: {e}")
        print(error_trace)
        print("=" * 60 + "\n")
        return {"runs": [], "warning": warning}


@router.get("/clusters/{run_id}/summary")
async def get_cluster_summary(run_id: int):
    """
    Get summary statistics for a specific batch run.
    
    Returns 404 if run_id does not exist in batch_runs table.
    Returns warnings if run exists but has no clusters or recommendations.
    """
    print(f"\n[CLUSTERS API] Getting summary for run_id={run_id}")
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify run_id exists
            cursor.execute("SELECT id FROM batch_runs WHERE id = ?", (run_id,))
            if not cursor.fetchone():
                print(f"[CLUSTERS API] Run ID {run_id} not found")
                raise HTTPException(status_code=404, detail=f"Batch run {run_id} not found")
            
            # Get cluster distribution
            cursor.execute("""
                SELECT 
                    cluster_id,
                    COUNT(*) as customer_count,
                    AVG(distance_to_centroid) as avg_distance
                FROM customer_clusters
                WHERE run_id = ?
                GROUP BY cluster_id
                ORDER BY cluster_id
            """, (run_id,))
            
            clusters = []
            for row in cursor.fetchall():
                clusters.append({
                    "cluster_id": row['cluster_id'],
                    "customer_count": row['customer_count'],
                    "avg_distance": row['avg_distance']
                })
            
            print(f"[CLUSTERS API] Found {len(clusters)} clusters for run {run_id}")
            for cluster in clusters:
                print(f"  - Cluster {cluster['cluster_id']}: {cluster['customer_count']} customers")
            
            # Collect warnings for empty data
            warnings = []
            
            # Get total recommendations
            cursor.execute("""
                SELECT COUNT(*) as total_recommendations
                FROM recommendations
                WHERE run_id = ?
            """, (run_id,))
            total_recommendations = cursor.fetchone()['total_recommendations']
            print(f"[CLUSTERS API] Total recommendations: {total_recommendations}")
            
            if len(clusters) == 0:
                warnings.append("No clusters found for this batch run. The clustering may not have completed successfully.")
            
            if total_recommendations == 0:
                warnings.append("No recommendations found for this batch run. Service assignment may not have completed.")
            
            # Get total customers processed
            cursor.execute("""
                SELECT COUNT(DISTINCT customer_id) as total_customers
                FROM customer_clusters
                WHERE run_id = ?
            """, (run_id,))
            total_customers = cursor.fetchone()['total_customers']
            
            # Get average acceptance probability
            cursor.execute("""
                SELECT AVG(acceptance_prob) as avg_acceptance_prob
                FROM recommendations
                WHERE run_id = ?
            """, (run_id,))
            avg_acceptance_prob = cursor.fetchone()['avg_acceptance_prob'] or 0.0
            
            # Get total expected revenue
            cursor.execute("""
                SELECT SUM(expected_revenue) as total_revenue
                FROM recommendations
                WHERE run_id = ?
            """, (run_id,))
            total_revenue = cursor.fetchone()['total_revenue'] or 0.0
            
            # Get recommendations by product with enhanced info
            cursor.execute("""
                SELECT 
                    product_code,
                    COUNT(*) as count,
                    AVG(acceptance_prob) as avg_probability,
                    SUM(expected_revenue) as total_revenue,
                    MIN(acceptance_prob) as min_prob,
                    MAX(acceptance_prob) as max_prob
                FROM recommendations
                WHERE run_id = ?
                GROUP BY product_code
                ORDER BY total_revenue DESC
            """, (run_id,))
            
            products = []
            for row in cursor.fetchall():
                products.append({
                    "product_code": row['product_code'],
                    "recommendation_count": row['count'],
                    "avg_acceptance_probability": row['avg_probability'],
                    "total_expected_revenue": row['total_revenue'],
                    "min_acceptance_probability": row['min_prob'],
                    "max_acceptance_probability": row['max_prob']
                })
            
            # Enhanced cluster info with revenue per cluster
            enhanced_clusters = []
            for cluster in clusters:
                cursor.execute("""
                    SELECT 
                        COUNT(DISTINCT r.customer_id) as customers_with_recs,
                        SUM(r.expected_revenue) as cluster_revenue,
                        AVG(r.acceptance_prob) as cluster_avg_prob
                    FROM customer_clusters cc
                    LEFT JOIN recommendations r ON cc.customer_id = r.customer_id AND cc.run_id = r.run_id
                    WHERE cc.run_id = ? AND cc.cluster_id = ?
                """, (run_id, cluster['cluster_id']))
                cluster_stats = cursor.fetchone()
                
                # Get top product for this cluster
                cursor.execute("""
                    SELECT 
                        r.product_code,
                        COUNT(*) as rec_count
                    FROM customer_clusters cc
                    JOIN recommendations r ON cc.customer_id = r.customer_id AND cc.run_id = r.run_id
                    WHERE cc.run_id = ? AND cc.cluster_id = ?
                    GROUP BY r.product_code
                    ORDER BY rec_count DESC
                    LIMIT 1
                """, (run_id, cluster['cluster_id']))
                top_product_row = cursor.fetchone()
                
                enhanced_clusters.append({
                    **cluster,
                    "cluster_revenue": cluster_stats['cluster_revenue'] or 0.0,
                    "customers_with_recommendations": cluster_stats['customers_with_recs'] or 0,
                    "cluster_avg_acceptance_prob": cluster_stats['cluster_avg_prob'] or 0.0,
                    "top_product": top_product_row['product_code'] if top_product_row else None
                })
            
            print(f"[CLUSTERS API] Products: {len(products)}")
            print(f"[CLUSTERS API] Total customers: {total_customers}, Avg acceptance: {avg_acceptance_prob:.2%}, Total revenue: €{total_revenue:,.2f}")
            if warnings:
                print(f"[CLUSTERS API] Warnings: {warnings}")
            print("=" * 60 + "\n")
            
            result = {
                "run_id": run_id,
                "total_customers_processed": total_customers,
                "total_recommendations": total_recommendations,
                "total_expected_revenue": total_revenue,
                "avg_acceptance_probability": float(avg_acceptance_prob),
                "clusters": enhanced_clusters,
                "products": products
            }
            
            # Add warnings if any
            if warnings:
                result["warnings"] = warnings
            
            return result
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[CLUSTERS API] ERROR in get_cluster_summary: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading cluster summary: {str(e)}")


@router.get("/clusters/{run_id}/customers")
async def get_cluster_customers(
    run_id: int,
    cluster_id: Optional[int] = Query(None, description="Filter by cluster ID"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of customers to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    Get customers and their cluster assignments for a specific run.
    
    Returns 404 if run_id does not exist in batch_runs table.
    Note: customer_id is stored as TEXT in the database.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify run_id exists
            cursor.execute("SELECT id FROM batch_runs WHERE id = ?", (run_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Batch run {run_id} not found")
            
            if cluster_id is not None:
                cursor.execute("""
                    SELECT 
                        cc.customer_id,
                        cc.cluster_id,
                        cc.distance_to_centroid,
                        c.first_name,
                        c.last_name,
                        c.annual_income,
                        c.profession,
                        c.segment_hint
                    FROM customer_clusters cc
                    JOIN customers c ON cc.customer_id = c.customer_id
                    WHERE cc.run_id = ? AND cc.cluster_id = ?
                    ORDER BY cc.distance_to_centroid
                    LIMIT ? OFFSET ?
                """, (run_id, cluster_id, limit, offset))
            else:
                cursor.execute("""
                    SELECT 
                        cc.customer_id,
                        cc.cluster_id,
                        cc.distance_to_centroid,
                        c.first_name,
                        c.last_name,
                        c.annual_income,
                        c.profession,
                        c.segment_hint
                    FROM customer_clusters cc
                    JOIN customers c ON cc.customer_id = c.customer_id
                    WHERE cc.run_id = ?
                    ORDER BY cc.cluster_id, cc.distance_to_centroid
                    LIMIT ? OFFSET ?
                """, (run_id, limit, offset))
            
            customers = []
            for row in cursor.fetchall():
                customers.append({
                    "customer_id": row['customer_id'],
                    "cluster_id": row['cluster_id'],
                    "distance_to_centroid": row['distance_to_centroid'],
                    "first_name": row['first_name'],
                    "last_name": row['last_name'],
                    "annual_income": row['annual_income'],
                    "profession": row['profession'],
                    "segment_hint": row['segment_hint']
                })
            
            return {"customers": customers, "count": len(customers)}
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_cluster_customers: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading customers: {str(e)}")


@router.get("/clusters/{run_id}/recommendations")
async def get_cluster_recommendations(
    run_id: int,
    customer_id: Optional[str] = Query(None, description="Filter by customer ID (TEXT type)"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Get recommendations for a specific run.
    
    Returns 404 if run_id does not exist in batch_runs table.
    Note: customer_id is stored as TEXT in the database, hence Optional[str].
    """
    print(f"\n[CLUSTERS API] Getting recommendations for run_id={run_id}, customer_id={customer_id}")
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify run_id exists
            cursor.execute("SELECT id FROM batch_runs WHERE id = ?", (run_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Batch run {run_id} not found")
            
            # Check if new columns exist in recommendations table
            try:
                cursor.execute("""
                    SELECT name FROM pragma_table_info('recommendations') WHERE name IN ('status', 'edited_narrative', 'sent_at', 'dismissed_at')
                """)
                existing_columns = {row['name'] for row in cursor.fetchall()}
            except Exception as col_check_error:
                print(f"[CLUSTERS API] Error checking columns: {col_check_error}")
                existing_columns = set()  # Assume no new columns if check fails
            
            has_status = 'status' in existing_columns
            has_edited = 'edited_narrative' in existing_columns
            has_sent = 'sent_at' in existing_columns
            has_dismissed = 'dismissed_at' in existing_columns
            
            print(f"[CLUSTERS API] Column check: status={has_status}, edited={has_edited}, sent={has_sent}, dismissed={has_dismissed}")
            
            # Build SELECT query with available columns
            status_fields = []
            if has_status:
                status_fields.append("r.status")
            if has_edited:
                status_fields.append("r.edited_narrative")
            if has_sent:
                status_fields.append("r.sent_at")
            if has_dismissed:
                status_fields.append("r.dismissed_at")
            
            # Build SELECT query with available columns
            base_select = """
                SELECT 
                    r.id,
                    r.customer_id,
                    r.product_code,
                    r.acceptance_prob,
                    r.expected_revenue,
                    re.narrative,
                    re.key_factors_json
            """
            
            if status_fields:
                status_select = ", " + ", ".join(status_fields)
            else:
                status_select = ""
            
            # Get total count first
            if customer_id:
                count_query = """
                    SELECT COUNT(*) as total
                    FROM recommendations r
                    WHERE r.run_id = ? AND r.customer_id = ?
                """
                cursor.execute(count_query, (run_id, customer_id))
            else:
                count_query = """
                    SELECT COUNT(*) as total
                    FROM recommendations r
                    WHERE r.run_id = ?
                """
                cursor.execute(count_query, (run_id,))
            
            total_count = cursor.fetchone()['total']
            print(f"[CLUSTERS API] Total recommendations: {total_count}")
            
            if customer_id:
                query = base_select + status_select + """
                    FROM recommendations r
                    LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                    WHERE r.run_id = ? AND r.customer_id = ?
                    ORDER BY r.acceptance_prob DESC
                    LIMIT ? OFFSET ?
                """
                print(f"[CLUSTERS API] Executing query with customer_id filter")
                cursor.execute(query, (run_id, customer_id, limit, offset))
            else:
                query = base_select + status_select + """
                    FROM recommendations r
                    LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                    WHERE r.run_id = ?
                    ORDER BY r.acceptance_prob DESC
                    LIMIT ? OFFSET ?
                """
                print(f"[CLUSTERS API] Executing query for all customers")
                cursor.execute(query, (run_id, limit, offset))
            
            rows = cursor.fetchall()
            print(f"[CLUSTERS API] Found {len(rows)} recommendations")
            
            recommendations = []
            for row in rows:
                try:
                    key_factors = {}
                    if row['key_factors_json']:
                        try:
                            key_factors = json.loads(row['key_factors_json'])
                        except:
                            pass
                    
                    # Get customer info for context (single query per recommendation)
                    cursor.execute("""
                        SELECT c.first_name, c.last_name, c.annual_income, c.profession,
                               cc.cluster_id, cc.distance_to_centroid
                        FROM customers c
                        LEFT JOIN customer_clusters cc ON c.customer_id = cc.customer_id AND cc.run_id = ?
                        WHERE c.customer_id = ?
                    """, (run_id, row['customer_id']))
                    customer_cluster_info = cursor.fetchone()
                    
                    # Get status fields from row (already in SELECT, use .get() for safety)
                    # Get optional fields safely (sqlite3.Row doesn't have .get() method)
                    edited_narrative = None
                    if has_edited:
                        try:
                            edited_narrative = row['edited_narrative'] if row['edited_narrative'] else None
                        except (KeyError, IndexError):
                            edited_narrative = None
                    
                    status = 'pending'
                    if has_status:
                        try:
                            status = row['status'] if row['status'] else 'pending'
                        except (KeyError, IndexError):
                            status = 'pending'
                    
                    sent_at = None
                    if has_sent:
                        try:
                            sent_at = row['sent_at'] if row['sent_at'] else None
                        except (KeyError, IndexError):
                            sent_at = None
                    
                    dismissed_at = None
                    if has_dismissed:
                        try:
                            dismissed_at = row['dismissed_at'] if row['dismissed_at'] else None
                        except (KeyError, IndexError):
                            dismissed_at = None
                    
                    recommendations.append({
                        "id": row['id'],
                        "customer_id": row['customer_id'],
                        "customer_name": f"{customer_cluster_info['first_name'] or ''} {customer_cluster_info['last_name'] or ''}".strip() if customer_cluster_info else None,
                        "customer_income": customer_cluster_info['annual_income'] if customer_cluster_info else None,
                        "customer_profession": customer_cluster_info['profession'] if customer_cluster_info else None,
                        "cluster_id": customer_cluster_info['cluster_id'] if customer_cluster_info else None,
                        "product_code": row['product_code'],
                        "acceptance_probability": row['acceptance_prob'],
                        "expected_revenue": row['expected_revenue'],
                        "narrative": edited_narrative if edited_narrative else row['narrative'],
                        "original_narrative": row['narrative'],
                        "is_edited": edited_narrative is not None,
                        "key_factors": key_factors,
                        "model_confidence": "high" if row['acceptance_prob'] > 0.7 else "medium" if row['acceptance_prob'] > 0.5 else "low",
                        "status": status,
                        "sent_at": sent_at,
                        "dismissed_at": dismissed_at
                    })
                except Exception as row_error:
                    # Get row ID safely for error logging
                    try:
                        row_id = row['id'] if row['id'] else 'unknown'
                    except (KeyError, IndexError):
                        row_id = 'unknown'
                    print(f"[CLUSTERS API] Error processing row {row_id}: {row_error}")
                    import traceback
                    traceback.print_exc()
                    continue  # Skip this row and continue
            
            print(f"[CLUSTERS API] Returning {len(recommendations)} recommendations")
            return {
                "recommendations": recommendations, 
                "count": len(recommendations),
                "total": total_count,
                "page": (offset // limit) + 1 if limit > 0 else 1,
                "page_size": limit,
                "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[CLUSTERS API] ERROR in get_cluster_recommendations: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading recommendations: {str(e)}")


@router.get("/clusters/{run_id}/comparison")
async def compare_batch_runs(run_id: int):
    """
    Compare current batch run with previous run.
    Returns metrics comparison and warnings about data drift.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify current run_id exists
            cursor.execute("SELECT id, started_at FROM batch_runs WHERE id = ?", (run_id,))
            current_run = cursor.fetchone()
            if not current_run:
                raise HTTPException(status_code=404, detail=f"Batch run {run_id} not found")
            
            # Get previous run
            cursor.execute("""
                SELECT id, started_at, finished_at, status, notes
                FROM batch_runs
                WHERE id < ? AND status = 'success'
                ORDER BY id DESC
                LIMIT 1
            """, (run_id,))
            previous_run = cursor.fetchone()
            
            if not previous_run:
                return {
                    "current_run_id": run_id,
                    "previous_run_id": None,
                    "has_comparison": False,
                    "message": "No previous successful run found for comparison"
                }
            
            # Get current run metrics
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT cc.customer_id) as customers,
                    COUNT(DISTINCT r.id) as recommendations,
                    SUM(r.expected_revenue) as revenue,
                    AVG(r.acceptance_prob) as avg_prob
                FROM customer_clusters cc
                LEFT JOIN recommendations r ON cc.customer_id = r.customer_id AND cc.run_id = r.run_id
                WHERE cc.run_id = ?
            """, (run_id,))
            current_metrics = cursor.fetchone()
            
            # Get previous run metrics
            prev_run_id = previous_run['id']
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT cc.customer_id) as customers,
                    COUNT(DISTINCT r.id) as recommendations,
                    SUM(r.expected_revenue) as revenue,
                    AVG(r.acceptance_prob) as avg_prob
                FROM customer_clusters cc
                LEFT JOIN recommendations r ON cc.customer_id = r.customer_id AND cc.run_id = r.run_id
                WHERE cc.run_id = ?
            """, (prev_run_id,))
            previous_metrics = cursor.fetchone()
            
            # Calculate changes
            def calc_change(current, previous):
                if previous == 0:
                    return None
                return ((current - previous) / previous) * 100
            
            customers_change = calc_change(current_metrics['customers'], previous_metrics['customers'])
            recommendations_change = calc_change(current_metrics['recommendations'], previous_metrics['recommendations'])
            revenue_change = calc_change(current_metrics['revenue'] or 0, previous_metrics['revenue'] or 0)
            prob_change = calc_change(current_metrics['avg_prob'] or 0, previous_metrics['avg_prob'] or 0)
            
            # Get cluster stability (how many customers stayed in same cluster)
            cursor.execute("""
                SELECT COUNT(*) as stable_customers
                FROM customer_clusters cc1
                JOIN customer_clusters cc2 ON cc1.customer_id = cc2.customer_id
                WHERE cc1.run_id = ? AND cc2.run_id = ? AND cc1.cluster_id = cc2.cluster_id
            """, (run_id, prev_run_id))
            stable_customers = cursor.fetchone()['stable_customers']
            
            total_customers = current_metrics['customers']
            stability_percent = (stable_customers / total_customers * 100) if total_customers > 0 else 0
            
            warnings = []
            if stability_percent < 70:
                warnings.append(f"Low cluster stability ({stability_percent:.1f}%). Significant customer movement detected.")
            if abs(customers_change or 0) > 20:
                warnings.append(f"Customer count changed by {abs(customers_change):.1f}%. Verify data consistency.")
            
            return {
                "current_run_id": run_id,
                "previous_run_id": prev_run_id,
                "has_comparison": True,
                "current": {
                    "customers": current_metrics['customers'],
                    "recommendations": current_metrics['recommendations'],
                    "revenue": current_metrics['revenue'] or 0.0,
                    "avg_acceptance_prob": current_metrics['avg_prob'] or 0.0
                },
                "previous": {
                    "customers": previous_metrics['customers'],
                    "recommendations": previous_metrics['recommendations'],
                    "revenue": previous_metrics['revenue'] or 0.0,
                    "avg_acceptance_prob": previous_metrics['avg_prob'] or 0.0
                },
                "changes": {
                    "customers_percent": customers_change,
                    "recommendations_percent": recommendations_change,
                    "revenue_percent": revenue_change,
                    "acceptance_prob_percent": prob_change,
                    "cluster_stability_percent": stability_percent
                },
                "warnings": warnings
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in compare_batch_runs: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error comparing batch runs: {str(e)}")


@router.get("/recommendations/{recommendation_id}")
async def get_recommendation_detail(recommendation_id: int):
    """
    Get detailed information about a specific recommendation including full explanation.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Get recommendation with explanation
            cursor.execute("""
                SELECT 
                    r.id,
                    r.run_id,
                    r.customer_id,
                    r.product_code,
                    r.acceptance_prob,
                    r.expected_revenue,
                    r.status,
                    r.edited_by,
                    r.edited_at,
                    r.edited_reason,
                    r.edited_narrative,
                    r.sent_at,
                    r.sent_by,
                    r.dismissed_at,
                    r.dismissed_by,
                    r.dismissed_reason,
                    r.created_at,
                    re.narrative,
                    re.key_factors_json,
                    re.model_name,
                    c.first_name,
                    c.last_name,
                    c.birth_date,
                    c.gender,
                    c.annual_income,
                    c.profession,
                    c.segment_hint,
                    cc.cluster_id
                FROM recommendations r
                LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                LEFT JOIN customers c ON r.customer_id = c.customer_id
                LEFT JOIN customer_clusters cc ON r.customer_id = cc.customer_id AND r.run_id = cc.run_id
                WHERE r.id = ?
            """, (recommendation_id,))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            key_factors = {}
            if row['key_factors_json']:
                try:
                    key_factors = json.loads(row['key_factors_json'])
                except:
                    pass
            
            # Get additional customer data for customer_snapshot
            customer_name = f"{row['first_name'] or ''} {row['last_name'] or ''}".strip()
            if not customer_name:
                customer_name = row['customer_id']
            
            # Calculate age from birth_date if available
            exact_age = None
            age_range = None
            if row['birth_date']:
                try:
                    from datetime import datetime
                    birth = datetime.strptime(row['birth_date'], "%Y-%m-%d")
                    today = datetime.now()
                    exact_age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
                    if exact_age < 30:
                        age_range = "Under 30"
                    elif exact_age < 45:
                        age_range = "30-45"
                    elif exact_age < 60:
                        age_range = "45-60"
                    else:
                        age_range = "60+"
                except:
                    pass
            
            # Format gender
            gender_display = None
            if row['gender']:
                gender_map = {'F': 'Female', 'M': 'Male', 'f': 'Female', 'm': 'Male'}
                gender_display = gender_map.get(row['gender'], row['gender'])
            
            # Format segment
            segment_display = None
            if row['segment_hint']:
                segment_map = {
                    'SB': 'Small Business',
                    'MM': 'Mass Market',
                    'PB': 'Private Banking',
                    'WM': 'Wealth Management'
                }
                segment_display = segment_map.get(row['segment_hint'], row['segment_hint'])
            
            # Build response in the format expected by frontend
            return {
                "recommendation_id": row['id'],
                "run_id": row['run_id'],
                "customer_snapshot": {
                    "customer_id": row['customer_id'],
                    "customer_name": customer_name,
                    "exact_age": exact_age,
                    "age_range": age_range,
                    "gender": gender_display,
                    "profession": row['profession'],
                    "annual_income": row['annual_income'],
                    "segment_hint": row['segment_hint'],
                    "segment": segment_display,
                    "cluster_id": row['cluster_id'],
                },
                "recommended_service": {
                    "id": row['id'],
                    "product_code": row['product_code'],
                    "acceptance_probability": float(row['acceptance_prob']),
                    "expected_revenue": float(row['expected_revenue']),
                    "status": row['status'] or 'pending',
                },
                "ai_explanation": {
                    "narrative": row['edited_narrative'] or row['narrative'] or "No explanation available",
                    "original_narrative": row['narrative'],
                    "key_factors": key_factors,
                },
                "model_name": row['model_name'],
                "model_confidence": "high" if row['acceptance_prob'] > 0.7 else "medium" if row['acceptance_prob'] > 0.5 else "low",
                "is_edited": row['edited_at'] is not None,
                "edited_by": row['edited_by'],
                "edited_at": row['edited_at'],
                "edited_reason": row['edited_reason'],
                "sent_at": row['sent_at'],
                "sent_by": row['sent_by'],
                "dismissed_at": row['dismissed_at'],
                "dismissed_by": row['dismissed_by'],
                "dismissed_reason": row['dismissed_reason'],
                "created_at": row['created_at']
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_recommendation_detail: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading recommendation: {str(e)}")


@router.put("/recommendations/{recommendation_id}")
async def update_recommendation(
    recommendation_id: int,
    narrative: Optional[str] = None,
    edited_reason: Optional[str] = None,
    edited_by: str = "advisor@wellbank.it"  # Default advisor, in production use auth
):
    """
    Update/edit a recommendation. Allows advisor to modify the AI-generated narrative.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify recommendation exists
            cursor.execute("SELECT id, status FROM recommendations WHERE id = ?", (recommendation_id,))
            rec = cursor.fetchone()
            if not rec:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            # Update recommendation
            from datetime import datetime
            update_fields = []
            update_values = []
            
            if narrative is not None:
                update_fields.append("edited_narrative = ?")
                update_values.append(narrative)
            
            if edited_reason is not None:
                update_fields.append("edited_reason = ?")
                update_values.append(edited_reason)
            
            if update_fields:
                update_fields.append("edited_by = ?")
                update_fields.append("edited_at = ?")
                update_fields.append("status = ?")
                update_values.extend([edited_by, datetime.now().isoformat(), "reviewed"])
                update_values.append(recommendation_id)
                
                cursor.execute(f"""
                    UPDATE recommendations 
                    SET {', '.join(update_fields)}
                    WHERE id = ?
                """, update_values)
                conn.commit()
            
            # Return updated recommendation
            return await get_recommendation_detail(recommendation_id)
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in update_recommendation: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error updating recommendation: {str(e)}")


@router.post("/recommendations/{recommendation_id}/send")
async def send_recommendation(
    recommendation_id: int,
    sent_by: str = "advisor@wellbank.it"  # Default advisor, in production use auth
):
    """
    Mark a recommendation as sent to the customer.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify recommendation exists
            cursor.execute("SELECT id, status FROM recommendations WHERE id = ?", (recommendation_id,))
            rec = cursor.fetchone()
            if not rec:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            if rec['status'] == 'sent':
                return {"message": "Recommendation already sent", "recommendation_id": recommendation_id}
            
            # Update status to sent
            from datetime import datetime
            cursor.execute("""
                UPDATE recommendations 
                SET status = 'sent', sent_at = ?, sent_by = ?
                WHERE id = ?
            """, (datetime.now().isoformat(), sent_by, recommendation_id))
            conn.commit()
            
            return {
                "message": "Recommendation sent successfully",
                "recommendation_id": recommendation_id,
                "sent_at": datetime.now().isoformat()
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in send_recommendation: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error sending recommendation: {str(e)}")


@router.post("/recommendations/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: int,
    dismissed_reason: Optional[str] = None,
    dismissed_by: str = "advisor@wellbank.it"  # Default advisor, in production use auth
):
    """
    Dismiss a recommendation (advisor decides not to send it).
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify recommendation exists
            cursor.execute("SELECT id, status FROM recommendations WHERE id = ?", (recommendation_id,))
            rec = cursor.fetchone()
            if not rec:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            # Update status to dismissed
            from datetime import datetime
            cursor.execute("""
                UPDATE recommendations 
                SET status = 'dismissed', dismissed_at = ?, dismissed_by = ?, dismissed_reason = ?
                WHERE id = ?
            """, (datetime.now().isoformat(), dismissed_by, dismissed_reason, recommendation_id))
            conn.commit()
            
            return {
                "message": "Recommendation dismissed",
                "recommendation_id": recommendation_id,
                "dismissed_at": datetime.now().isoformat()
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in dismiss_recommendation: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error dismissing recommendation: {str(e)}")


@router.get("/customers/{customer_id}/recommendations")
async def get_customer_recommendations(
    customer_id: str,
    run_id: Optional[int] = Query(None, description="Filter by batch run ID")
):
    """
    Get all recommendations for a specific customer with explanations.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify customer exists
            cursor.execute("SELECT customer_id FROM customers WHERE customer_id = ?", (customer_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")
            
            # Build query
            if run_id:
                cursor.execute("""
                    SELECT 
                        r.id,
                        r.run_id,
                        r.product_code,
                        r.acceptance_prob,
                        r.expected_revenue,
                        r.status,
                        r.edited_narrative,
                        r.sent_at,
                        r.dismissed_at,
                        re.narrative as original_narrative,
                        re.key_factors_json
                    FROM recommendations r
                    LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                    WHERE r.customer_id = ? AND r.run_id = ?
                    ORDER BY r.acceptance_prob DESC
                """, (customer_id, run_id))
            else:
                cursor.execute("""
                    SELECT 
                        r.id,
                        r.run_id,
                        r.product_code,
                        r.acceptance_prob,
                        r.expected_revenue,
                        r.status,
                        r.edited_narrative,
                        r.sent_at,
                        r.dismissed_at,
                        re.narrative as original_narrative,
                        re.key_factors_json
                    FROM recommendations r
                    LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                    WHERE r.customer_id = ?
                    ORDER BY r.run_id DESC, r.acceptance_prob DESC
                """, (customer_id,))
            
            recommendations = []
            for row in cursor.fetchall():
                key_factors = {}
                if row['key_factors_json']:
                    try:
                        key_factors = json.loads(row['key_factors_json'])
                    except:
                        pass
                
                recommendations.append({
                    "id": row['id'],
                    "run_id": row['run_id'],
                    "product_code": row['product_code'],
                    "acceptance_probability": row['acceptance_prob'],
                    "expected_revenue": row['expected_revenue'],
                    "status": row['status'],
                    "narrative": row['edited_narrative'] or row['original_narrative'],
                    "is_edited": row['edited_narrative'] is not None,
                    "key_factors": key_factors,
                    "sent_at": row['sent_at'],
                    "dismissed_at": row['dismissed_at']
                })
            
            return {"customer_id": customer_id, "recommendations": recommendations, "count": len(recommendations)}
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_customer_recommendations: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading customer recommendations: {str(e)}")


@router.get("/recommendations/{recommendation_id}/suggest-services")
async def get_ai_service_suggestions(recommendation_id: int):
    """
    Get AI-powered alternative service suggestions that may improve acceptance probability.
    Returns available service types and AI-suggested alternatives based on customer profile.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Get current recommendation and customer info
            cursor.execute("""
                SELECT 
                    r.customer_id,
                    r.product_code as current_product,
                    r.acceptance_prob as current_prob,
                    r.run_id,
                    c.annual_income,
                    c.profession,
                    c.age,
                    cc.cluster_id
                FROM recommendations r
                JOIN customers c ON r.customer_id = c.customer_id
                LEFT JOIN customer_clusters cc ON c.customer_id = cc.customer_id AND cc.run_id = r.run_id
                WHERE r.id = ?
            """, (recommendation_id,))
            
            rec_row = cursor.fetchone()
            if not rec_row:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            customer_id = rec_row['customer_id']
            current_product = rec_row['current_product']
            current_prob = rec_row['current_prob']
            annual_income = rec_row['annual_income'] or 0
            profession = rec_row['profession'] or ""
            age = rec_row['age'] or 0
            cluster_id = rec_row['cluster_id']
            
            # Get customer transaction stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as transaction_count,
                    SUM(amount) as total_spent,
                    AVG(amount) as avg_transaction
                FROM transactions
                WHERE customer_id = ?
            """, (customer_id,))
            tx_row = cursor.fetchone()
            transaction_count = tx_row['transaction_count'] or 0
            total_spent = tx_row['total_spent'] or 0
            
            # Get customer balance
            cursor.execute("""
                SELECT SUM(balance) as total_balance
                FROM holdings
                WHERE customer_id = ?
            """, (customer_id,))
            balance_row = cursor.fetchone()
            total_balance = balance_row['total_balance'] or 0
            
            # Define all available service types
            all_services = {
                "PREMIUM_INVESTMENT": {
                    "name": "Premium Investment Portfolio",
                    "category": "Investment",
                    "base_prob": 0.85,
                    "base_revenue": 5000.0,
                    "requirements": {"min_income": 50000, "min_balance": 100000}
                },
                "WEALTH_MANAGEMENT": {
                    "name": "Wealth Management Service",
                    "category": "Investment",
                    "base_prob": 0.75,
                    "base_revenue": 3000.0,
                    "requirements": {"min_income": 50000, "min_balance": 100000}
                },
                "REWARDS_CREDIT": {
                    "name": "Rewards Credit Card",
                    "category": "Credit",
                    "base_prob": 0.70,
                    "base_revenue": 800.0,
                    "requirements": {"min_transactions": 50}
                },
                "PERSONAL_LOAN": {
                    "name": "Personal Loan",
                    "category": "Credit",
                    "base_prob": 0.60,
                    "base_revenue": 2000.0,
                    "requirements": {"max_balance": 10000, "min_spending": 50000}
                },
                "SAVINGS_PLAN": {
                    "name": "Savings Plan",
                    "category": "Savings",
                    "base_prob": 0.65,
                    "base_revenue": 500.0,
                    "requirements": {"max_age": 35, "min_income": 30000}
                },
                "BASIC_CHECKING": {
                    "name": "Enhanced Checking Account",
                    "category": "Account",
                    "base_prob": 0.50,
                    "base_revenue": 200.0,
                    "requirements": {}
                },
                "BUSINESS_ACCOUNT": {
                    "name": "Business Account",
                    "category": "Account",
                    "base_prob": 0.65,
                    "base_revenue": 1500.0,
                    "requirements": {"min_income": 40000}
                },
                "MORTGAGE": {
                    "name": "Mortgage Loan",
                    "category": "Credit",
                    "base_prob": 0.55,
                    "base_revenue": 10000.0,
                    "requirements": {"min_income": 35000}
                }
            }
            
            # AI-powered suggestions: Calculate improved acceptance probabilities
            suggestions = []
            for product_code, service_info in all_services.items():
                if product_code == current_product:
                    continue  # Skip current product
                
                # Calculate fit score based on customer profile
                fit_score = 0.5  # Base score
                
                # Check requirements and adjust fit
                reqs = service_info.get("requirements", {})
                if "min_income" in reqs and annual_income >= reqs["min_income"]:
                    fit_score += 0.15
                if "min_balance" in reqs and total_balance >= reqs["min_balance"]:
                    fit_score += 0.15
                if "min_transactions" in reqs and transaction_count >= reqs["min_transactions"]:
                    fit_score += 0.15
                if "min_spending" in reqs and total_spent >= reqs["min_spending"]:
                    fit_score += 0.10
                if "max_age" in reqs and age <= reqs["max_age"]:
                    fit_score += 0.10
                if "max_balance" in reqs and total_balance <= reqs["max_balance"]:
                    fit_score += 0.10
                
                # Adjust based on profession keywords
                profession_lower = profession.lower()
                if "business" in profession_lower and "BUSINESS" in product_code:
                    fit_score += 0.10
                if any(word in profession_lower for word in ["manager", "director", "executive"]) and "PREMIUM" in product_code:
                    fit_score += 0.10
                
                # Calculate improved acceptance probability
                base_prob = service_info["base_prob"]
                improved_prob = min(0.95, base_prob * (0.7 + fit_score * 0.3))
                
                # Calculate probability improvement vs current
                prob_improvement = improved_prob - current_prob
                
                # Only suggest if it's better or similar (within 5%)
                if prob_improvement >= -0.05:
                    suggestions.append({
                        "product_code": product_code,
                        "product_name": service_info["name"],
                        "category": service_info["category"],
                        "acceptance_probability": round(improved_prob, 3),
                        "expected_revenue": service_info["base_revenue"],
                        "probability_improvement": round(prob_improvement, 3),
                        "fit_score": round(fit_score, 2),
                        "reason": _generate_suggestion_reason(product_code, annual_income, total_balance, transaction_count, age, profession)
                    })
            
            # Sort by probability improvement (best first)
            suggestions.sort(key=lambda x: x["probability_improvement"], reverse=True)
            
            return {
                "current_product": current_product,
                "current_acceptance_probability": current_prob,
                "available_services": list(all_services.keys()),
                "suggestions": suggestions[:5],  # Top 5 suggestions
                "customer_profile": {
                    "annual_income": annual_income,
                    "total_balance": total_balance,
                    "transaction_count": transaction_count,
                    "age": age,
                    "profession": profession,
                    "cluster_id": cluster_id
                }
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_ai_service_suggestions: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error generating service suggestions: {str(e)}")


def _generate_suggestion_reason(product_code, income, balance, tx_count, age, profession):
    """Generate a human-readable reason for why this service is suggested."""
    reasons = []
    
    if "PREMIUM" in product_code or "WEALTH" in product_code:
        if income > 50000:
            reasons.append("High income profile")
        if balance > 100000:
            reasons.append("Strong asset base")
    elif "REWARDS" in product_code:
        if tx_count > 50:
            reasons.append("Active transaction pattern")
        if income > 30000:
            reasons.append("Stable income")
    elif "LOAN" in product_code:
        if balance < 10000:
            reasons.append("Potential credit need")
    elif "SAVINGS" in product_code:
        if age < 35:
            reasons.append("Young professional")
        if income > 30000:
            reasons.append("Growing income potential")
    elif "BUSINESS" in product_code:
        if "business" in profession.lower():
            reasons.append("Business professional")
    
    if not reasons:
        reasons.append("Good fit based on profile")
    
    return "; ".join(reasons)
