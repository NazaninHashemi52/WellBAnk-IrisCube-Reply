PRAGMA foreign_keys = ON;

-- =========================
-- DATASET VERSIONING
-- =========================
CREATE TABLE IF NOT EXISTS dataset_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_type TEXT NOT NULL CHECK (dataset_type IN ('customer_master','holdings','transactions')),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','importing','ready','failed')),
  row_count INTEGER,
  sha256 TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_dataset_uploads_type_time
  ON dataset_uploads(dataset_type, uploaded_at);

-- =========================
-- CORE TABLES
-- =========================

-- 1) Customer Master
CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  birth_date TEXT,              -- store as ISO date string: YYYY-MM-DD
  gender TEXT,
  city TEXT,
  country TEXT,
  profession TEXT,
  segment_hint TEXT,
  annual_income REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_customers_profession ON customers(profession);

-- 2) Holdings / Products
CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT,
  category TEXT,
  balance REAL,
  opened_at TEXT,               -- YYYY-MM-DD
  status TEXT,
  UNIQUE(customer_id, product_code),
  FOREIGN KEY(customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_holdings_customer ON holdings(customer_id);
CREATE INDEX IF NOT EXISTS idx_holdings_category ON holdings(category);

-- 3) Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL,
  tx_date TEXT NOT NULL,        -- YYYY-MM-DD
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'EUR',
  merchant TEXT,
  tx_category TEXT,
  channel TEXT,
  FOREIGN KEY(customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tx_customer_date ON transactions(customer_id, tx_date);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(tx_category);

-- =========================
-- BATCH + CLUSTERING + REPORTS
-- =========================
CREATE TABLE IF NOT EXISTS batch_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failed')),
  datasets_customer_master_id INTEGER,
  datasets_holdings_id INTEGER,
  datasets_transactions_id INTEGER,
  notes TEXT,
  FOREIGN KEY(datasets_customer_master_id) REFERENCES dataset_uploads(id),
  FOREIGN KEY(datasets_holdings_id) REFERENCES dataset_uploads(id),
  FOREIGN KEY(datasets_transactions_id) REFERENCES dataset_uploads(id)
);

-- cluster output per run
CREATE TABLE IF NOT EXISTS customer_clusters (
  run_id INTEGER NOT NULL,
  customer_id TEXT NOT NULL,
  cluster_id INTEGER NOT NULL,
  distance_to_centroid REAL,
  PRIMARY KEY (run_id, customer_id),
  FOREIGN KEY(run_id) REFERENCES batch_runs(id) ON DELETE CASCADE,
  FOREIGN KEY(customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clusters_run_cluster
  ON customer_clusters(run_id, cluster_id);

CREATE INDEX IF NOT EXISTS idx_clusters_run_customer
  ON customer_clusters(run_id, customer_id);

-- recommendations per run
CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  customer_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  acceptance_prob REAL NOT NULL CHECK (acceptance_prob >= 0 AND acceptance_prob <= 1),
  expected_revenue REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'sent', 'dismissed')),
  edited_by TEXT,
  edited_at TEXT,
  edited_reason TEXT,
  edited_narrative TEXT,
  sent_at TEXT,
  sent_by TEXT,
  dismissed_at TEXT,
  dismissed_by TEXT,
  dismissed_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(run_id) REFERENCES batch_runs(id) ON DELETE CASCADE,
  FOREIGN KEY(customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reco_run_customer ON recommendations(run_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_reco_run_prob ON recommendations(run_id, acceptance_prob);
CREATE INDEX IF NOT EXISTS idx_reco_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_reco_customer_status ON recommendations(customer_id, status);

-- explanations ("why suitable")
CREATE TABLE IF NOT EXISTS recommendation_explanations (
  recommendation_id INTEGER PRIMARY KEY,
  key_factors_json TEXT,        -- JSON string
  narrative TEXT,
  model_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
);
