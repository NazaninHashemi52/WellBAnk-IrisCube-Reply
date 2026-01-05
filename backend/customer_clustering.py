"""
Customer Clustering and Service Assignment
Performs batch processing to cluster customers and assign suitable services.
"""

import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import json
import sys

# Import get_conn from app.db to ensure we use the same database
# Add backend to path so we can import app.db
backend_path = Path(__file__).parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))
from app.db import get_conn


def load_customer_data() -> pd.DataFrame:
    """Load and merge customer data from all tables."""
    conn = get_conn()
    
    try:
        # Load customers
        customers_df = pd.read_sql_query(
            """
            SELECT 
                customer_id,
                birth_date,
                gender,
                city,
                country,
                profession,
                segment_hint,
                annual_income
            FROM customers
            """,
            conn
        )
        
        # Load holdings (products)
        holdings_df = pd.read_sql_query(
            """
            SELECT 
                customer_id,
                product_code,
                product_name,
                category,
                balance,
                opened_at
            FROM holdings
            """,
            conn
        )
        
        # Load transactions
        transactions_df = pd.read_sql_query(
            """
            SELECT 
                customer_id,
                tx_date,
                amount,
                currency,
                tx_category,
                channel
            FROM transactions
            """,
            conn
        )
        
        # Feature engineering: Holdings aggregation
        if len(holdings_df) > 0:
            holdings_features = holdings_df.groupby('customer_id').agg({
                'balance': ['sum', 'mean', 'count'],
                'category': lambda x: x.nunique() if len(x) > 0 else 0  # Number of unique categories
            }).reset_index()
            holdings_features.columns = ['customer_id', 'total_balance', 'avg_balance', 'product_count', 'category_diversity']
        else:
            # Create empty dataframe with required columns
            holdings_features = pd.DataFrame(columns=['customer_id', 'total_balance', 'avg_balance', 'product_count', 'category_diversity'])
        
        # Feature engineering: Transactions aggregation
        if len(transactions_df) > 0:
            transactions_df['tx_date'] = pd.to_datetime(transactions_df['tx_date'])
            transactions_features = transactions_df.groupby('customer_id').agg({
                'amount': ['sum', 'mean', 'std', 'count'],
                'tx_category': lambda x: x.nunique() if len(x) > 0 else 0,  # Transaction category diversity
                'tx_date': ['min', 'max']  # First and last transaction dates
            }).reset_index()
            transactions_features.columns = [
                'customer_id', 'total_spent', 'avg_transaction', 'std_transaction', 
                'transaction_count', 'category_diversity', 'first_tx_date', 'last_tx_date'
            ]
            
            # Calculate transaction recency (days since last transaction)
            transactions_features['days_since_last_tx'] = (
                pd.Timestamp.now() - pd.to_datetime(transactions_features['last_tx_date'])
            ).dt.days
        else:
            # Create empty dataframe with required columns
            transactions_features = pd.DataFrame(columns=[
                'customer_id', 'total_spent', 'avg_transaction', 'std_transaction', 
                'transaction_count', 'category_diversity', 'first_tx_date', 'last_tx_date', 'days_since_last_tx'
            ])
        
        # Calculate customer age from birth_date
        if len(customers_df) > 0:
            # Handle missing or invalid birth_date
            customers_df['birth_date'] = pd.to_datetime(customers_df['birth_date'], errors='coerce')
            customers_df['age'] = (
                pd.Timestamp.now() - customers_df['birth_date']
            ).dt.days / 365.25
            customers_df['age'] = customers_df['age'].fillna(0)  # Fill NaN ages with 0
        else:
            customers_df['age'] = 0
        
        # Merge all features
        merged_df = customers_df.merge(
            holdings_features, 
            on='customer_id', 
            how='left'
        ).merge(
            transactions_features, 
            on='customer_id', 
            how='left'
        )
        
        # Fill NaN values
        numeric_cols = merged_df.select_dtypes(include=[np.number]).columns
        merged_df[numeric_cols] = merged_df[numeric_cols].fillna(0)
        
        return merged_df
        
    finally:
        conn.close()


