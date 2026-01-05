import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Shield,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  AlertCircle,
} from "lucide-react";

export default function AIMessageComposer({
  customerName = "",
  customerId = "",
  productName = "",
  productCode = "",
  clusterLabel = "",
  clusterId = null,
  onSend,
  onSave,
}) {
  const [showAILab, setShowAILab] = useState(false); // Hide examples by default
  const [tone, setTone] = useState("friendly");
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // System Examples - Advanced Banking Services
  const systemExamples = [
    // Life-Stage & Predictive Nudges
    {
      id: "sys-1",
      category: "Life-Stage",
      situation: "Customer (John) just received a 30% salary increase and is browsing real estate sites.",
      response: "Hi {{customer_name}}, congratulations on your recent career milestone! Since you're exploring the housing market, I've pre-approved you for a 'Wellbank Growth-Leap' mortgage with a locked-in rate for 90 days. Would you like to see how this fits your new budget?",
      tone: "friendly",
      service: "Growth-Leap Mortgage Pre-Approval",
    },
    {
      id: "sys-2",
      category: "Life-Stage",
      situation: "Customer (Sarah) has frequent payments to pediatricians and toy stores.",
      response: "Hello {{customer_name}}, as your family grows, so do your financial goals. We've designed a 'Junior Navigator' savings plan that builds an education fund automatically. I've attached a projection of how a small monthly nudge today can secure their university tuition later.",
      tone: "friendly",
      service: "Next-Gen Family Wealth Shield",
    },
    // High-Tech & ESG (Green) Services
    {
      id: "sys-3",
      category: "High-Tech/ESG",
      situation: "Customer frequently shops at eco-friendly brands and spends heavily on fuel.",
      response: "Hi {{customer_name}}, we noticed your commitment to sustainable brands! Wellbank now offers an 'Eco-Pivot' investment portfolio that offsets your monthly carbon footprint while earning competitive returns. Want to see your impact report?",
      tone: "friendly",
      service: "Carbon-Offset Portfolio",
    },
    {
      id: "sys-4",
      category: "High-Tech/ESG",
      situation: "Customer has multiple transfers to crypto exchanges but no secure custody.",
      response: "Hello {{customer_name}}, we see you're active in the digital asset space. To ensure your holdings are as secure as your bank account, we've launched the 'Wellbank Obsidian Vault' for institutional-grade crypto custody. It integrates directly with your main dashboard for 100% visibility.",
      tone: "formal",
      service: "Crypto-Safe Liquidity Vault",
    },
    // Wealth-Optimizer (Professional Copilot)
    {
      id: "sys-5",
      category: "Wealth-Optimizer",
      situation: "Customer has over $50k sitting in a 0% interest checking account for 3 months.",
      response: "Hi {{customer_name}}, your current balance is working hard, but it could be working harder. I've identified a 'Smart-Locker' treasury move that could earn you an extra $200/month in interest while keeping your funds 100% liquid. Shall we move the excess?",
      tone: "friendly",
      service: "Idle-Cash Yield Nudge",
    },
    {
      id: "sys-6",
      category: "Wealth-Optimizer",
      situation: "Customer is currently in London and paying high foreign transaction fees.",
      response: "Safe travels in the UK, {{customer_name}}! Since you're traveling, I've enabled 'Nomad-Mode' on your card to give you the mid-market exchange rate with zero fees for the next 30 days. Enjoy your trip!",
      tone: "friendly",
      service: "Global Nomad FX Shield",
    },
  ];

  const [examples, setExamples] = useState(() => {
    // Load user examples from localStorage or use system examples
    try {
      const saved = localStorage.getItem('wellbank_ai_examples');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure we always have system examples
        const systemIds = new Set(systemExamples.map(e => e.id));
        const userExamples = parsed.filter(e => !systemIds.has(e.id));
        return [...systemExamples, ...userExamples];
      }
    } catch (e) {
      console.error('Failed to load saved examples:', e);
    }
    // Start with system examples (create new array to avoid reference issues)
    return [...systemExamples];
  });
  const [newExample, setNewExample] = useState({ situation: "", response: "" });
  const [showAddExample, setShowAddExample] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState({ passed: false, message: "" });

  // Tone presets
  const tonePresets = {
    formal: {
      name: "Formal",
      examples: [
        {
          situation: "Customer inquiry about premium service",
          response: "Dear {{customer_name}}, We are pleased to present {{product_name}} as a tailored solution for your financial needs. This offering aligns with your current portfolio and provides enhanced benefits.",
        },
      ],
    },
    friendly: {
      name: "Friendly",
      examples: [
        {
          situation: "Customer showing interest in new product",
          response: "Hi {{customer_name}}! We thought you might be interested in {{product_name}}. It's a great fit based on your banking history, and we'd love to tell you more about how it could benefit you.",
        },
      ],
    },
    urgent: {
      name: "Urgent",
      examples: [
        {
          situation: "Time-sensitive offer or limited availability",
          response: "Hello {{customer_name}}, We have an exclusive opportunity for you with {{product_name}}. This offer is available for a limited time and could provide significant value to your financial strategy.",
        },
      ],
    },
  };

  // Generate explanation using few-shot prompting
  // Uses examples as few-shot prompts to explain why customer suits the service
  async function generateDraft() {
    setIsGenerating(true);
    try {
      // Simulate API call - in production, this would call your FastAPI backend
      // The backend would receive:
      // - System prompt: "You are a Wellbank AI Analyst. Explain why a customer suits a service recommendation."
      // - Few-shot examples: The active examples below (as context for style and reasoning)
      // - Customer data: customerName, productName, etc.
      // - Task: "Explain why this customer is a good fit for this service."
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dynamic Shot Selection: Prioritize examples based on Cluster and Product Category
      const safeExamples = Array.isArray(examples) ? examples : [];
      
      // Step 1: Filter by tone
      let candidateExamples = safeExamples.filter(e => e && (e.tone === tone || !e.tone));
      
      // Step 2: Prioritize by Cluster Match (Dynamic Shot Selection)
      if (clusterLabel || clusterId !== null) {
        const clusterLower = (clusterLabel || "").toLowerCase();
        
        // Map cluster to example categories (matching systemExamples categories)
        const clusterCategoryMap = {
          "silver savers": "Wealth-Optimizer",
          "wealthy": "Wealth-Optimizer",
          "digital nomads": "High-Tech/ESG",
          "tech": "High-Tech/ESG",
          "family": "Life-Stage",
          "young": "Life-Stage",
        };
        
        let matchedCategory = null;
        for (const [key, category] of Object.entries(clusterCategoryMap)) {
          if (clusterLower.includes(key)) {
            matchedCategory = category;
            break;
          }
        }
        
        // Reorder examples: cluster-matched first, then others
        if (matchedCategory) {
          candidateExamples.sort((a, b) => {
            const aMatch = a.category === matchedCategory ? 1 : 0;
            const bMatch = b.category === matchedCategory ? 1 : 0;
            return bMatch - aMatch; // Matched category examples first
          });
        }
      }
      
      // Step 3: Further prioritize by Product Category Match
      if (productName || productCode) {
        const productLower = (productName || productCode).toLowerCase();
        candidateExamples.sort((a, b) => {
          const aServiceMatch = a.service && productLower.includes(a.service.toLowerCase().split(' ')[0]) ? 1 : 0;
          const bServiceMatch = b.service && productLower.includes(b.service.toLowerCase().split(' ')[0]) ? 1 : 0;
          return bServiceMatch - aServiceMatch; // Product-matched examples first
        });
      }
      
      // Step 4: Select top 3 examples (now intelligently prioritized)
      const activeExamples = candidateExamples.slice(0, 3);
      
      // Find the most relevant example
      let relevantExample = activeExamples.find(e => e && e.response) || null;
      
      // Generate explanation based on few-shot examples
      // The examples teach the AI the style and reasoning pattern
      let explanation = "";
      
      if (relevantExample && relevantExample.situation && relevantExample.response) {
        // Use few-shot pattern: analyze the example's reasoning style
        // Example shows: situation -> why it fits -> recommendation
        const exampleReasoning = relevantExample.response
          .replace(/\{\{customer_name\}\}/g, "Example Customer")
          .replace(/\{\{product_name\}\}/g, "Example Product");
        
        // Generate explanation following the same reasoning pattern
        const customerDisplayName = customerName || `Customer ${customerId || "N/A"}`;
        const productDisplayName = productName || productCode || "this service";
        
        // Build explanation using the few-shot pattern
        explanation = `Based on ${customerDisplayName}'s financial profile and transaction patterns, ${productDisplayName} is an ideal recommendation. `;
        
        // Add reasoning based on example pattern
        if (relevantExample.category === "Life-Stage") {
          explanation += `The customer's current life stage and spending behavior align with customers who typically benefit from this service. `;
        } else if (relevantExample.category === "High-Tech") {
          explanation += `The customer's digital engagement and transaction patterns indicate a strong fit for this modern financial solution. `;
        } else if (relevantExample.category === "Wealth-Optimizer") {
          explanation += `Analysis of the customer's portfolio reveals optimization opportunities that this service addresses directly. `;
        } else {
          explanation += `The customer's financial behavior and needs match the target profile for this service. `;
        }
        
        explanation += `This recommendation is data-driven, based on clustering analysis and predictive modeling that identifies customers with similar profiles who have successfully adopted this service.`;
      } else {
        // Fallback explanation without examples
        const customerDisplayName = customerName || `Customer ${customerId || "N/A"}`;
        const productDisplayName = productName || productCode || "this service";
        explanation = `${customerDisplayName} is a strong candidate for ${productDisplayName} based on their financial profile, transaction history, and cluster analysis. The recommendation is derived from machine learning models that identify patterns in customer behavior and match them with optimal service offerings.`;
      }
      
      setDraft(explanation);
      setOriginalDraft(explanation); // Store original for comparison
      checkCompliance(explanation);
    } catch (err) {
      console.error("Failed to generate explanation:", err);
      // Safe fallback
      const fallbackExplanation = `${customerName || "This customer"} is recommended for ${productName || productCode || "this service"} based on their financial profile and behavioral patterns.`;
      setDraft(fallbackExplanation);
      checkCompliance(fallbackExplanation);
    } finally {
      setIsGenerating(false);
    }
  }

  // Check compliance (simplified - in production, this would call a compliance API)
  function checkCompliance(text) {
    const hasDisclaimer = text.toLowerCase().includes("terms") || 
                         text.toLowerCase().includes("conditions") ||
                         text.toLowerCase().includes("subject to");
    
    if (hasDisclaimer) {
      setComplianceStatus({
        passed: true,
        message: "Compliance check passed - includes required disclaimers",
      });
    } else {
      setComplianceStatus({
        passed: false,
        message: "Warning: Consider adding legal disclaimers before sending",
      });
    }
  }

  // Add new example
  function handleAddExample() {
    if (newExample.situation && newExample.response) {
      const example = {
        id: Date.now(),
        ...newExample,
        tone: tone,
      };
      setExamples([...examples, example]);
      setNewExample({ situation: "", response: "" });
      setShowAddExample(false);
    }
  }

  // Remove example
  function handleRemoveExample(id) {
    setExamples((prevExamples) => (prevExamples || []).filter(e => e && e.id !== id));
  }

  // Apply tone preset
  function handleToneChange(newTone) {
    setTone(newTone);
    // Filter system examples by tone and add if not present
    const toneSystemExamples = systemExamples.filter(ex => ex.tone === newTone);
    const newExamples = [...examples];
    
    toneSystemExamples.forEach(sysEx => {
      const existing = (examples || []).find(e => e && e.id === sysEx.id);
      if (!existing) {
        newExamples.push(sysEx);
      }
    });
    
    setExamples(newExamples);
  }

  // Reset to system examples
  function handleResetToSystem() {
    setExamples(systemExamples);
  }

  // Initialize draft on mount or when dependencies change
  useEffect(() => {
    // Only generate if we have at least customer name or product info
    if ((customerName || customerId) && (productName || productCode)) {
      // Use setTimeout to avoid calling during render
      const timer = setTimeout(() => {
        try {
          generateDraft();
        } catch (err) {
          console.error("Error in generateDraft from useEffect:", err);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerName, customerId, productName, productCode, tone]); // Removed 'examples' to prevent infinite loop

  // Check if draft was significantly edited (for feedback loop)
  const isDraftSignificantlyEdited = () => {
    if (!originalDraft || !draft) return false;
    const originalWords = originalDraft.split(/\s+/).length;
    const editedWords = draft.split(/\s+/).length;
    const wordDiff = Math.abs(originalWords - editedWords) / originalWords;
    
    // Consider significant if >30% word change or substantial content difference
    return wordDiff > 0.3 || draft.length < originalDraft.length * 0.7 || draft.length > originalDraft.length * 1.5;
  };

  // Handle send with feedback loop
  const handleSend = () => {
    if (!complianceStatus.passed || !draft.trim()) return;
    
    // Check if draft was significantly edited
    if (isDraftSignificantlyEdited() && originalDraft) {
      setShowGoldStandardPrompt(true);
    } else {
      // Send directly if not significantly edited
      if (onSend) onSend(draft, complianceStatus.passed);
    }
  };

  // Handle adding to gold standard examples
  const handleAddToGoldStandard = () => {
    if (!draft.trim()) return;
    
    const newExample = {
      id: `gold-${Date.now()}`,
      category: clusterLabel ? "Custom" : "General",
      situation: `Customer ${customerName || customerId} - ${productName || productCode}`,
      response: draft,
      tone: tone,
      service: productName || productCode,
      isGoldStandard: true,
    };
    
    const updatedExamples = [...examples, newExample];
    setExamples(updatedExamples);
    
    // Save to localStorage
    try {
      localStorage.setItem('wellbank_ai_examples', JSON.stringify(updatedExamples));
    } catch (e) {
      console.error('Failed to save gold standard example:', e);
    }
    
    setShowGoldStandardPrompt(false);
    if (onSend) onSend(draft, complianceStatus.passed);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      marginTop: "20px",
      position: "relative",
    }}>
      {/* Ambient Orb Effect */}
      <div style={{
        position: "absolute",
        top: "-20px",
        left: "-20px",
        width: "200px",
        height: "200px",
        background: "radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <Sparkles size={18} color="#22D3EE" />
          <h4 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#E2E8F0",
            margin: 0,
          }}>
            AI Explanation Generator
          </h4>
        </div>
        <button
          onClick={() => setShowAILab(!showAILab)}
          style={{
            padding: "4px 8px",
            background: "rgba(34, 211, 238, 0.1)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            borderRadius: "6px",
            color: "#22D3EE",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {showAILab ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAILab ? "Hide" : "Show"} Examples (Advanced)
        </button>
      </div>

      {/* Split View Container */}
      <div style={{
        display: "flex",
        gap: "16px",
        minHeight: "400px",
      }}>
        {/* LEFT SIDE - AI Lab (Tone & Style Guide) */}
        {showAILab && (
          <div style={{
            flex: "0 0 45%",
            background: "rgba(30, 41, 59, 0.5)",
            backdropFilter: "blur(12px)",
            border: "1px solid",
            borderImage: "linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(124, 58, 237, 0.2)) 1",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 0 20px rgba(34, 211, 238, 0.1)",
          }}>
            <div style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#E2E8F0",
              marginBottom: "8px",
            }}>
              Tone & Style Guide
            </div>

            {/* Tone Toggles */}
            <div style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}>
              {Object.keys(tonePresets).map((toneKey) => (
                <button
                  key={toneKey}
                  onClick={() => handleToneChange(toneKey)}
                  style={{
                    padding: "6px 12px",
                    background: tone === toneKey 
                      ? "rgba(34, 211, 238, 0.2)" 
                      : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${tone === toneKey ? "rgba(34, 211, 238, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: "8px",
                    color: tone === toneKey ? "#22D3EE" : "#94A3B8",
                    fontSize: "12px",
                    fontWeight: tone === toneKey ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tonePresets[toneKey].name}
                </button>
              ))}
            </div>

              {/* Examples Gallery */}
              <div style={{
                flex: 1,
                overflowY: "auto",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    Active Examples ({examples.length})
                  </div>
                  <div style={{
                    display: "flex",
                    gap: "6px",
                  }}>
                    <button
                      onClick={handleResetToSystem}
                      style={{
                        padding: "4px 8px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        color: "#94A3B8",
                        cursor: "pointer",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Reset to system examples"
                    >
                      <Zap size={12} />
                      Reset
                    </button>
                    <button
                      onClick={() => setShowAddExample(!showAddExample)}
                      style={{
                        padding: "4px 8px",
                        background: "rgba(34, 211, 238, 0.1)",
                        border: "1px solid rgba(34, 211, 238, 0.3)",
                        borderRadius: "6px",
                        color: "#22D3EE",
                        cursor: "pointer",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Plus size={12} />
                      Add Example
                    </button>
                  </div>
                </div>

                {/* System Examples Info */}
                <div style={{
                  padding: "8px 12px",
                  background: "rgba(34, 211, 238, 0.05)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  borderRadius: "6px",
                  marginBottom: "12px",
                  fontSize: "11px",
                  color: "#22D3EE",
                }}>
                  <strong>System Examples:</strong> Advanced banking services (Life-Stage, High-Tech/ESG, Wealth-Optimizer) are pre-loaded. Add custom examples to personalize.
                </div>

              {/* Add Example Form */}
              {showAddExample && (
                <div style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "12px",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                }}>
                  <input
                    type="text"
                    placeholder="Customer Situation..."
                    value={newExample.situation}
                    onChange={(e) => setNewExample({ ...newExample, situation: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      color: "#E2E8F0",
                      fontSize: "12px",
                      marginBottom: "8px",
                    }}
                  />
                  <textarea
                    placeholder="Ideal Response (use {{customer_name}} and {{product_name}} for variables)..."
                    value={newExample.response}
                    onChange={(e) => setNewExample({ ...newExample, response: e.target.value })}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "rgba(0, 0, 0, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "6px",
                      color: "#E2E8F0",
                      fontSize: "12px",
                      marginBottom: "8px",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <div style={{
                    display: "flex",
                    gap: "8px",
                  }}>
                    <button
                      onClick={handleAddExample}
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        background: "rgba(34, 211, 238, 0.2)",
                        border: "1px solid rgba(34, 211, 238, 0.4)",
                        borderRadius: "6px",
                        color: "#22D3EE",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddExample(false);
                        setNewExample({ situation: "", response: "" });
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        color: "#94A3B8",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Examples List */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}>
                {(examples || []).map((example, idx) => {
                  const isSystemExample = example.id?.startsWith('sys-');
                  return (
                    <div
                      key={example.id}
                      style={{
                        background: isSystemExample 
                          ? "rgba(34, 211, 238, 0.05)" 
                          : "rgba(0, 0, 0, 0.2)",
                        borderRadius: "8px",
                        padding: "12px",
                        border: `1px solid ${isSystemExample 
                          ? "rgba(34, 211, 238, 0.2)" 
                          : "rgba(255, 255, 255, 0.1)"}`,
                        position: "relative",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "8px",
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}>
                          <div style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#22D3EE",
                          }}>
                            {isSystemExample ? "System" : "Custom"} Example {idx + 1}
                          </div>
                          {example.category && (
                            <span style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              background: "rgba(34, 211, 238, 0.1)",
                              border: "1px solid rgba(34, 211, 238, 0.3)",
                              borderRadius: "4px",
                              color: "#22D3EE",
                            }}>
                              {example.category}
                            </span>
                          )}
                          {example.service && (
                            <span style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              background: "rgba(16, 185, 129, 0.1)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              borderRadius: "4px",
                              color: "#10b981",
                            }}>
                              {example.service}
                            </span>
                          )}
                        </div>
                        {!isSystemExample && (
                          <button
                            onClick={() => handleRemoveExample(example.id)}
                            style={{
                              padding: "2px",
                              background: "transparent",
                              border: "none",
                              color: "#94A3B8",
                              cursor: "pointer",
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: "#94A3B8",
                        marginBottom: "6px",
                        fontStyle: "italic",
                      }}>
                        Situation: {example.situation}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#E2E8F0",
                        lineHeight: "1.5",
                      }}>
                        {example.response}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save as Default */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              background: "rgba(0, 0, 0, 0.2)",
              borderRadius: "8px",
            }}>
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                style={{
                  cursor: "pointer",
                }}
              />
              <label style={{
                fontSize: "12px",
                color: "#94A3B8",
                cursor: "pointer",
              }}>
                Save as Default (improves AI over time)
              </label>
            </div>
          </div>
        )}

        {/* RIGHT SIDE - Live Draft */}
        <div style={{
          flex: showAILab ? "1" : "1",
          background: "rgba(30, 41, 59, 0.5)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}>
            <div style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#E2E8F0",
            }}>
              Why This Customer Suits This Service
            </div>
            <button
              onClick={generateDraft}
              disabled={isGenerating}
              style={{
                padding: "6px 12px",
                background: "rgba(34, 211, 238, 0.1)",
                border: "1px solid rgba(34, 211, 238, 0.3)",
                borderRadius: "6px",
                color: "#22D3EE",
                fontSize: "12px",
                fontWeight: 600,
                cursor: isGenerating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: isGenerating ? 0.5 : 1,
              }}
            >
              <RefreshCw size={14} style={{
                animation: isGenerating ? "spin 1s linear infinite" : "none",
              }} />
              Regenerate
            </button>
          </div>

          {/* Variable Injection Info */}
          <div style={{
            padding: "8px 12px",
            background: "rgba(34, 211, 238, 0.1)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
            borderRadius: "6px",
            fontSize: "11px",
            color: "#22D3EE",
          }}>
            <strong>Variables:</strong> {'{{customer_name}}'} = {customerName || "N/A"}, {'{{product_name}}'} = {productName || productCode || "N/A"}
          </div>

          {/* Draft Editor */}
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              checkCompliance(e.target.value);
            }}
            placeholder="AI-generated explanation will appear here..."
            rows={12}
            style={{
              flex: 1,
              width: "100%",
              padding: "12px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#E2E8F0",
              fontSize: "13px",
              lineHeight: "1.6",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />

          {/* Compliance Flag */}
          {complianceStatus.message && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              background: complianceStatus.passed 
                ? "rgba(16, 185, 129, 0.1)" 
                : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${complianceStatus.passed 
                ? "rgba(16, 185, 129, 0.3)" 
                : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: "8px",
            }}>
              {complianceStatus.passed ? (
                <Shield size={16} color="#10b981" />
              ) : (
                <AlertCircle size={16} color="#ef4444" />
              )}
              <span style={{
                fontSize: "12px",
                color: complianceStatus.passed ? "#10b981" : "#ef4444",
              }}>
                {complianceStatus.message}
              </span>
            </div>
          )}

          {/* Action Buttons - Enhanced Design */}
          <div style={{
            display: "flex",
            gap: "8px",
          }}>
            <button
              onClick={() => {
                if (onSave) onSave(draft, examples, saveAsDefault);
              }}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#E2E8F0",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <Save size={16} />
              Save Explanation
            </button>
            <button
              onClick={handleSend}
              disabled={!complianceStatus.passed || !draft.trim()}
              style={{
                flex: 2,
                padding: "10px 16px",
                background: complianceStatus.passed && draft.trim()
                  ? "linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                boxShadow: complianceStatus.passed && draft.trim()
                  ? "0 0 15px rgba(34, 211, 238, 0.4)"
                  : "none",
                border: "none",
                borderRadius: "8px",
                color: complianceStatus.passed && draft.trim() ? "#0B0E14" : "#94A3B8",
                fontSize: "13px",
                fontWeight: 700,
                cursor: complianceStatus.passed && draft.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: complianceStatus.passed && draft.trim() ? 1 : 0.5,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (complianceStatus.passed && draft.trim()) {
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(34, 211, 238, 0.6)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (complianceStatus.passed && draft.trim()) {
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(34, 211, 238, 0.4)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <Send size={16} />
              Use This Explanation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

