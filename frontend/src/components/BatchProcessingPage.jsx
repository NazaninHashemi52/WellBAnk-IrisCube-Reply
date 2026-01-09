import React, { useState, useEffect } from "react";
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";
import { runBatchProcessing, getLastBatchRun } from "../api/batch";

export default function BatchProcessingPage({ onNavigate, onBack }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState(null);
  const [processingStatus, setProcessingStatus] = useState("idle"); // idle, running, success, failed

  useEffect(() => {
    loadLastRun();
  }, []);

  async function loadLastRun() {
    try {
      const data = await getLastBatchRun();
      setLastRun(data);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Failed to load last run:", err);
      // Don't set error state here - just log it, as this is a background load
      // The error will be shown when user tries to run batch
    }
  }

  const handleRunBatch = async () => {
    setIsProcessing(true);
    setStatus("");
    setError("");
    setProcessingStatus("running");

    try {
      // Use category-based clustering (recommended)
      const data = await runBatchProcessing(true);
      setStatus(`Batch processing completed successfully! ${data.message || ""}`);
      setProcessingStatus("success");
      
      // Reload last run info
      await loadLastRun();
    } catch (err) {
      console.error("Batch processing error:", err);
      
      let errorMessage = "An error occurred during batch processing.";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err instanceof TypeError && err.message.includes("fetch")) {
        errorMessage = "Cannot connect to backend server. Please make sure the FastAPI server is running on port 8000.";
      }
      
      setError(errorMessage);
      setProcessingStatus("failed");
    } finally {
      setIsProcessing(false);
    }
  };

  function formatDate(dateString) {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <EmployeeLayout currentPage="batch" onNavigate={onNavigate} onBack={onBack}>
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {/* Page Header */}
        <div style={{
          marginBottom: "32px",
        }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#F8FAFC",
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <Sparkles size={32} color="#4fd8eb" style={{ filter: "drop-shadow(0 0 8px rgba(79, 216, 235, 0.6))" }} />
            Batch Processing
          </h1>
          <p style={{
            fontSize: "16px",
            color: "#94A3B8",
            margin: 0,
            lineHeight: "1.6"
          }}>
            Run batch processing to cluster customers and assign suitable financial services
          </p>
        </div>

        {/* Main Card - Customer Clustering & Service Assignment */}
        <div style={{
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          marginBottom: "24px",
        }}>
          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(79, 216, 235, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4fd8eb",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(79, 216, 235, 0.2), 0 0 20px rgba(79, 216, 235, 0.1)"
            }}>
              <Sparkles size={30} style={{ filter: "drop-shadow(0 0 4px rgba(79, 216, 235, 0.6))" }} />
            </div>
            <div>
              <h3 style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#F8FAFC",
                margin: "0 0 8px 0",
                letterSpacing: "-0.02em",
              }}>
                Customer Clustering & Service Assignment
              </h3>
              <p style={{
                fontSize: "16px",
                color: "#94A3B8",
                margin: 0,
                lineHeight: "1.6"
              }}>
                Run batch processing to cluster customers based on their features and assign them suitable financial services.
              </p>
            </div>
          </div>

          {lastRun && (
            <div style={{
              marginBottom: "32px",
              padding: "20px",
              background: "rgba(16, 185, 129, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3))",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                flexShrink: 0
              }}>
                <Clock size={22} style={{ filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", color: "#10b981", fontWeight: 600, marginBottom: "6px" }}>
                  Last Run: {formatDate(lastRun.finished_at || lastRun.started_at)}
                </div>
                <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 500 }}>
                  Status: <span style={{ fontWeight: 600, color: "#10b981" }}>{lastRun.status}</span>
                  {lastRun.clusters_count && ` • ${lastRun.clusters_count} clusters created`}
                  {lastRun.customers_processed && ` • ${lastRun.customers_processed} customers processed`}
                </div>
              </div>
            </div>
          )}

          <div style={{
            padding: "24px",
            background: "rgba(79, 216, 235, 0.05)",
            backdropFilter: "blur(10px)",
            borderRadius: "14px",
            border: "1px solid rgba(79, 216, 235, 0.2)",
            marginBottom: "24px"
          }}>
            <h4 style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#F8FAFC",
              margin: "0 0 12px 0"
            }}>
              What this process does:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: "24px",
              color: "#94A3B8",
              fontSize: "16px",
              lineHeight: "1.8"
            }}>
              <li>Analyzes customer data from uploaded datasets (anagrafiche, prodotti, movimenti)</li>
              <li>Performs feature engineering to extract meaningful customer characteristics</li>
              <li>Applies clustering algorithms (K-means, DBSCAN) to group similar customers</li>
              <li>Assigns suitable financial services to each customer cluster</li>
              <li>Generates recommendations based on cluster analysis</li>
            </ul>
          </div>

          <button
            onClick={handleRunBatch}
            disabled={isProcessing}
            style={{
              width: "100%",
              padding: "18px 32px",
              background: isProcessing
                ? "linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(100, 116, 139, 0.3))"
                : "linear-gradient(to right, #06b6d4, #3b82f6)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: isProcessing ? "not-allowed" : "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              boxShadow: isProcessing
                ? "none"
                : "0 4px 20px rgba(6, 182, 212, 0.4), 0 0 0 0 rgba(6, 182, 212, 0.4)",
              letterSpacing: "0.3px",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = "linear-gradient(to right, #0891b2, #2563eb)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 30px rgba(6, 182, 212, 0.6), 0 0 0 4px rgba(6, 182, 212, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = "linear-gradient(to right, #06b6d4, #3b82f6)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(6, 182, 212, 0.4), 0 0 0 0 rgba(6, 182, 212, 0.4)";
              }
            }}
          >
            {isProcessing ? (
              <>
                <div className="login-spinner" style={{ width: "18px", height: "18px", borderWidth: "2px", borderColor: "#ffffff transparent transparent transparent" }}></div>
                Processing...
              </>
            ) : (
              <>
                <Play size={20} />
                Run Batch Processing
              </>
            )}
          </button>

          {status && (
            <div style={{
              marginTop: "24px",
              padding: "20px",
              background: "rgba(16, 185, 129, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3))",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                flexShrink: 0
              }}>
                <CheckCircle2 size={22} style={{ filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", color: "#10b981", fontWeight: 600, marginBottom: "6px" }}>
                  Success!
                </div>
                <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 500 }}>
                  {status}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: "24px",
              padding: "20px",
              background: "rgba(239, 68, 68, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3))",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                flexShrink: 0
              }}>
                <AlertCircle size={22} style={{ filter: "drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", color: "#ef4444", fontWeight: 600, marginBottom: "8px" }}>
                  {error.includes("Cannot connect") || error.includes("ERR_CONNECTION") ? "Backend Server Not Running" : "Processing Failed"}
                </div>
                <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 500, lineHeight: "1.6" }}>
                  {error.includes("Cannot connect") || error.includes("ERR_CONNECTION") ? (
                    <div>
                      <p style={{ margin: "0 0 12px 0", color: "#F8FAFC" }}>
                        <strong>The backend server is not running.</strong> Please start it before running batch processing.
                      </p>
                      <div style={{ 
                        background: "rgba(0, 0, 0, 0.2)", 
                        padding: "12px", 
                        borderRadius: "8px",
                        marginTop: "8px",
                        fontSize: "13px",
                        color: "#94A3B8"
                      }}>
                        <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#F8FAFC" }}>To start the server:</p>
                        <ol style={{ margin: "0", paddingLeft: "20px", lineHeight: "1.8" }}>
                          <li>Open a terminal/command prompt</li>
                          <li>Navigate to the <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px", color: "#4fd8eb" }}>backend</code> folder</li>
                          <li>Run: <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px", color: "#4fd8eb" }}>venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</code></li>
                          <li>Or double-click: <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px", color: "#4fd8eb" }}>start_server.bat</code></li>
                        </ol>
                        <p style={{ margin: "12px 0 0 0", fontStyle: "italic" }}>
                          Once the server shows "Uvicorn running on http://0.0.0.0:8000", refresh this page and try again.
                        </p>
                      </div>
                    </div>
                  ) : (
                    error
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}

