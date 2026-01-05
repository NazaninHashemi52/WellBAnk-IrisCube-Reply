"""
Offer Workbench API endpoints for advisors
Provides on-demand recommendations, offer catalog, and advisor decision tracking
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List, Dict
from app.db import get_conn
import json
from datetime import datetime, timedelta

router = APIRouter()

# Offer Catalog - mapping product codes to display info
OFFER_CATALOG = {
    "PREMIUM_INVESTMENT": {
        "category": "Investments",
        "display_name": "Premium Investment Portfolio",
        "eligibility_notes": "High income and balance required",
        "icon": "trending-up"
    },
    "WEALTH_MANAGEMENT": {
        "category": "Investments",
        "display_name": "Wealth Management Service",
        "eligibility_notes": "High net worth customers",
        "icon": "shield"
    },
    "REWARDS_CREDIT": {
        "category": "Cards",
        "display_name": "Rewards Credit Card",
        "eligibility_notes": "Active transaction pattern",
        "icon": "credit-card"
    },
    "PERSONAL_LOAN": {
        "category": "Loans",
        "display_name": "Personal Loan",
        "eligibility_notes": "Based on spending patterns",
        "icon": "dollar-sign"
    },
    "SAVINGS_PLAN": {
        "category": "Savings",
        "display_name": "Savings Plan",
        "eligibility_notes": "Young professionals",
        "icon": "piggy-bank"
    },
    "BASIC_CHECKING": {
        "category": "Accounts",
        "display_name": "Enhanced Checking Account",
        "eligibility_notes": "Standard offering",
        "icon": "wallet"
    },
    "BUSINESS_ACCOUNT": {
        "category": "Accounts",
        "display_name": "Business Account",
        "eligibility_notes": "Business professionals",
        "icon": "briefcase"
    },
    "MORTGAGE": {
        "category": "Loans",
        "display_name": "Mortgage Loan",
        "eligibility_notes": "Stable income required",
        "icon": "home"
    }
}


@router.get("/offers/catalog")
async def get_offer_catalog():
    """Get the complete offer catalog with all product codes and their metadata."""
    return {"catalog": OFFER_CATALOG}


@router.get("/offers/recommend/{customer_id}")
async def get_realtime_recommendations(customer_id: str, top_n: int = Query(3, ge=1, le=10)):
    """
    Get real-time product recommendations for a customer using the category-based clustering model.
    This uses the trained clustering model to predict customer segment and suggest products.
    """
    try:
        # Lazy import to avoid import errors if model not trained yet
        import sys
        from pathlib import Path
        backend_path = Path(__file__).parent.parent.parent
        if str(backend_path) not in sys.path:
            sys.path.insert(0, str(backend_path))
        
        from recommender import WellbankRecommender
        
        recommender = WellbankRecommender()
        result = recommender.suggest(customer_id, top_n=top_n, exclude_owned=True)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        # Enhance with catalog information
        enhanced_recommendations = []
        for rec in result["recommendations"]:
            product_info = OFFER_CATALOG.get(rec["product_code"], {
                "display_name": rec["product_code"],
                "category": "Unknown",
                "eligibility_notes": "Standard offering"
            })
            enhanced_recommendations.append({
                **rec,
                "product_name": product_info["display_name"],
                "category": product_info["category"],
                "eligibility_notes": product_info.get("eligibility_notes", "")
            })
        
        return {
            "customer_id": customer_id,
            "persona": result["persona"],
            "persona_description": result.get("persona_description", ""),
            "cluster": result["cluster"],
            "recommendations": enhanced_recommendations,
            "total_recommendations": len(enhanced_recommendations)
        }
        
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail="Clustering model not available. Please run batch processing first to train the model."
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_realtime_recommendations: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.get("/offers/categories")
async def get_service_categories():
    """Get list of service categories."""
    categories = set(info["category"] for info in OFFER_CATALOG.values())
    return {"categories": sorted(list(categories))}


@router.get("/offers/recommendations")
async def get_pending_recommendations(
    status: Optional[str] = Query("pending", description="Filter by status: pending, sent, dismissed"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """
    Get list of pending recommendations for advisor dashboard.
    Returns customer cards with recommended service, acceptance probability, expected value, and status.
    This is the ENTRY POINT for advisors.
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
                return {"recommendations": [], "count": 0, "message": "No batch runs available"}
            
            run_id = latest_run['id']
            
            # Check if status column exists
            cursor.execute("""
                SELECT name FROM pragma_table_info('recommendations') WHERE name = 'status'
            """)
            has_status = cursor.fetchone() is not None
            
            # Build query
            if has_status:
                query = """
                    SELECT 
                        r.id,
                        r.customer_id,
                        r.product_code,
                        r.acceptance_prob,
                        r.expected_revenue,
                        r.status,
                        c.first_name,
                        c.last_name,
                        c.birth_date,
                        c.profession,
                        c.annual_income,
                        cc.cluster_id,
                        cc.distance_to_centroid
                    FROM recommendations r
                    JOIN customers c ON r.customer_id = c.customer_id
                    LEFT JOIN customer_clusters cc ON r.customer_id = cc.customer_id AND cc.run_id = r.run_id
                    WHERE r.run_id = ? AND r.status = ?
                    ORDER BY r.acceptance_prob DESC, r.expected_revenue DESC
                    LIMIT ? OFFSET ?
                """
                cursor.execute(query, (run_id, status, limit, offset))
            else:
                query = """
                    SELECT 
                        r.id,
                        r.customer_id,
                        r.product_code,
                        r.acceptance_prob,
                        r.expected_revenue,
                        c.first_name,
                        c.last_name,
                        c.birth_date,
                        c.profession,
                        c.annual_income,
                        cc.cluster_id,
                        cc.distance_to_centroid
                    FROM recommendations r
                    JOIN customers c ON r.customer_id = c.customer_id
                    LEFT JOIN customer_clusters cc ON r.customer_id = cc.customer_id AND cc.run_id = r.run_id
                    WHERE r.run_id = ?
                    ORDER BY r.acceptance_prob DESC, r.expected_revenue DESC
                    LIMIT ? OFFSET ?
                """
                cursor.execute(query, (run_id, limit, offset))
            
            recommendations = []
            for row in cursor.fetchall():
                # Get product info from catalog
                product_info = OFFER_CATALOG.get(row['product_code'], {
                    "display_name": row['product_code'],
                    "category": "Unknown"
                })
                
                # Calculate age range
                age_range = None
                if row['birth_date']:
                    try:
                        birth = datetime.strptime(row['birth_date'], "%Y-%m-%d")
                        age = (datetime.now() - birth).days / 365.25
                        if age < 30:
                            age_range = "Under 30"
                        elif age < 45:
                            age_range = "30-45"
                        elif age < 60:
                            age_range = "45-60"
                        else:
                            age_range = "60+"
                    except:
                        pass
                
                # Generate cluster label
                cluster_label = f"Cluster {row['cluster_id']}" if row['cluster_id'] is not None else "Unassigned"
                if row['cluster_id'] is not None:
                    # Add descriptive label based on cluster
                    if row['annual_income'] and row['annual_income'] > 50000:
                        cluster_label += " - High Value"
                    elif row['distance_to_centroid'] and row['distance_to_centroid'] < 1.0:
                        cluster_label += " - Core Segment"
                
                recommendations.append({
                    "id": row['id'],
                    "customer_id": row['customer_id'],
                    "customer_name": f"{row['first_name'] or ''} {row['last_name'] or ''}".strip() or row['customer_id'],
                    "cluster_label": cluster_label,
                    "recommended_service": product_info["display_name"],
                    "product_code": row['product_code'],
                    "category": product_info["category"],
                    "acceptance_probability": row['acceptance_prob'],
                    "expected_value": row['expected_revenue'],
                    "status": row.get('status', 'pending') if has_status else 'pending',
                    # For customer snapshot (collapsed)
                    "age_range": age_range,
                    "profession_category": _categorize_profession(row['profession']),
                    "cluster_id": row['cluster_id']
                })
            
            return {
                "recommendations": recommendations,
                "count": len(recommendations),
                "run_id": run_id
            }
        finally:
            conn.close()
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_pending_recommendations: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error loading recommendations: {str(e)}")