def prepare_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Prepare features for clustering."""
    # Select numeric features (only include columns that exist)
    all_possible_features = [
        'age',
        'annual_income',
        'total_balance',
        'avg_balance',
        'product_count',
        'category_diversity',
        'total_spent',
        'avg_transaction',
        'std_transaction',
        'transaction_count',
        'days_since_last_tx'
    ]
    
    # Only use features that exist in the dataframe
    feature_cols = [col for col in all_possible_features if col in df.columns]
    
    if len(feature_cols) == 0:
        raise ValueError("No features available for clustering. Please ensure customer data is uploaded.")
    
    # Create feature matrix
    X = df[feature_cols].copy()
    
    # Handle infinite values and NaN
    X = X.replace([np.inf, -np.inf], 0)
    X = X.fillna(0)  # Fill any remaining NaN values with 0
    
    # Standardize features
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=feature_cols,
        index=X.index
    )
    
    # Final check: ensure no NaN or inf values
    X_scaled = X_scaled.replace([np.inf, -np.inf], 0)
    X_scaled = X_scaled.fillna(0)
    
    return X_scaled, feature_cols


def perform_clustering(X: pd.DataFrame, n_clusters: int = 5) -> Tuple[np.ndarray, Dict]:
    """Perform K-means clustering."""
    # Use PCA for dimensionality reduction if needed
    if X.shape[1] > 10:
        pca = PCA(n_components=min(10, X.shape[1]))
        X_reduced = pca.fit_transform(X)
    else:
        X_reduced = X.values
        pca = None
    
    # K-means clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_reduced)
    
    # Calculate cluster statistics
    cluster_info = {
        'n_clusters': n_clusters,
        'inertia': float(kmeans.inertia_),
        'pca_used': pca is not None,
        'cluster_centers': kmeans.cluster_centers_.tolist() if pca is None else None
    }
    
    return cluster_labels, cluster_info


def assign_services(cluster_id: int, customer_features: Dict) -> List[Dict]:
    """Assign suitable services based on cluster and customer features."""
    # Service recommendations based on cluster characteristics
    services = []
    
    # Helper function to safely get numeric values
    def get_num(key, default=0):
        val = customer_features.get(key, default)
        if val is None:
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default
    
    # High-income, high-balance customers
    if get_num('annual_income') > 50000 and get_num('total_balance') > 100000:
        services.append({
            'product_code': 'PREMIUM_INVESTMENT',
            'product_name': 'Premium Investment Portfolio',
            'acceptance_prob': 0.85,
            'expected_revenue': 5000.0,
            'reason': 'High income and balance indicate suitability for premium investment products'
        })
        services.append({
            'product_code': 'WEALTH_MANAGEMENT',
            'product_name': 'Wealth Management Service',
            'acceptance_prob': 0.75,
            'expected_revenue': 3000.0,
            'reason': 'High net worth customer suitable for wealth management'
        })
    
    # Active transaction customers
    if get_num('transaction_count') > 50:
        services.append({
            'product_code': 'REWARDS_CREDIT',
            'product_name': 'Rewards Credit Card',
            'acceptance_prob': 0.70,
            'expected_revenue': 800.0,
            'reason': 'High transaction volume indicates credit card usage'
        })
    
    # Low balance, high spending
    if get_num('total_balance') < 10000 and get_num('total_spent') > 50000:
        services.append({
            'product_code': 'PERSONAL_LOAN',
            'product_name': 'Personal Loan',
            'acceptance_prob': 0.60,
            'expected_revenue': 2000.0,
            'reason': 'Spending pattern suggests need for credit products'
        })
    
    # Young customers with growing income
    if get_num('age') < 35 and get_num('annual_income') > 30000:
        services.append({
            'product_code': 'SAVINGS_PLAN',
            'product_name': 'Savings Plan',
            'acceptance_prob': 0.65,
            'expected_revenue': 500.0,
            'reason': 'Young customer with growth potential'
        })
    
    # Default service for all clusters
    if not services:
        services.append({
            'product_code': 'BASIC_CHECKING',
            'product_name': 'Enhanced Checking Account',
            'acceptance_prob': 0.50,
            'expected_revenue': 200.0,
            'reason': 'Standard service recommendation'
        })
    
    return services


def save_clustering_results(
    run_id: int,
    customer_ids: List[str],
    cluster_labels: np.ndarray,
    customer_features: pd.DataFrame,
    cluster_info: Dict
):
    """Save clustering results to database."""
    conn = get_conn()
    
    try:
        cursor = conn.cursor()
        
        # Optimize: Create a lookup dictionary for customer features (much faster than searching)
        customer_feat_dict_lookup = customer_features.set_index('customer_id').to_dict('index')
        
        # Prepare batch data
        cluster_batch = []
        recommendation_batch = []
        explanation_data = []  # Store service data with customer_id for later matching
        
        batch_size = 500  # Process in batches of 500
        total = len(customer_ids)
        
        for idx, (customer_id, cluster_id) in enumerate(zip(customer_ids, cluster_labels)):
            # Get customer features from lookup (O(1) instead of O(n))
            customer_feat_dict = customer_feat_dict_lookup.get(customer_id, {})
            
            # Calculate distance to centroid (simplified)
            distance = np.random.uniform(0.1, 2.0)  # Placeholder
            
            # Add to batch
            cluster_batch.append((run_id, customer_id, int(cluster_id), float(distance)))
            
            # Assign services and create recommendations
            services = assign_services(int(cluster_id), customer_feat_dict)
            
            for service in services:
                recommendation_batch.append((
                    run_id,
                    customer_id,
                    service['product_code'],
                    service['acceptance_prob'],
                    service['expected_revenue']
                ))
                explanation_data.append(service)  # Store for later
            
            # Commit in batches for better performance
            if (idx + 1) % batch_size == 0 or (idx + 1) == total:
                # Insert clusters in batch (much faster)
                cursor.executemany(
                    """
                    INSERT OR REPLACE INTO customer_clusters 
                    (run_id, customer_id, cluster_id, distance_to_centroid)
                    VALUES (?, ?, ?, ?)
                    """,
                    cluster_batch
                )
                
                # Insert recommendations and get IDs
                rec_ids = []
                for rec_data in recommendation_batch:
                    cursor.execute(
                        """
                        INSERT INTO recommendations 
                        (run_id, customer_id, product_code, acceptance_prob, expected_revenue)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        rec_data
                    )
                    rec_ids.append(cursor.lastrowid)
                
                # Insert explanations
                for rec_id, service in zip(rec_ids, explanation_data):
                    cursor.execute(
                        """
                        INSERT INTO recommendation_explanations 
                        (recommendation_id, key_factors_json, narrative, model_name)
                        VALUES (?, ?, ?, ?)
                        """,
                        (rec_id, json.dumps(service), service['reason'], 'clustering_v1')
                    )
                
                conn.commit()
                
                # Clear batches
                cluster_batch = []
                recommendation_batch = []
                explanation_data = []
                
                # Progress update
                if (idx + 1) % 1000 == 0:
                    print(f"  Processed {idx + 1}/{total} customers...")
        
        # Final commit for any remaining items
        if cluster_batch:
            cursor.executemany(
                """
                INSERT OR REPLACE INTO customer_clusters 
                (run_id, customer_id, cluster_id, distance_to_centroid)
                VALUES (?, ?, ?, ?)
                """,
                cluster_batch
            )
            conn.commit()
        
    finally:
        conn.close()


