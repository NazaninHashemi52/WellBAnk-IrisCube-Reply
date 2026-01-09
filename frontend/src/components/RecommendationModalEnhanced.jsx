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
  Lightbulb,
} from "lucide-react";
import { getRecommendationById, regenerateMessage, makeDecision, getOfferCatalog, changeService, getAdvisorStrategy, getFullProductCatalog } from "../api/offers";
import { API_BASE_URL, apiRequest } from "../api/config";

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
    
    // Load product catalog for swap functionality
    loadProductCatalog();
    
    // Load AI reasoning if we have customer context
    if (customerContext?.customer_id) {
      loadAIReasoning(customerContext.customer_id);
    }
    
    // Set initial selected product
    if (recommendationProp?.product_code) {
      setSelectedProductCode(recommendationProp.product_code);
    } else if (recommendation?.product_code) {
      setSelectedProductCode(recommendation.product_code);
    }
  }, [recommendationId, recommendationProp, customerContext, recommendation]);
  
  async function loadProductCatalog() {
    try {
      const catalog = await getOfferCatalog();
      setProductCatalog(catalog.catalog || {});
      
      // Also load full product catalog from ProductRecommendationEngine
      try {
        const fullCatalog = await getFullProductCatalog();
        setFullProductCatalog(fullCatalog.catalog || catalog.catalog || {});
      } catch (err) {
        console.warn("Failed to load full product catalog, using basic catalog:", err);
        setFullProductCatalog(catalog.catalog || {});
      }
    } catch (err) {
      console.error("Failed to load product catalog:", err);
    }
  }
  
  async function generateReasoningForProduct(productCode, customerId) {
    if (!customerId || !productCode) return;
    
    try {
      // Get customer intelligence to generate reasoning for the selected product
      const strategy = await getAdvisorStrategy(customerId);
      if (strategy && strategy.recommendations) {
        // Check if this product is in the recommendations
        const productRec = strategy.recommendations.find(rec => rec.product_code === productCode);
        if (productRec) {
          setSelectedProductReasoning({
            detailed_reasoning: productRec.detailed_reasoning,
            short_reasoning: productRec.short_reasoning,
            key_benefits: productRec.key_benefits,
            fitness_score: productRec.fitness_score,
            triggers_used: productRec.triggers_used,
          });
          setFitnessScore(productRec.fitness_score);
        } else {
          // Product not in recommendations, create basic reasoning from catalog
          const catalogProduct = fullProductCatalog?.[productCode] || productCatalog?.[productCode];
          if (catalogProduct) {
            setSelectedProductReasoning({
              detailed_reasoning: `This product (${catalogProduct.name || catalogProduct.display_name}) is available in our catalog. Please review the product details and customer profile to determine suitability.`,
              short_reasoning: catalogProduct.description || catalogProduct.eligibility_notes || "Product available for consideration",
              key_benefits: catalogProduct.key_benefits || [],
              fitness_score: null, // Not calculated for non-recommended products
              triggers_used: [],
            });
            setFitnessScore(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to generate reasoning for product:", err);
    }
  }
  
  function handleProductSelection(productCode) {
    setSelectedProductCode(productCode);
    const customerId = customerContext?.customer_id || recommendation?.customer_id;
    if (customerId && productCode) {
      generateReasoningForProduct(productCode, customerId);
      // Clear current draft message to trigger regeneration
      setDraftMessage("");
    }
  }
  
  // Regenerate message when product changes
  useEffect(() => {
    if (selectedProductCode && (selectedProductReasoning || aiReasoning)) {
      generateMessage();
    }
  }, [selectedProductCode, selectedProductReasoning]);
  
  async function loadAIReasoning(customerId) {
    try {
      const strategy = await getAdvisorStrategy(customerId);
      if (strategy && strategy.recommendations && strategy.recommendations.length > 0) {
        // Find the recommendation matching the current product
        const currentProductCode = recommendation?.product_code || recommendationProp?.product_code;
        const matchingRec = strategy.recommendations.find(
          rec => rec.product_code === currentProductCode
        );
        if (matchingRec) {
          setAiReasoning({
            detailed_reasoning: matchingRec.detailed_reasoning,
            short_reasoning: matchingRec.short_reasoning,
            key_benefits: matchingRec.key_benefits,
            triggers_used: matchingRec.triggers_used,
          });
          setFitnessScore(matchingRec.fitness_score);
        }
      }
    } catch (err) {
      console.warn("Failed to load AI reasoning:", err);
    }
  }
  
  async function handleProductSwap(newProductCode) {
    if (!recommendationId) {
      alert("Cannot swap product: No recommendation ID available");
      return;
    }
    
    try {
      await changeService(recommendationId, newProductCode);
      // Reload recommendation to get updated data
      if (recommendationId) {
        await loadRecommendation();
      }
      setShowProductSwap(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(`Failed to swap product: ${err.message}`);
    }
  }

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
    if (!recommendation && !selectedProductCode) return;

    setIsGeneratingMessage(true);
    try {
      // If product was changed via dropdown, generate message for new product
      if (selectedProductCode && selectedProductCode !== recommendation?.product_code) {
        const customerId = customerContext?.customer_id || recommendation?.customer_id;
        const selectedProduct = fullProductCatalog?.[selectedProductCode] || productCatalog?.[selectedProductCode];
        const reasoning = selectedProductReasoning || aiReasoning;
        
        // Generate message using AI reasoning for selected product
        const customerName = customerContext?.name || recommendation?.customer_name || "Customer";
        const productName = selectedProduct?.name || selectedProduct?.display_name || selectedProductCode;
        
        let message = `Good morning ${customerName},\n\n`;
        message += `I was reviewing your portfolio and thought that ${productName} could be a great fit for your financial needs.\n\n`;
        
        if (reasoning?.short_reasoning) {
          message += `${reasoning.short_reasoning}\n\n`;
        }
        
        if (reasoning?.key_benefits && reasoning.key_benefits.length > 0) {
          message += `Key benefits:\n${reasoning.key_benefits.slice(0, 3).map(b => `• ${b}`).join('\n')}\n\n`;
        }
        
        message += `Would you like to discuss this briefly?\n\nBest regards,\nWellBank Team`;
        
        setDraftMessage(message);
      } else if (recommendationId) {
        // If we have a recommendationId, use the API endpoint
        const result = await regenerateMessage(recommendationId, messageTone);
        setDraftMessage(result.draft_message);
      } else if (recommendation?.draft_message) {
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
  
  // Regenerate message when product changes via dropdown
  useEffect(() => {
    if (selectedProductCode && selectedProductCode !== recommendation?.product_code && (selectedProductReasoning || aiReasoning)) {
      generateMessage();
    }
  }, [selectedProductCode, selectedProductReasoning]);
  
  // Regenerate message when product changes via dropdown
  useEffect(() => {
    if (selectedProductCode && selectedProductCode !== recommendation?.product_code && (selectedProductReasoning || aiReasoning)) {
      generateMessage();
    }
  }, [selectedProductCode, selectedProductReasoning]);

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
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Review & Send Offer
            </h2>
            <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "12px" }}>
              {selectedProductCode 
                ? (fullProductCatalog?.[selectedProductCode]?.name || productCatalog?.[selectedProductCode]?.display_name || selectedProductCode)
                : (recommendation.product_name || recommendation.product_code)}
            </div>
            
            {/* Product Selection Dropdown */}
            {fullProductCatalog && Object.keys(fullProductCatalog).length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <label style={{ 
                  fontSize: "12px", 
                  fontWeight: 600, 
                  color: "#64748b", 
                  marginBottom: "6px",
                  display: "block",
                }}>
                  Select Product from Catalog:
                </label>
                <select
                  value={selectedProductCode || recommendation.product_code || ""}
                  onChange={(e) => handleProductSelection(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "8px 12px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1e293b",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <option value={recommendation.product_code || ""}>
                    {recommendation.product_name || recommendation.product_code || "Select a product..."}
                  </option>
                  {Object.entries(fullProductCatalog).map(([code, product]) => (
                    <option key={code} value={code}>
                      {product.name || product.display_name || code} - {product.category || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Fitness Score</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: (selectedProductReasoning?.fitness_score ?? fitnessScore) !== null ? ((selectedProductReasoning?.fitness_score ?? fitnessScore) >= 80 ? "#10b981" : (selectedProductReasoning?.fitness_score ?? fitnessScore) >= 70 ? "#3b82f6" : "#f59e0b") : "#64748b" }}>
                  {(selectedProductReasoning?.fitness_score ?? fitnessScore) !== null ? `${selectedProductReasoning?.fitness_score ?? fitnessScore}%` : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Benefits from AI - Why This Fits */}
        {aiReasoning && aiReasoning.key_benefits && aiReasoning.key_benefits.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Lightbulb size={18} style={{ color: "#8b5cf6" }} />
              Why This Fits - Key Benefits
            </h3>
            <div
              style={{
                background: "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
                borderRadius: "12px",
                padding: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#1e293b", lineHeight: "1.8" }}>
                {aiReasoning.key_benefits.map((benefit, idx) => (
                  <li key={idx} style={{ marginBottom: "8px" }}>
                    <strong style={{ color: "#8b5cf6" }}>✓</strong> {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* AI Reasoning Panel - Reasoning Layer */}
        {(aiReasoning || selectedProductReasoning) && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} style={{ color: "#8b5cf6" }} />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>AI Reasoning - Why This Fits</h3>
                {(fitnessScore !== null || selectedProductReasoning?.fitness_score !== null) && (
                  <div style={{
                    padding: "4px 8px",
                    background: (selectedProductReasoning?.fitness_score ?? fitnessScore) >= 70 ? "#10b981" : (selectedProductReasoning?.fitness_score ?? fitnessScore) >= 50 ? "#f59e0b" : "#ef4444",
                    color: "white",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}>
                    Fitness: {selectedProductReasoning?.fitness_score ?? fitnessScore ?? "N/A"}%
                  </div>
                )}
              </div>
              {!isEditing && status !== "sent" && status !== "dismissed" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setShowProductSwap(!showProductSwap)}
                    style={{
                      padding: "6px 12px",
                      background: "#8b5cf6",
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
                    <RefreshCw size={14} />
                    Swap Product
                  </button>
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
                </div>
              )}
            </div>
            
            {/* Product Swap Modal */}
            {showProductSwap && productCatalog && (
              <div style={{
                marginBottom: "16px",
                padding: "16px",
                background: "#f8fafc",
                border: "2px solid #8b5cf6",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "12px" }}>
                  Select Alternative Product:
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}>
                  {Object.entries(productCatalog).map(([code, info]) => (
                    code !== recommendation?.product_code && (
                      <button
                        key={code}
                        onClick={() => handleProductSwap(code)}
                        style={{
                          padding: "8px 12px",
                          background: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#8b5cf6";
                          e.currentTarget.style.background = "#f3f4f6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.background = "white";
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{info.display_name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{info.category}</div>
                      </button>
                    )
                  ))}
                </div>
                <button
                  onClick={() => setShowProductSwap(false)}
                  style={{
                    marginTop: "12px",
                    padding: "6px 12px",
                    background: "#e2e8f0",
                    color: "#64748b",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            
            {/* AI Reasoning Content */}
            <div style={{
              background: "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e2e8f0",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "12px" }}>
                Detailed Analysis
              </div>
              <div style={{ 
                fontSize: "14px", 
                lineHeight: "1.6", 
                color: "#1e293b",
                marginBottom: "16px",
              }}>
                {(selectedProductReasoning || aiReasoning)?.detailed_reasoning || 
                 (selectedProductReasoning || aiReasoning)?.short_reasoning || 
                 "No reasoning available"}
              </div>
              
              {/* Key Benefits */}
              {((selectedProductReasoning || aiReasoning)?.key_benefits?.length > 0) && (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                    Key Benefits:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#475569", lineHeight: "1.8" }}>
                    {(selectedProductReasoning || aiReasoning).key_benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Triggers Used */}
              {((selectedProductReasoning || aiReasoning)?.triggers_used?.length > 0) && (
                <div style={{ marginTop: "12px", padding: "10px", background: "#eff6ff", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e40af", marginBottom: "6px" }}>
                    Recommendation Triggers:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(selectedProductReasoning || aiReasoning).triggers_used.map((trigger, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "4px 8px",
                          background: "#dbeafe",
                          color: "#1e40af",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Explanation Panel - Fallback to existing explanation */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>Why This Offer?</h3>
            {!isEditing && status !== "sent" && status !== "dismissed" && !aiReasoning && (
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
            before sending to customers.
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