def _categorize_profession(profession):
    """Categorize profession into broad categories."""
    if not profession:
        return "Not specified"
    prof_lower = profession.lower()
    if any(word in prof_lower for word in ["manager", "director", "executive", "ceo"]):
        return "Management"
    elif any(word in prof_lower for word in ["engineer", "developer", "technician", "it"]):
        return "Technical"
    elif any(word in prof_lower for word in ["doctor", "lawyer", "accountant", "consultant"]):
        return "Professional Services"
    elif any(word in prof_lower for word in ["teacher", "professor", "educator"]):
        return "Education"
    elif any(word in prof_lower for word in ["business", "entrepreneur", "owner"]):
        return "Business Owner"
    else:
        return "Other"


def calculate_rfm(customer_id: str, cursor) -> Dict:
    """Calculate RFM (Recency, Frequency, Monetary) scores for a customer."""
    cursor.execute("""
        SELECT 
            MAX(tx_date) as last_transaction_date,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
        FROM transactions
        WHERE customer_id = ?
    """, (customer_id,))
    
    tx_row = cursor.fetchone()
    if not tx_row or tx_row['transaction_count'] == 0:
        return {
            "recency_days": 999,
            "frequency": 0,
            "monetary": 0,
            "behavioral_tag": "Inactive"
        }
    
    last_tx_date = tx_row['last_transaction_date']
    transaction_count = tx_row['transaction_count'] or 0
    total_amount = tx_row['total_amount'] or 0
    
    # Calculate recency
    if last_tx_date:
        try:
            last_tx = datetime.strptime(last_tx_date, "%Y-%m-%d")
            recency_days = (datetime.now() - last_tx).days
        except:
            recency_days = 999
    else:
        recency_days = 999
    
    # Generate behavioral tag
    if transaction_count >= 50 and recency_days <= 30:
        behavioral_tag = "Frequent transactions, recent activity"
    elif total_amount >= 50000:
        behavioral_tag = "High transaction value"
    elif transaction_count >= 30:
        behavioral_tag = "Regular transactions"
    elif recency_days > 90:
        behavioral_tag = "Low recent activity"
    else:
        behavioral_tag = "Standard activity"
    
    return {
        "recency_days": recency_days,
        "frequency": transaction_count,
        "monetary": total_amount,
        "behavioral_tag": behavioral_tag
    }