def run_batch_processing() -> Dict:
    """Main function to run batch processing."""
    import sys
    import traceback
    
    conn = None
    run_id = None
    
    try:
        conn = get_conn()
        cursor = conn.cursor()
        
        # Create a new batch run
        print("Creating batch run record...")
        print(f"Database file: {conn.execute('PRAGMA database_list').fetchall()}")
        cursor.execute(
            """
            INSERT INTO batch_runs (started_at, status)
            VALUES (?, 'running')
            """,
            (datetime.now().isoformat(),)
        )
        run_id = cursor.lastrowid
        conn.commit()
        print(f"Batch run ID: {run_id}")
        
        # Verify it was saved
        cursor.execute("SELECT id, started_at, status FROM batch_runs WHERE id = ?", (run_id,))
        verify = cursor.fetchone()
        print(f"Verified batch run saved: {verify}")
        
        import time
        start_time = time.time()
        
        # Load customer data
        print("Loading customer data...")
        try:
            customer_data = load_customer_data()
            print(f"Loaded {len(customer_data)} customers ({time.time() - start_time:.2f}s)")
            
            # Check if we have any customers
            if len(customer_data) == 0:
                raise ValueError("No customer data found. Please upload datasets first.")
            
            # Debug info
            print(f"  - Columns: {list(customer_data.columns)[:5]}...")
            if 'total_balance' in customer_data.columns:
                non_zero = (customer_data['total_balance'] > 0).sum()
                print(f"  - Customers with holdings: {non_zero}")
            if 'transaction_count' in customer_data.columns:
                non_zero = (customer_data['transaction_count'] > 0).sum()
                print(f"  - Customers with transactions: {non_zero}")
        except Exception as load_error:
            print(f"ERROR in load_customer_data: {load_error}")
            traceback.print_exc()
            raise
        
        # Prepare features
        print("Step 4: Preparing features...")
        feature_start = time.time()
        X_scaled, feature_cols = prepare_features(customer_data)
        print(f"  Features prepared ({time.time() - feature_start:.2f}s)")
        
        # Use fixed number of clusters: 5
        n_clusters = 5
        print(f"  Using {n_clusters} clusters (fixed)")
        
        # Perform clustering
        print("Step 5: Performing clustering...")
        cluster_start = time.time()
        cluster_labels, cluster_info = perform_clustering(X_scaled, n_clusters)
        print(f"  Clustering completed ({time.time() - cluster_start:.2f}s)")
        
        # Save results
        print("Step 6: Saving clustering results...")
        save_start = time.time()
        save_clustering_results(
            run_id,
            customer_data['customer_id'].tolist(),
            cluster_labels,
            customer_data,
            cluster_info
        )
        print(f"  Results saved ({time.time() - save_start:.2f}s)")
        
        total_elapsed = time.time() - start_time
        print(f"\nTotal processing time: {total_elapsed:.2f} seconds")
        
        # Update batch run status
        notes_json = json.dumps({
            'n_clusters': n_clusters,
            'customers_processed': len(customer_data),
            'clusters_count': n_clusters,
            **cluster_info
        })
        cursor.execute(
            """
            UPDATE batch_runs 
            SET finished_at = ?, status = 'success', notes = ?
            WHERE id = ?
            """,
            (
                datetime.now().isoformat(),
                notes_json,
                run_id
            )
        )
        conn.commit()
        print(f"Updated batch run {run_id} with status 'success'")
        
        # Verify the update
        cursor.execute("SELECT id, status, finished_at FROM batch_runs WHERE id = ?", (run_id,))
        verify = cursor.fetchone()
        print(f"Verified batch run updated: ID={verify['id']}, Status={verify['status']}, Finished={verify['finished_at']}")
        
        return {
            'run_id': run_id,
            'status': 'success',
            'customers_processed': len(customer_data),
            'clusters_count': n_clusters,
            'message': f'Successfully processed {len(customer_data)} customers into {n_clusters} clusters'
        }
        
    except Exception as e:
        # Update batch run status to failed
        if 'run_id' in locals() and 'conn' in locals():
            try:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE batch_runs 
                    SET finished_at = ?, status = 'failed', notes = ?
                    WHERE id = ?
                    """,
                    (datetime.now().isoformat(), str(e), run_id)
                )
                conn.commit()
                print(f"Updated batch run {run_id} with status 'failed'")
            except Exception as update_error:
                print(f"Error updating batch run status: {update_error}")
        
        import traceback
        print("=" * 50)
        print("BATCH PROCESSING ERROR:")
        print("=" * 50)
        traceback.print_exc()
        print("=" * 50)
        raise e
        
    finally:
        if 'conn' in locals():
            conn.close()


if __name__ == "__main__":
    try:
        result = run_batch_processing()
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

