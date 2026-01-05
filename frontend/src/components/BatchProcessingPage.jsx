import React, { useState, useEffect } from "react";
import {
  Database,
  Play,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  TrendingUp,
  Users,
  Sparkles,
  PieChart,
} from "lucide-react";
import BackButton from "./BackButton";
import { runBatchProcessing, getLastBatchRun } from "../api/batch";

export default function BatchProcessingPage({ onNavigate, onBack }) {
  const [activeNav, setActiveNav] = useState("batch");
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
    } catch (err) {
      console.error("Failed to load last run:", err);
    }
  }

  const handleNavClick = (navKey) => {
    setActiveNav(navKey);
    const pageMap = {
      dataset: "upload",
      dashboard: "dashboard",
      batch: "batch",
      results: "results",
      transactions: "data",
      reports: "report",
      analytics: "data",
      settings: "data",
    };
    if (onNavigate && pageMap[navKey]) {
      onNavigate(pageMap[navKey]);
    }
  };

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
    <div className="flight-dashboard">
      {/* Left Sidebar - Dark Teal/Green */}
      <aside className="flight-sidebar">
        {/* User Profile */}
        <div className="flight-profile">
          <div className="flight-avatar">
            <User size={28} />
          </div>
          <div className="flight-profile-text">
            <div className="flight-profile-name">ALEX JOHNSON</div>
            <div className="flight-profile-email">alex.johnson@wellbank.com</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flight-nav">
          <button
            className={`flight-nav-item ${activeNav === "dataset" ? "active" : ""}`}
            onClick={() => handleNavClick("dataset")}
          >
            <Database size={20} />
            <span>DATASET MANAGEMENT</span>
          </button>
          <button
            className={`flight-nav-item ${activeNav === "batch" ? "active" : ""}`}
            onClick={() => handleNavClick("batch")}
          >
            <Sparkles size={20} />
            <span>BATCH PROCESSING</span>
          </button>
          <button
            className={`flight-nav-item ${activeNav === "results" ? "active" : ""}`}
            onClick={() => handleNavClick("results")}
          >
            <PieChart size={20} />
            <span>CLUSTER RESULTS</span>
          </button>
          <button
            className={`flight-nav-item ${activeNav === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <LayoutDashboard size={20} />
            <span>DASHBOARD</span>
          </button>
          <button
            className={`flight-nav-item ${activeNav === "transactions" ? "active" : ""}`}
            onClick={() => handleNavClick("transactions")}
          >
            <CreditCard size={20} />
            <span>TRANSACTIONS</span>
          </button>
          <button
            className={`flight-nav-item ${activeNav === "reports" ? "active" : ""}`}
            onClick={() => handleNavClick("reports")}
          >
            <FileText size={20} />
            <span>REPORTS</span>
          </button>
          <button
            className={`flight-nav-item ${activeNav === "analytics" ? "active" : ""}`}
            onClick={() => handleNavClick("analytics")}
          >
            <BarChart3 size={20} />
            <span>STATISTICS</span>
          </button>
          <button
            className={`flight-nav-item ${activeNav === "settings" ? "active" : ""}`}
            onClick={() => handleNavClick("settings")}
          >
            <Settings size={20} />
            <span>SETTINGS</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flight-main" style={{ position: "relative" }}>
        {/* Back Button */}
        <div style={{ 
          position: "absolute", 
          top: "20px", 
          right: "20px", 
          zIndex: 1000 
        }}>
          <BackButton 
            onClick={onBack || (() => onNavigate("dashboard"))} 
            label="Back to Dashboard" 
            variant="light" 
          />
        </div>

        <div className="flight-results-container">
          <div className="flight-results-header">
            <h2 className="flight-results-title">BATCH PROCESSING</h2>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            marginTop: "24px",
            border: "1px solid rgba(59, 130, 246, 0.1)"
          }}>
            <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)"
              }}>
                <Sparkles size={30} />
              </div>
              <div>
                <h3 style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.02em",
                }}>
                  Customer Clustering & Service Assignment
                </h3>
                <p style={{
                  fontSize: "16px",
                  color: "#64748b",
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
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                border: "2px solid #10b981",
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
                  background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0
                }}>
                  <Clock size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", color: "#065f46", fontWeight: 600, marginBottom: "6px" }}>
                    Last Run: {formatDate(lastRun.finished_at || lastRun.started_at)}
                  </div>
                  <div style={{ fontSize: "14px", color: "#047857", fontWeight: 500 }}>
                    Status: <span style={{ fontWeight: 600 }}>{lastRun.status}</span>
                    {lastRun.clusters_count && ` • ${lastRun.clusters_count} clusters created`}
                    {lastRun.customers_processed && ` • ${lastRun.customers_processed} customers processed`}
                  </div>
                </div>
              </div>
            )}

            <div style={{
              padding: "24px",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
              borderRadius: "14px",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              marginBottom: "24px"
            }}>
              <h4 style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#0f172a",
                margin: "0 0 12px 0"
              }}>
                What this process does:
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: "24px",
                color: "#475569",
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
                  ? "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)"
                  : "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: isProcessing ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                boxShadow: isProcessing
                  ? "none"
                  : "0 4px 16px rgba(139, 92, 246, 0.4)",
                letterSpacing: "0.3px"
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.background = "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(139, 92, 246, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.background = "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(139, 92, 246, 0.4)";
                }
              }}
            >
              {isProcessing ? (
                <>
                  <div className="login-spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }}></div>
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
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                border: "2px solid #10b981",
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
                  background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", color: "#065f46", fontWeight: 600, marginBottom: "6px" }}>
                    Success!
                  </div>
                  <div style={{ fontSize: "14px", color: "#047857", fontWeight: 500 }}>
                    {status}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                marginTop: "24px",
                padding: "20px",
                background: "linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)",
                border: "2px solid #dc2626",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0
                }}>
                  <AlertCircle size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", color: "#991b1b", fontWeight: 600, marginBottom: "6px" }}>
                    Processing Failed
                  </div>
                  <div style={{ fontSize: "14px", color: "#b91c1c", fontWeight: 500 }}>
                    {error}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