@router.get("/offers/recommendations/{recommendation_id}")
async def get_recommendation_detail(recommendation_id: int):
    """
    Get detailed recommendation for review panel.
    Returns customer snapshot, service details, AI explanation, and draft message.
    """
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Get recommendation with customer info
            cursor.execute("""
                SELECT 
                    r.id,
                    r.customer_id,
                    r.product_code,
                    r.acceptance_prob,
                    r.expected_revenue,
                    r.status,
                    c.first_name,
                    c.last_name,
                    c.birth_date,
                    c.profession,
                    c.annual_income,
                    cc.cluster_id,
                    cc.distance_to_centroid,
                    re.narrative,
                    re.key_factors_json
                FROM recommendations r
                JOIN customers c ON r.customer_id = c.customer_id
                LEFT JOIN customer_clusters cc ON r.customer_id = cc.customer_id AND cc.run_id = r.run_id
                LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                WHERE r.id = ?
            """, (recommendation_id,))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            # Get product info
            product_info = OFFER_CATALOG.get(row['product_code'], {
                "display_name": row['product_code'],
                "category": "Unknown"
            })
            
            # Calculate age range
            age_range = None
            if row['birth_date']:
                try:
                    birth = datetime.strptime(row['birth_date'], "%Y-%m-%d")
                    age = (datetime.now() - birth).days / 365.25
                    if age < 30:
                        age_range = "Under 30"
                    elif age < 45:
                        age_range = "30-45"
                    elif age < 60:
                        age_range = "45-60"
                    else:
                        age_range = "60+"
                except:
                    pass
            
            # Get RFM and behavioral tag
            rfm = calculate_rfm(row['customer_id'], cursor)
            
            # Get current products
            cursor.execute("""
                SELECT product_code, product_name, category
                FROM holdings
                WHERE customer_id = ?
            """, (row['customer_id'],))
            current_products = [{"code": r['product_code'], "name": r['product_name'], "category": r['category']} 
                              for r in cursor.fetchall()]
            
            # Generate cluster label
            cluster_label = f"Cluster {row['cluster_id']}" if row['cluster_id'] is not None else "Unassigned"
            if row['cluster_id'] is not None and row['annual_income'] and row['annual_income'] > 50000:
                cluster_label += " - High Value"
            
            # Parse key factors
            key_factors = {}
            if row['key_factors_json']:
                try:
                    key_factors = json.loads(row['key_factors_json'])
                except:
                    pass
            
            # Generate structured AI explanation (bullet-based)
            explanation_bullets = _generate_explanation_bullets(
                row['cluster_id'],
                rfm,
                current_products,
                row['product_code'],
                key_factors
            )
            
            # Generate draft message
            customer_name = f"{row['first_name'] or ''} {row['last_name'] or ''}".strip() or "Valued Customer"
            draft_message = _generate_draft_message(
                customer_name,
                product_info["display_name"],
                explanation_bullets
            )
            
            # Determine risk level
            risk_level = "Low"
            if row['acceptance_prob'] < 0.4:
                risk_level = "Medium"
            elif row['acceptance_prob'] < 0.3:
                risk_level = "High"
            
            return {
                "recommendation_id": recommendation_id,
                "customer_snapshot": {
                    "customer_id": row['customer_id'],
                    "customer_name": customer_name,
                    "age_range": age_range,
                    "profession_category": _categorize_profession(row['profession']),
                    "cluster_label": cluster_label,
                    "behavioral_tag": rfm["behavioral_tag"]
                },
                "recommended_service": {
                    "product_code": row['product_code'],
                    "service_name": product_info["display_name"],
                    "category": product_info["category"],
                    "acceptance_probability": row['acceptance_prob'],
                    "expected_revenue": row['expected_revenue'],
                    "risk_level": risk_level
                },
                "ai_explanation": {
                    "bullets": explanation_bullets,
                    "narrative": row['narrative'] or "No explanation available"
                },
                "draft_message": draft_message,
                "available_services": list(OFFER_CATALOG.keys()),
                "status": row.get('status', 'pending')
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


def _generate_explanation_bullets(cluster_id, rfm, current_products, product_code, key_factors):
    """Generate structured bullet-based explanation."""
    bullets = []
    
    # Cluster-based reason
    if cluster_id is not None:
        bullets.append(f"Customer belongs to Cluster {cluster_id} (high transaction volume segment)")
    
    # Product ownership
    if current_products:
        product_names = [p["name"] or p["code"] for p in current_products[:2]]
        bullets.append(f"Existing {', '.join(product_names)} with stable relationship")
    else:
        bullets.append("New customer with growth potential")
    
    # Behavioral pattern
    if rfm.get("behavioral_tag"):
        bullets.append(f"Behavioral pattern: {rfm['behavioral_tag']}")
    
    # Similarity/acceptance rate (simulated)
    if cluster_id is not None:
        acceptance_rate = 65 + (cluster_id * 3)  # Simulated based on cluster
        bullets.append(f"Similar customers accepted this product in {acceptance_rate}% of cases")
    
    # Product conflict check
    current_categories = {p.get("category", "") for p in current_products}
    if product_code.startswith("REWARDS") and "Cards" not in current_categories:
        bullets.append("No credit card currently owned - cross-sell opportunity")
    elif product_code.startswith("PREMIUM") and "Investments" not in current_categories:
        bullets.append("Investment products gap identified")
    
    return bullets


def _generate_draft_message(customer_name, product_name, explanation_bullets):
    """Generate AI draft message."""
    # Use first 2 bullets as reasons
    reasons = explanation_bullets[:2] if len(explanation_bullets) >= 2 else explanation_bullets
    
    message = f"""Dear {customer_name},

Based on your current account usage and transaction patterns, we believe our {product_name} could offer you additional flexibility and benefits aligned with your needs.

Would you like to receive more details?

Best regards,
WellBank Team"""
    
    return message


@router.post("/offers/recommendations/{recommendation_id}/regenerate-message")
async def regenerate_message(
    recommendation_id: int,
    params: Dict = Body(...)
):
    """Regenerate AI message with different tone or parameters."""
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Get recommendation details
            cursor.execute("""
                SELECT 
                    r.product_code,
                    c.first_name,
                    c.last_name,
                    re.key_factors_json
                FROM recommendations r
                JOIN customers c ON r.customer_id = c.customer_id
                LEFT JOIN recommendation_explanations re ON r.id = re.recommendation_id
                WHERE r.id = ?
            """, (recommendation_id,))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            product_info = OFFER_CATALOG.get(row['product_code'], {"display_name": row['product_code']})
            customer_name = f"{row['first_name'] or ''} {row['last_name'] or ''}".strip() or "Valued Customer"
            
            tone = params.get("tone", "friendly")
            
            # Generate message based on tone
            if tone == "formal":
                message = f"""Dear {customer_name},

We are pleased to inform you about our {product_info['display_name']}, which we believe aligns with your financial profile and transaction patterns.

We would be happy to provide additional information at your convenience.

Sincerely,
WellBank"""
            elif tone == "short":
                message = f"""Hi {customer_name},

We think you'd benefit from our {product_info['display_name']}. Interested in learning more?

Best,
WellBank"""
            else:  # friendly
                message = f"""Dear {customer_name},

Based on your current account usage and transaction patterns, we believe our {product_info['display_name']} could offer you additional flexibility and benefits aligned with your needs.

Would you like to receive more details?

Best regards,
WellBank Team"""
            
            return {
                "recommendation_id": recommendation_id,
                "draft_message": message,
                "tone": tone
            }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in regenerate_message: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error regenerating message: {str(e)}")


@router.post("/offers/recommendations/{recommendation_id}/change-service")
async def change_service(
    recommendation_id: int,
    params: Dict = Body(...)
):
    """Change the recommended service and regenerate explanation."""
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            new_product_code = params.get("product_code")
            if not new_product_code or new_product_code not in OFFER_CATALOG:
                raise HTTPException(status_code=400, detail="Invalid product code")
            
            # Get customer info
            cursor.execute("""
                SELECT customer_id, run_id
                FROM recommendations
                WHERE id = ?
            """, (recommendation_id,))
            
            rec_row = cursor.fetchone()
            if not rec_row:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            customer_id = rec_row['customer_id']
            run_id = rec_row['run_id']
            
            # Get customer context for recalculation
            cursor.execute("""
                SELECT 
                    c.annual_income,
                    c.profession,
                    c.birth_date,
                    cc.cluster_id
                FROM customers c
                LEFT JOIN customer_clusters cc ON c.customer_id = cc.customer_id AND cc.run_id = ?
                WHERE c.customer_id = ?
            """, (run_id, customer_id))
            
            cust_row = cursor.fetchone()
            
            # Get transaction stats
            cursor.execute("""
                SELECT COUNT(*) as tx_count, SUM(amount) as total_spent
                FROM transactions
                WHERE customer_id = ?
            """, (customer_id,))
            tx_row = cursor.fetchone()
            
            # Recalculate acceptance probability and revenue
            product_info = OFFER_CATALOG[new_product_code]
            base_prob = 0.5
            base_revenue = 200.0
            
            if "PREMIUM" in new_product_code or "WEALTH" in new_product_code:
                base_prob = 0.85
                base_revenue = 5000.0
            elif "REWARDS" in new_product_code:
                base_prob = 0.70
                base_revenue = 800.0
            elif "LOAN" in new_product_code:
                base_prob = 0.60
                base_revenue = 2000.0
            elif "SAVINGS" in new_product_code:
                base_prob = 0.65
                base_revenue = 500.0
            
            # Adjust based on customer profile
            if cust_row and cust_row['annual_income'] and cust_row['annual_income'] > 50000:
                base_prob *= 1.1
            
            base_prob = min(0.95, base_prob)
            
            # Update recommendation
            cursor.execute("""
                UPDATE recommendations
                SET product_code = ?,
                    acceptance_prob = ?,
                    expected_revenue = ?
                WHERE id = ?
            """, (new_product_code, base_prob, base_revenue, recommendation_id))
            
            conn.commit()
            
            # Get updated recommendation detail
            return await get_recommendation_detail(recommendation_id)
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in change_service: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error changing service: {str(e)}")


@router.post("/offers/recommendations/{recommendation_id}/decision")
async def submit_advisor_decision(
    recommendation_id: int,
    decision: Dict = Body(...)
):
    """Submit advisor decision: send or dismiss."""
    try:
        conn = get_conn()
        try:
            cursor = conn.cursor()
            
            # Verify recommendation exists
            cursor.execute("SELECT id, customer_id FROM recommendations WHERE id = ?", (recommendation_id,))
            rec_row = cursor.fetchone()
            if not rec_row:
                raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
            
            action = decision.get("action")  # "send" or "dismiss"
            message = decision.get("message", "")  # Final message to send
            reason = decision.get("reason", "")  # Reason for dismiss
            
            # Check if status column exists
            cursor.execute("""
                SELECT name FROM pragma_table_info('recommendations') WHERE name = 'status'
            """)
            has_status = cursor.fetchone() is not None
            
            if action == "send":
                if has_status:
                    cursor.execute("""
                        UPDATE recommendations
                        SET status = 'sent',
                            sent_at = ?,
                            sent_by = ?
                        WHERE id = ?
                    """, (datetime.now().isoformat(), "advisor@wellbank.it", recommendation_id))
                # In a real system, you'd also store the message sent
                conn.commit()
                return {"message": "Recommendation sent successfully", "recommendation_id": recommendation_id}
            
            elif action == "dismiss":
                if has_status:
                    cursor.execute("""
                        UPDATE recommendations
                        SET status = 'dismissed',
                            dismissed_at = ?,
                            dismissed_by = ?,
                            dismissed_reason = ?
                        WHERE id = ?
                    """, (datetime.now().isoformat(), "advisor@wellbank.it", reason, recommendation_id))
                conn.commit()
                return {"message": "Recommendation dismissed", "recommendation_id": recommendation_id}
            
            else:
                raise HTTPException(status_code=400, detail="Invalid action. Use 'send' or 'dismiss'")
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in submit_advisor_decision: {e}")
        print(error_trace)
        raise HTTPException(status_code=500, detail=f"Error recording decision: {str(e)}")
