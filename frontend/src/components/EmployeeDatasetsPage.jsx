// src/components/EmployeeDatasetsPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Upload, FileText, Database, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import "./LoginPage.css";
import "./EmployeeDashboard.css";
import EmployeeLayout from "./EmployeeLayout";
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

export default function EmployeeDatasetsPage({ onBack, onNavigate }) {
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

  // Parallax background effect (matching Command Center)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
    <EmployeeLayout 
      currentPage="upload" 
      onNavigate={onNavigate}
      onBack={onBack}
    >
      {/* Parallax Background Gradient */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(79, 216, 235, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)`,
          pointerEvents: "none",
          zIndex: 0,
          transition: "background 0.3s ease-out",
        }}
      />

      {/* Header */}
      <div style={{ 
        marginBottom: "32px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start" 
      }}>
        <div>
          <div style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(148, 163, 184, 0.8)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "8px",
          }}>
            Operations
          </div>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: 600, 
            color: "#F8FAFC", 
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
            lineHeight: "1.3",
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}>
            Dataset Management
          </h1>
          <p style={{ 
            color: "rgba(148, 163, 184, 0.8)", 
            fontSize: "14px", 
            margin: 0, 
            lineHeight: "1.5" 
          }}>
            Upload CSV datasets for customer data, products, and transactions.
          </p>
        </div>
        <button 
          onClick={uploadAll} 
          disabled={globalBusy || !files.customers || !files.products}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: globalBusy || !files.customers || !files.products
              ? "rgba(59, 130, 246, 0.2)"
              : "linear-gradient(135deg, rgba(79, 216, 235, 0.2), rgba(59, 130, 246, 0.15))",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(79, 216, 235, 0.3)",
            borderRadius: "12px",
            color: globalBusy || !files.customers || !files.products
              ? "rgba(255, 255, 255, 0.4)"
              : "#4fd8eb",
            fontSize: "15px",
            fontWeight: 600,
            cursor: globalBusy || !files.customers || !files.products ? "not-allowed" : "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          onMouseEnter={(e) => {
            if (!globalBusy && files.customers && files.products) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 216, 235, 0.3), rgba(59, 130, 246, 0.25))";
              e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.5)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15)";
            }
          }}
          onMouseLeave={(e) => {
            if (!globalBusy && files.customers && files.products) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 216, 235, 0.2), rgba(59, 130, 246, 0.15))";
              e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
            }
          }}
        >
          <Upload size={18} />
          Upload All
        </button>
      </div>

      {/* Datasets Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "24px",
      }}>
        {DATASETS.map((ds) => {
          const f = files[ds.key];
          const st = status[ds.key];
          const isUploading = st.state === "uploading";
          const canUpload = Boolean(f) && !isUploading && !globalBusy;

          return (
            <div
              key={ds.key}
              onDragOver={prevent}
              onDragEnter={prevent}
              onDrop={(e) => onDrop(e, ds.key)}
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(40px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                padding: "24px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.3)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 40px rgba(79, 216, 235, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Card Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}>
                <div>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#F8FAFC",
                    margin: "0 0 4px 0",
                    letterSpacing: "-0.01em",
                    fontFamily: "'Inter', -apple-system, sans-serif",
                  }}>
                    {ds.title}
                  </h3>
                  <p style={{
                    fontSize: "13px",
                    color: "rgba(148, 163, 184, 0.7)",
                    margin: 0,
                  }}>
                    {ds.subtitle}
                  </p>
                </div>
                <span style={{
                  padding: "4px 12px",
                  background: ds.chip === "Required"
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(59, 130, 246, 0.2)",
                  border: `1px solid ${ds.chip === "Required" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: ds.chip === "Required" ? "#F87171" : "#60A5FA",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  {ds.chip}
                </span>
              </div>

              {/* Dropzone */}
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "16px",
                padding: "32px",
                border: "2px dashed rgba(255, 255, 255, 0.1)",
                marginBottom: "20px",
                textAlign: "center",
                transition: "all 0.3s",
              }}>
                <Database size={32} style={{ 
                  opacity: 0.5, 
                  marginBottom: "12px",
                  color: "rgba(148, 163, 184, 0.6)",
                }} />
                <div style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#E2E8F0",
                  marginBottom: "4px",
                }}>
                  Drag & drop CSV here
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "rgba(148, 163, 184, 0.6)",
                }}>
                  {ds.hint}
                </div>
              </div>

              {/* File Selection */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}>
                <input
                  ref={(el) => (fileInputs.current[ds.key] = el)}
                  type="file"
                  accept={ds.accept}
                  onChange={(e) => setFile(ds.key, e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />

                <button 
                  onClick={() => pickFile(ds.key)} 
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    color: "#E2E8F0",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <FileText size={16} />
                  Choose File
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {f ? (
                    <>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#F8FAFC",
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {f.name}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "rgba(148, 163, 184, 0.7)",
                      }}>
                        {formatBytes(f.size)}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      fontSize: "13px",
                      color: "rgba(148, 163, 184, 0.5)",
                      fontStyle: "italic",
                    }}>
                      No file selected
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              {(st.state !== "idle" || st.progress > 0) && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}>
                    <span style={{
                      fontSize: "13px",
                      color: "rgba(148, 163, 184, 0.8)",
                    }}>
                      {st.state === "idle" ? "" : st.message}
                    </span>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#E2E8F0",
                    }}>
                      {st.state === "uploading" || st.state === "done" ? `${st.progress}%` : ""}
                    </span>
                  </div>

                  <div style={{
                    height: "6px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${st.progress}%`,
                        background: st.state === "error"
                          ? "linear-gradient(90deg, #EF4444, #F87171)"
                          : st.state === "done"
                          ? "linear-gradient(90deg, #10B981, #34D399)"
                          : "linear-gradient(90deg, #4fd8eb, #3b82f6)",
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  {st.state === "error" && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#F87171",
                    }}>
                      <AlertCircle size={16} />
                      {st.message}
                    </div>
                  )}
                  {st.state === "done" && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#34D399",
                    }}>
                      <CheckCircle size={16} />
                      Upload complete
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: "flex",
                gap: "12px",
              }}>
                <button 
                  onClick={() => uploadOne(ds.key)} 
                  disabled={!canUpload}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background: !canUpload
                      ? "rgba(59, 130, 246, 0.2)"
                      : "linear-gradient(135deg, rgba(79, 216, 235, 0.2), rgba(59, 130, 246, 0.15))",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(79, 216, 235, 0.3)",
                    borderRadius: "12px",
                    color: !canUpload ? "rgba(255, 255, 255, 0.4)" : "#4fd8eb",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: !canUpload ? "not-allowed" : "pointer",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    if (canUpload) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 216, 235, 0.3), rgba(59, 130, 246, 0.25))";
                      e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.5)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canUpload) {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 216, 235, 0.2), rgba(59, 130, 246, 0.15))";
                      e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.3)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <Upload size={16} />
                  Upload
                </button>

                {isUploading ? (
                  <button 
                    onClick={() => cancelUpload(ds.key)} 
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: "#E2E8F0",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }}
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => setFile(ds.key, null)}
                    disabled={!f || globalBusy}
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: (!f || globalBusy) ? "rgba(255, 255, 255, 0.3)" : "#E2E8F0",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: (!f || globalBusy) ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (f && !globalBusy) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (f && !globalBusy) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      }
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </EmployeeLayout>
  );
}
