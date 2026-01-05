"""
WellBank Product Recommender
Production-ready recommender using category-based clustering model.
Integrates with FastAPI backend and database structure.
"""

import pandas as pd
import numpy as np
import joblib
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Add backend to path for imports
backend_path = Path(__file__).parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.db import get_conn

# Model directory
MODELS_DIR = Path(__file__).parent / "models"


class WellbankRecommender:
    """
    Production recommender using pre-trained clustering model.
    Provides product recommendations based on customer segmentation.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize recommender with pre-trained model.
        
        Args:
            model_path: Optional path to model file. Defaults to models/cluster_model_categories.pkl
        """
        if model_path is None:
            model_path = MODELS_DIR / "cluster_model_categories.pkl"
        else:
            model_path = Path(model_path)
        
        # Load the pre-trained model
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                f"Please run clustering first: python implement_best_clustering_categories.py"
            )
        
        self.model = joblib.load(model_path)
        self.scaler = getattr(self.model, 'scaler', None)
        
        # Load feature columns
        features_path = MODELS_DIR / "feature_columns_categories.pkl"
        if features_path.exists():
            self.feature_columns = joblib.load(features_path)
        else:
            raise FileNotFoundError(
                f"Feature columns not found at {features_path}. "
                f"Please run clustering first."
            )
        
        # Business Personas - Mapping Cluster IDs to product strategies
        # Based on category-based clustering analysis
        self.cluster_strategies = {
            0: {
                "name": "Conservative Savers",
                "description": "Low transaction volume, high savings focus",
                "suggestions": ["DPAM682", "FPEN058", "SAVINGS_PLAN"],  # SharesVault, Pension Fund
                "acceptance_prob_base": 0.75
            },
            1: {
                "name": "High Volume Spenders",
                "description": "Frequent transactions across multiple categories",
                "suggestions": ["CADB439", "CACR432", "REWARDS_CREDIT"],  # ZynaFlow Plus, Credit Card Gold
                "acceptance_prob_base": 0.70
            },
            2: {
                "name": "Young Professionals",
                "description": "Active users with growing income potential",
                "suggestions": ["PRPE078", "CADB783", "SAVINGS_PLAN"],  # Personal Loan, EasyYoung Debit
                "acceptance_prob_base": 0.65
            },
            3: {
                "name": "Family/Home Focused",
                "description": "Stable income, home-related spending patterns",
                "suggestions": ["MTUU356", "ASSA566", "MORTGAGE"],  # NestHouse Mortgage, Insurance
                "acceptance_prob_base": 0.72
            },
            4: {
                "name": "Investment Seekers",
                "description": "Diverse product portfolio, investment-oriented",
                "suggestions": ["SINV263", "CINV819", "PREMIUM_INVESTMENT"],  # InvestoUniq, Fund Portfolio
                "acceptance_prob_base": 0.80
            },
            5: {
                "name": "Basic Users",
                "description": "Minimal product usage, standard banking needs",
                "suggestions": ["CCOR602", "CADB877", "BASIC_CHECKING"]  # MyEnergy Account, ZynaFlow Basic
            }
        }
    
    def get_user_features_from_db(self, client_id: str) -> Optional[pd.DataFrame]:
        """
        Fetch and prepare user features from database for prediction.
        Uses the same feature engineering as clustering.
        
        Args:
            client_id: Customer ID
            
        Returns:
            DataFrame with features in the same order as training, or None if not found
        """
        conn = get_conn()
        
        try:
            # Check if customer exists
            customer = pd.read_sql_query(
                "SELECT customer_id FROM customers WHERE customer_id = ?",
                conn,
                params=(client_id,)
            )
            
            if len(customer) == 0:
                return None
            
            # Load customer's transactions
            transactions = pd.read_sql_query(
                """
                SELECT 
                    customer_id,
                    tx_date,
                    amount,
                    tx_category,
                    channel
                FROM transactions
                WHERE customer_id = ?
                """,
                conn,
                params=(client_id,)
            )
            
            # Load customer's holdings
            holdings = pd.read_sql_query(
                """
                SELECT 
                    customer_id,
                    product_code,
                    category,
                    balance
                FROM holdings
                WHERE customer_id = ?
                """,
                conn,
                params=(client_id,)
            )
            
            # Feature engineering (same as clustering)
            features_dict = {}
            
            # Transaction category features
            if len(transactions) > 0:
                transactions['tx_date'] = pd.to_datetime(transactions['tx_date'], errors='coerce')
                
                # Category totals
                tx_by_category = transactions.groupby('tx_category')['amount'].sum()
                for category, total in tx_by_category.items():
                    features_dict[f'categoria_mode_{category}'] = total
                
                # Category counts
                tx_counts = transactions.groupby('tx_category').size()
                for category, count in tx_counts.items():
                    features_dict[f'categoria_count_{category}'] = count
                
                # Overall stats
                features_dict['importo_total'] = transactions['amount'].sum()
                features_dict['spending_avg'] = transactions['amount'].mean()
                features_dict['spending_std'] = transactions['amount'].std()
                features_dict['transaction_count'] = len(transactions)
                features_dict['transaction_min'] = transactions['amount'].min()
                features_dict['transaction_max'] = transactions['amount'].max()
            
            # Product category features
            if len(holdings) > 0:
                holdings_by_category = holdings.groupby('category')['balance'].sum()
                for category, balance in holdings_by_category.items():
                    features_dict[f'product_category_balance_{category}'] = balance
                
                features_dict['total_balance'] = holdings['balance'].sum()
                features_dict['avg_balance'] = holdings['balance'].mean()
                features_dict['product_count'] = len(holdings)
            
            # Create feature vector matching training columns
            feature_vector = pd.DataFrame([features_dict])
            
            # Ensure all required feature columns exist (fill missing with 0)
            for col in self.feature_columns:
                if col not in feature_vector.columns:
                    feature_vector[col] = 0
            
            # Select only the features used in training (in correct order)
            feature_vector = feature_vector[self.feature_columns]
            
            # Clean data
            feature_vector = feature_vector.replace([np.inf, -np.inf], 0)
            feature_vector = feature_vector.fillna(0)
            
            return feature_vector
            
        finally:
            conn.close()
    
    def get_owned_products(self, client_id: str) -> set:
        """
        Get products the customer already owns to avoid redundant suggestions.
        
        Args:
            client_id: Customer ID
            
        Returns:
            Set of product codes
        """
        conn = get_conn()
        
        try:
            owned = pd.read_sql_query(
                "SELECT product_code FROM holdings WHERE customer_id = ?",
                conn,
                params=(client_id,)
            )
            return set(owned['product_code'].tolist())
        finally:
            conn.close()
    
    def suggest(
        self,
        client_id: str,
        top_n: int = 3,
        exclude_owned: bool = True
    ) -> Dict:
        """
        Main function to get product recommendations for a customer.
        
        Args:
            client_id: Customer ID
            top_n: Number of recommendations to return
            exclude_owned: Whether to exclude products customer already owns
            
        Returns:
            Dictionary with recommendations and metadata
        """
        # Get user features
        features = self.get_user_features_from_db(client_id)
        if features is None:
            return {
                "error": "Client ID not found",
                "client_id": client_id
            }
        
        # Scale features if scaler is available
        if self.scaler is not None:
            features_scaled = self.scaler.transform(features)
        else:
            features_scaled = features.values
        
        # Predict cluster
        cluster_id = self.model.predict(features_scaled)[0]
        cluster_id = int(cluster_id)
        
        # Get strategy for this cluster
        strategy = self.cluster_strategies.get(cluster_id)
        if not strategy:
            # Fallback for unexpected cluster IDs
            strategy = {
                "name": f"Cluster {cluster_id}",
                "description": "Standard segment",
                "suggestions": ["BASIC_CHECKING"],
                "acceptance_prob_base": 0.50
            }
        
        # Filter out owned products if requested
        recommended_products = strategy['suggestions']
        if exclude_owned:
            owned = self.get_owned_products(client_id)
            recommended_products = [p for p in recommended_products if p not in owned]
        
        # Limit to top_n
        recommended_products = recommended_products[:top_n]
        
        # Calculate acceptance probabilities
        base_prob = strategy.get('acceptance_prob_base', 0.60)
        recommendations = []
        
        for i, product_code in enumerate(recommended_products):
            # Adjust probability based on position (first recommendation has higher prob)
            prob = base_prob * (1.0 - i * 0.1)  # Decrease by 10% for each position
            prob = max(0.3, min(0.95, prob))  # Clamp between 0.3 and 0.95
            
            # Estimate expected revenue (simplified)
            expected_revenue = 200.0
            if "PREMIUM" in product_code or "WEALTH" in product_code:
                expected_revenue = 5000.0
            elif "INVESTMENT" in product_code or "INV" in product_code:
                expected_revenue = 3000.0
            elif "LOAN" in product_code or "MORTGAGE" in product_code:
                expected_revenue = 2000.0
            elif "CREDIT" in product_code or "CARD" in product_code:
                expected_revenue = 800.0
            
            recommendations.append({
                "product_code": product_code,
                "acceptance_probability": round(prob, 3),
                "expected_revenue": expected_revenue
            })
        
        return {
            "client_id": client_id,
            "persona": strategy['name'],
            "persona_description": strategy.get('description', ''),
            "cluster": cluster_id,
            "recommendations": recommendations,
            "total_recommendations": len(recommendations)
        }
    
    def batch_suggest(self, client_ids: List[str], top_n: int = 3) -> List[Dict]:
        """
        Get recommendations for multiple customers (batch processing).
        
        Args:
            client_ids: List of customer IDs
            top_n: Number of recommendations per customer
            
        Returns:
            List of recommendation dictionaries
        """
        results = []
        for client_id in client_ids:
            try:
                result = self.suggest(client_id, top_n=top_n)
                results.append(result)
            except Exception as e:
                results.append({
                    "client_id": client_id,
                    "error": str(e)
                })
        return results


# --- Usage Example for Testing ---
if __name__ == "__main__":
    try:
        recommender = WellbankRecommender()
        
        # Test with a sample client ID (adjust based on your data)
        # First, get a real client ID from the database
        conn = get_conn()
        try:
            sample_client = pd.read_sql_query(
                "SELECT customer_id FROM customers LIMIT 1",
                conn
            )
            if len(sample_client) > 0:
                test_client_id = sample_client['customer_id'].iloc[0]
                print(f"Testing with client ID: {test_client_id}")
                result = recommender.suggest(test_client_id)
                print("\n" + "=" * 80)
                print("RECOMMENDATION RESULT:")
                print("=" * 80)
                import json
                print(json.dumps(result, indent=2))
            else:
                print("No customers found in database. Please upload customer data first.")
        finally:
            conn.close()
            
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("\nPlease run clustering first:")
        print("  python implement_best_clustering_categories.py")
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
