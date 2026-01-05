// src/components/EmployeeDatasetsPage.jsx
import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, Upload, FileText, Database, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import "./LoginPage.css";
import "./EmployeeDashboard.css";
import backgroundImage from "../assets/Dashboard.png";
import { uploadDataset } from "../api/uploads";

// Map dataset keys to backend dataset_type values
const DATASET_TYPE_MAP = {
  customers: "anagrafiche",
  products: "prodotti",
  transactions: "movimenti",
};

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}


const DATASETS = [
  {
    key: "customers",
    title: "Customer Master",
    subtitle: "Anagrafiche / demographics",
    hint: "CSV with customer identifiers, demographics, segment fields.",
    accept: ".csv,text/csv",
    chip: "Required",
  },
  {
    key: "products",
    title: "Products / Holdings",
    subtitle: "Posesso prodotti",
    hint: "CSV with customer-product relations or holdings snapshot.",
    accept: ".csv,text/csv",
    chip: "Required",
  },
  {
    key: "transactions",
    title: "Transactions",
    subtitle: "Movimenti",
    hint: "CSV with transactional history (date, amount, category).",
    accept: ".csv,text/csv",
    chip: "Optional",
  },
];

export default function EmployeeDatasetsPage({ onBack }) {
  const fileInputs = useRef({});
  const [files, setFiles] = useState({
    customers: null,
    products: null,
    transactions: null,
  });

  const [status, setStatus] = useState({
    customers: { state: "idle", progress: 0, message: "" },
    products: { state: "idle", progress: 0, message: "" },
    transactions: { state: "idle", progress: 0, message: "" },
  });

  const [globalBusy, setGlobalBusy] = useState(false);
  const abortControllers = useRef({
    customers: null,
    products: null,
    transactions: null,
  });

  const allSelected = useMemo(
    () => Boolean(files.customers && files.products) || Boolean(files.customers && files.products && files.transactions),
    [files]
  );

  function pickFile(key) {
    fileInputs.current[key]?.click?.();
  }

  function setFile(key, file) {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setStatus((prev) => ({
      ...prev,
      [key]: { state: file ? "ready" : "idle", progress: 0, message: file ? "Ready to upload" : "" },
    }));
  }

  async function uploadOne(key) {
    const file = files[key];
    if (!file) {
      setStatus((prev) => ({ ...prev, [key]: { ...prev[key], state: "error", message: "Please choose a CSV file." } }));
      return;
    }

    const datasetType = DATASET_TYPE_MAP[key];
    if (!datasetType) {
      setStatus((prev) => ({
        ...prev,
        [key]: { ...prev[key], state: "error", message: "Invalid dataset type." },
      }));
      return;
    }

    // abort controller for this upload
    const controller = new AbortController();
    abortControllers.current[key] = controller;

    setStatus((prev) => ({ ...prev, [key]: { state: "uploading", progress: 0, message: "Uploading…" } }));

    try {
      await uploadDataset(
        datasetType,
        file,
        (pct) => {
          setStatus((prev) => ({ ...prev, [key]: { ...prev[key], progress: pct } }));
        }
      );

      setStatus((prev) => ({ ...prev, [key]: { state: "done", progress: 100, message: "Upload complete" } }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        [key]: { state: "error", progress: 0, message: err?.message || "Upload failed" },
      }));
    } finally {
      abortControllers.current[key] = null;
    }
  }

  function cancelUpload(key) {
    abortControllers.current[key]?.abort?.();
  }

  async function uploadAll() {
    setGlobalBusy(true);
    try {
      // required first
      await uploadOne("customers");
      await uploadOne("products");
      // optional only if selected
      if (files.transactions) {
        await uploadOne("transactions");
      }
    } finally {
      setGlobalBusy(false);
    }
  }

  function onDrop(e, key) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setStatus((prev) => ({
        ...prev,
        [key]: { state: "error", progress: 0, message: "Only CSV files are supported." },
      }));
      return;
    }
    setFile(key, f);
  }

  function prevent(e) {
    e.preventDefault();
  }

  return (
    <div className="wbd-root">
      {/* Full-Width Background Container */}
      <div className="wbd-bg">
        {/* Background Image Layer */}
        <div 
          className="wbd-bg-img" 
          style={{ backgroundImage: `url(${backgroundImage})` }} 
        />
        
        {/* Main Content Container - Wide, Expansive Layout */}
        <div className="wbd-container wbd-container-wide">
          {/* Blurry Glassmorphism Container */}
          <div className="wbd-glass-container">
            <div className="wb-datasets-content wb-main-content-wide" style={{ overflowY: "auto", height: "100%", width: "100%" }}>
            {/* Back Button - F-Pattern Top-Left */}
            {onBack && (
              <div style={{ marginBottom: "20px" }}>
                <button 
                  onClick={onBack}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "6px 0",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateX(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Dashboard</span>
                </button>
              </div>
            )}
            
            {/* Header */}
            <div className="wb-datasets-header">
              <div>
                <div className="wb-datasets-eyebrow">Operations</div>
                <h1 className="wb-datasets-title">Dataset Management</h1>
                <p className="wb-datasets-subtitle">
                  Upload CSV datasets for customer data, products, and transactions.
                </p>
              </div>
              <button 
                className="wb-btn wb-btn-primary" 
                onClick={uploadAll} 
                disabled={globalBusy || !files.customers || !files.products}
              >
                <Upload size={18} />
                Upload All
              </button>
            </div>

            {/* Datasets Grid */}
            <div className="wb-datasets-grid">
        {DATASETS.map((ds) => {
          const f = files[ds.key];
          const st = status[ds.key];
          const isUploading = st.state === "uploading";
          const canUpload = Boolean(f) && !isUploading && !globalBusy;

          return (
            <div
              key={ds.key}
              className="wb-dataset-card"
              onDragOver={prevent}
              onDragEnter={prevent}
              onDrop={(e) => onDrop(e, ds.key)}
            >
              <div className="wb-dataset-card-header">
                <div className="wb-dataset-card-title-row">
                  <div>
                    <h3 className="wb-dataset-card-title">{ds.title}</h3>
                    <p className="wb-dataset-card-subtitle">{ds.subtitle}</p>
                  </div>
                  <span className={`wb-badge ${ds.chip === "Required" ? "wb-badge-error" : "wb-badge-info"}`}>
                    {ds.chip}
                  </span>
                </div>
              </div>

              <div className="wb-dataset-dropzone">
                <div className="wb-dataset-dropzone-content">
                  <Database size={32} style={{ opacity: 0.5, marginBottom: "12px" }} />
                  <div className="wb-dataset-dropzone-text">
                    <div className="wb-dataset-dropzone-strong">Drag & drop CSV here</div>
                    <div className="wb-dataset-dropzone-hint">{ds.hint}</div>
                  </div>
                </div>

                <div className="wb-dataset-file-row">
                  <input
                    ref={(el) => (fileInputs.current[ds.key] = el)}
                    className="wb-dataset-file-input"
                    type="file"
                    accept={ds.accept}
                    onChange={(e) => setFile(ds.key, e.target.files?.[0] || null)}
                  />

                  <button 
                    className="wb-btn" 
                    onClick={() => pickFile(ds.key)} 
                    type="button"
                  >
                    <FileText size={16} />
                    Choose File
                  </button>

                  <div className="wb-dataset-file-meta">
                    {f ? (
                      <>
                        <div className="wb-dataset-file-name">{f.name}</div>
                        <div className="wb-dataset-file-size">{formatBytes(f.size)}</div>
                      </>
                    ) : (
                      <div className="wb-dataset-file-placeholder">No file selected</div>
                    )}
                  </div>
                </div>

                {/* Progress */}
                {(st.state !== "idle" || st.progress > 0) && (
                  <div className="wb-dataset-progress">
                    <div className="wb-dataset-progress-header">
                      <span className="wb-dataset-progress-label">
                        {st.state === "idle" ? "" : st.message}
                      </span>
                      <span className="wb-dataset-progress-pct">
                        {st.state === "uploading" || st.state === "done" ? `${st.progress}%` : ""}
                      </span>
                    </div>

                    <div className="wb-dataset-progress-bar">
                      <div
                        className={`wb-dataset-progress-fill ${
                          st.state === "error"
                            ? "wb-dataset-progress-fill--error"
                            : st.state === "done"
                            ? "wb-dataset-progress-fill--done"
                            : ""
                        }`}
                        style={{ width: `${st.progress}%` }}
                      />
                    </div>

                    {st.state === "error" && (
                      <div className="wb-dataset-error">
                        <AlertCircle size={16} />
                        {st.message}
                      </div>
                    )}
                    {st.state === "done" && (
                      <div className="wb-dataset-success">
                        <CheckCircle size={16} />
                        Upload complete
                      </div>
                    )}
                  </div>
                )}

                <div className="wb-dataset-card-actions">
                  <button 
                    className="wb-btn wb-btn-primary" 
                    onClick={() => uploadOne(ds.key)} 
                    disabled={!canUpload}
                  >
                    <Upload size={16} />
                    Upload
                  </button>

                  {isUploading ? (
                    <button 
                      className="wb-btn" 
                      onClick={() => cancelUpload(ds.key)} 
                      type="button"
                    >
                      <XCircle size={16} />
                      Cancel
                    </button>
                  ) : (
                    <button
                      className="wb-btn"
                      onClick={() => setFile(ds.key, null)}
                      disabled={!f || globalBusy}
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
