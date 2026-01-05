import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Edit,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Shield,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  RefreshCw,
  FileText,
} from "lucide-react";
import { getRecommendationById, regenerateMessage, makeDecision } from "../api/offers";

/**
 * Enhanced Recommendation Modal for Offer Workbench
 * Supports both:
 * - Direct recommendation object (from OfferWorkbench)
 * - Recommendation ID (from ClusterResultsPage)
 */
export default function RecommendationModalEnhanced({
  recommendationId,
  recommendation: recommendationProp,
  customerContext,
  onClose,
  onUpdate,
}) {
  const [recommendation, setRecommendation] = useState(recommendationProp || null);
  const [isLoading, setIsLoading] = useState(!recommendationProp);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState("");
  const [editReason, setEditReason] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [error, setError] = useState("");
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [messageTone, setMessageTone] = useState("friendly");
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [includeReasons, setIncludeReasons] = useState(true);

  useEffect(() => {
    if (recommendationId && !recommendationProp) {
      loadRecommendation();
    } else if (recommendationProp) {
      setRecommendation(recommendationProp);
      setEditedNarrative(recommendationProp.explanation || "");
      setDraftMessage(recommendationProp.draft_message || "");
      setIsLoading(false);
    }
  }, [recommendationId, recommendationProp]);

  async function loadRecommendation() {
    try {
      setIsLoading(true);
      setError("");
      const data = await getRecommendationById(recommendationId);
      setRecommendation(data);
      setEditedNarrative(data.narrative || "");
    } catch (err) {
      setError(`Failed to load recommendation: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function generateMessage() {
    if (!recommendation) return;

    setIsGeneratingMessage(true);
    try {
      // If we have a recommendationId, use the API endpoint
      if (recommendationId) {
        const result = await regenerateMessage(recommendationId, messageTone);
        setDraftMessage(result.draft_message);
      } else if (recommendation.draft_message) {
        // Use existing draft message
        setDraftMessage(recommendation.draft_message);
      }
    } catch (err) {
      console.error("Failed to generate message:", err);
    } finally {
      setIsGeneratingMessage(false);
    }
  }

  useEffect(() => {
    if (recommendation && !draftMessage) {
      generateMessage();
    }
  }, [recommendation, messageTone, includeReasons]);

  async function handleSaveEdit() {
    try {
      setError("");
      // Note: PUT endpoint for editing recommendations may not be implemented yet
      // For now, we'll just update local state
      if (recommendation) {
        setRecommendation({
          ...recommendation,
          narrative: editedNarrative,
          explanation: editedNarrative,
        });
      }
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    }
  }

  async function handleSend() {
    try {
      setIsSending(true);
      setError("");
      
      if (recommendationId) {
        await makeDecision(recommendationId, "send", draftMessage || editedNarrative);
      }
      
      if (onUpdate) onUpdate();
      alert("Recommendation sent successfully!");
      onClose();
    } catch (err) {
      setError(`Failed to send: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  }

  async function handleDismiss() {
    const reason = prompt("Please provide a reason for dismissing this recommendation:");
    if (reason === null) return;

    try {
      setIsDismissing(true);
      setError("");
      
      if (recommendationId) {
        await makeDecision(recommendationId, "dismiss", null, reason);
      }
      
      if (onUpdate) onUpdate();
      alert("Recommendation dismissed.");
      onClose();
    } catch (err) {
      setError(`Failed to dismiss: ${err.message}`);
    } finally {
      setIsDismissing(false);
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "40px",
            maxWidth: "500px",
            textAlign: "center",
          }}
        >
          Loading recommendation...
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const customerName = customerContext?.name || recommendation.customer_name || recommendation.customer_id;
  const status = recommendation.status || "pending";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Review & Send Offer
            </h2>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              {recommendation.product_name || recommendation.product_code}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: "#64748b",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              background: "#fee2e2",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              color: "#991b1b",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Collapsible Customer Profile */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setShowCustomerProfile(!showCustomerProfile)}
            style={{
              width: "100%",
              padding: "16px 20px",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} />
              Customer Profile - {customerName}
            </span>
            {showCustomerProfile ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showCustomerProfile && customerContext && (
            <div
              style={{
                padding: "20px",
                background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", fontSize: "13px" }}>
                <div>
                  <strong>Customer ID:</strong> {customerContext.customer_id}
                </div>
                <div>
                  <strong>Cluster:</strong> {customerContext.cluster?.cluster_id ?? "N/A"}
                </div>
                <div>
                  <strong>RFM Segment:</strong> {customerContext.rfm?.rfm_segment ?? "N/A"}
                </div>
                <div>
                  <strong>Annual Income:</strong> €{customerContext.annual_income?.toLocaleString() ?? "N/A"}
                </div>
                <div>
                  <strong>Profession:</strong> {customerContext.profession || "N/A"}
                </div>
                <div>
                  <strong>Current Products:</strong> {customerContext.product_count ?? 0}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Offer Details */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Offer Details</h3>
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Acceptance Probability</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#3b82f6" }}>
                  {((recommendation.acceptance_probability || 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Expected Revenue</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#10b981" }}>
                  €{(recommendation.expected_revenue || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Category</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                  {recommendation.category || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Explanation Panel */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>Why This Offer?</h3>
            {!isEditing && status !== "sent" && status !== "dismissed" && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "6px 12px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Edit size={14} />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div>
              <textarea
                value={editedNarrative}
                onChange={(e) => setEditedNarrative(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  border: "2px solid #3b82f6",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  marginBottom: "12px",
                }}
                placeholder="Edit the explanation..."
              />
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Reason for editing (optional)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "12px",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    padding: "8px 16px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedNarrative(recommendation.explanation || recommendation.narrative || "");
                    setEditReason("");
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#e2e8f0",
                    color: "#64748b",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e2e8f0",
                fontSize: "14px",
                lineHeight: "1.6",
                color: "#1e293b",
              }}
            >
              {recommendation.explanation || recommendation.narrative || "No explanation available."}
            </div>
          )}

          {/* Key Factors */}
          {recommendation.key_factors && Object.keys(recommendation.key_factors).length > 0 && (
            <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Key Factors:</div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#475569" }}>
                {Object.entries(recommendation.key_factors).map(([key, value]) => (
                  <li key={key} style={{ marginBottom: "4px" }}>
                    <strong>{key}:</strong> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Message Draft */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} />
              Message Draft
            </h3>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select
                value={messageTone}
                onChange={(e) => {
                  setMessageTone(e.target.value);
                  generateMessage();
                }}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="short">Short</option>
              </select>
              <button
                onClick={generateMessage}
                disabled={isGeneratingMessage}
                style={{
                  padding: "6px 12px",
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: isGeneratingMessage ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw size={14} style={{ animation: isGeneratingMessage ? "spin 1s linear infinite" : "none" }} />
                Regenerate
              </button>
            </div>
          </div>
          <textarea
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            style={{
              width: "100%",
              minHeight: "150px",
              padding: "12px",
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
              lineHeight: "1.6",
            }}
            placeholder="AI-generated message will appear here..."
          />
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeReasons}
                onChange={(e) => {
                  setIncludeReasons(e.target.checked);
                  generateMessage();
                }}
              />
              Include key reasons in message
            </label>
          </div>
        </div>

        {/* Compliance Note */}
        <div
          style={{
            padding: "12px",
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#92400e",
            marginBottom: "24px",
            display: "flex",
            alignItems: "start",
            gap: "8px",
          }}
        >
          <Shield size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Compliance Note:</strong> This is not financial advice. All recommendations require human review
            before sending to customers. Generated by AI – Reviewed by employee.
          </div>
        </div>

        {/* Action Buttons */}
        {status !== "sent" && status !== "dismissed" && (
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              onClick={handleDismiss}
              disabled={isDismissing}
              style={{
                padding: "10px 20px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isDismissing ? "not-allowed" : "pointer",
                opacity: isDismissing ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <XCircle size={16} />
              Dismiss
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isSending ? "not-allowed" : "pointer",
                opacity: isSending ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Send size={16} />
              {isSending ? "Sending..." : "Approve & Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

