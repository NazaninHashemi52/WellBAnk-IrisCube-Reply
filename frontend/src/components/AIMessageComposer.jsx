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
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Info,
  Target,
  Crown,
  Rocket,
} from "lucide-react";

// The Sanitizer - High-Trust Name Cleaning
// Modern banking UIs never show "Plumbing" (IDs and internal codes) to the user
const sanitizeCustomerName = (rawString) => {
  if (!rawString) return "Valued Customer";
  
  // If it's the comma-separated string: "68129277,De Gennaro,Venere,F,..."
  const parts = rawString.split(',');
  
  if (parts.length > 2) {
    // Usually, parts[1] is Surname, parts[2] is First Name
    const firstName = parts[2]?.trim() || '';
    const lastName = parts[1]?.trim() || '';
    
    // Return full name if both exist, otherwise just the first name
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
  }
  
  // Fallback: remove any leading numbers/codes
  const cleaned = rawString.replace(/^\d+\s*/, '').trim();
  return cleaned || "Valued Customer";
};

// Alias for backward compatibility
const formatCustomerName = sanitizeCustomerName;

// Clean product name with professional display names
const formatProductName = (rawProduct) => {
  if (!rawProduct) return "questo servizio";
  
  // Professional product name mapping - Comprehensive catalog (aligned with backend)
  const productNameMap = {
    // Credit Cards
    "CACR432": "AureaCard Exclusive",
    "CACR748": "AureaCard Infinity",
    "CADB439": "ZynaFlow Plus Debit",
    "CADB783": "EasyYoung Pay",
    "CAPR574": "FlexPay One Prepaid",
    
    // Accounts
    "CCOR602": "MyEnergy Checking Account",
    "BASIC_CHECKING": "Daily Flow Account",
    "BUSINESS_ACCOUNT": "Business Prime Account",
    "MYENERGY": "MyEnergy Digital Account",
    
    // Investments
    "CINV819": "SharesVault Investment",
    "FPEN541": "FutureSecure Pension Fund",
    "PREMIUM_INVESTMENT": "Premium Investment Portfolio",
    "SINV263": "PlannerPro Advisory",
    
    // Savings & Deposits
    "DPAM682": "WealthPlus Managed Deposit",
    "DPAM997": "SafeHarbor Premium Deposit",
    "DPRI866": "SaveSmart Goal Account",
    "DPAM234": "SaveSmart Goal Account",
    "DPAM891": "FutureSecure Pension Fund",
    
    // Credit & Loans
    "CRDT356": "FlexiCredit Line",
    "MTUU356": "DreamHome Mortgage",
    "PRST234": "QuickCash Personal Loan",
    "REWARDS_CREDIT": "Rewards Credit Card",
    "PERSONAL_LOAN": "Personal Loan",
    "MORTGAGE": "DreamHome Mortgage",
    "QUICKCASH": "QuickCash Personal Loan",
    
    // Insurance
    "ASSA566": "SalusCare Health Insurance",
    
    // Packages
    "PRPE771": "Premium Business+ Package",
    "PRPE234": "LifeStyle Premium Package",
    "PRPE567": "SmartPark Urban Services",
    "WEALTH_MANAGEMENT": "Wealth Management Service",
    "SAVINGS_PLAN": "Savings Plan",
  };
  
  // Check if we have a professional name
  if (productNameMap[rawProduct]) {
    return productNameMap[rawProduct];
  }
  
  // Fallback: convert underscore to spaces and title case
  return rawProduct.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function AIMessageComposer({
  customerName = "",
  customerId = "",
  productName = "",
  productCode = "",
  clusterLabel = "",
  clusterId = null,
  aiReasoning = null, // AI reasoning from ProductRecommendationEngine
  customerProfession = null, // Customer profession
  customerSegment = null, // Customer segment (e.g., "Small Business")
  customerRegion = null, // Customer region/location
  customerAge = null, // Customer age
  customerGender = null, // Customer gender
  customerRecommendations = [], // All recommendations for this customer
  onProductChange = null, // Callback when product is changed
  onSend,
  onSave,
}) {
  const [showAILab, setShowAILab] = useState(false); // Hide examples by default
  const [tone, setTone] = useState("growth"); // Smart tone: growth, security, concierge
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false); // For streaming effect
  const [streamedText, setStreamedText] = useState(""); // For streaming effect
  const [aiInsights, setAiInsights] = useState(null); // AI reasoning insights
  const [selectedProductId, setSelectedProductId] = useState(null); // Currently selected product recommendation ID
  const [isSwitchingProduct, setIsSwitchingProduct] = useState(false); // Loading state when switching products
  const [currentProductData, setCurrentProductData] = useState(null); // Current product's data (acceptance, revenue, etc.)
  const [personalizedVars, setPersonalizedVars] = useState({
    name: customerName,
    profession: customerProfession,
    segment: customerSegment,
    region: customerRegion,
  }); // Editable personalized variables
  
  // Nomi puliti per l'uso nel componente
  const cleanCustomerName = formatCustomerName(customerName);
  // Use currentProductData if available, otherwise fall back to props
  const effectiveProductCode = currentProductData?.product_code || productCode;
  const effectiveProductName = currentProductData?.product_name || productName || productCode;
  const cleanProductName = formatProductName(effectiveProductName || effectiveProductCode);
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
  const [complianceStatus, setComplianceStatus] = useState({ 
    passed: false, 
    message: "",
    warnings: [],
    prohibitedWords: [],
  });
  const [originalDraft, setOriginalDraft] = useState("");

  // Smart Tone Strategies - Professional Advisor Tones
  const TONE_STRATEGIES = {
    growth: {
      name: "Growth-Oriented",
      description: "Visionary and ambitious",
      keywords: ["opportunity", "legacy", "future", "potential", "growth"],
      icon: TrendingUp,
      color: "#34d399", // emerald-400 (text-emerald-400)
      suitableFor: ["Investments", "Loans", "Wealth Management"],
    },
    security: {
      name: "Secure/Protective",
      description: "Reassuring and stable",
      keywords: ["peace of mind", "safeguard", "stability", "protection", "secure"],
      icon: ShieldCheck,
      color: "#60a5fa", // blue-400 (text-blue-400)
      suitableFor: ["Savings", "Insurance", "Accounts"],
    },
    concierge: {
      name: "Concierge",
      description: "Exclusive and dedicated",
      keywords: ["exclusive", "priority", "bespoke", "tailored", "dedicated"],
      icon: Sparkles,
      color: "#fbbf24", // amber-400 (text-amber-400)
      suitableFor: ["Wealth Management", "Premium Investment", "Business Account"],
    },
  };

  // Tone presets (kept for backward compatibility with examples)
  const tonePresets = {
    formal: { name: "Formal" },
    friendly: { name: "Friendly" },
    urgent: { name: "Urgent" },
  };

  // Generate explanation using few-shot prompting with streaming effect
  // Uses examples as few-shot prompts to explain why customer suits the service
  async function generateDraft(useStreaming = true) {
    setIsGenerating(true);
    if (useStreaming) {
      setIsStreaming(true);
      setStreamedText("");
    }
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
      
      // Use AI reasoning if available (from ProductRecommendationEngine)
      const aiSituation = aiReasoning?.short_reasoning || aiReasoning?.detailed_reasoning;
      const aiKeyBenefits = aiReasoning?.key_benefits || [];
      
      // Generate explanation based on few-shot examples
      // The examples teach the AI the style and reasoning pattern
      let explanation = "";
      
      if (relevantExample && relevantExample.situation && relevantExample.response) {
        // Use few-shot pattern: analyze the example's reasoning style
        // Example shows: situation -> why it fits -> recommendation
        const exampleReasoning = relevantExample.response
          .replace(/\{\{customer_name\}\}/g, "Example Customer")
          .replace(/\{\{product_name\}\}/g, "Example Product");
        
        // Enhance with AI reasoning if available
        const enhancedSituation = aiSituation 
          ? `${relevantExample.situation} AI Analysis: ${aiSituation}`
          : relevantExample.situation;
        
        // High-Trust AI Message Generation using Value Pillars
        // Value Pillar 1: Personal & Human Greeting
        const toneStrategy = TONE_STRATEGIES[tone] || TONE_STRATEGIES.growth;
        
        // Professional greeting based on tone
        let greeting = "Good morning";
        if (tone === "growth") {
          greeting = "Hi";
        } else if (tone === "concierge") {
          greeting = "Dear";
        }
        
        // Value Pillar 2: Value Proposition (not "you are eligible", but "I've unlocked for you")
        let valueProp = "";
        if (tone === "growth") {
          valueProp = `I've unlocked ${cleanProductName} for you to help you reach your financial goals faster`;
        } else if (tone === "security") {
          valueProp = `I've prepared ${cleanProductName} for you to give you greater peace of mind and security in managing your finances`;
        } else {
          valueProp = `I've selected ${cleanProductName} for you, an exclusive service aligned with your needs`;
        }
        
        // Value Pillar 3: Call to Action (not "Accept", but "Would you like me to set this up?")
        let cta = "";
        if (clusterLabel && clusterLabel.toLowerCase().includes("high")) {
          cta = "Would you like me to set this up for you by Tuesday?";
        } else {
          cta = "Would you like to discuss this briefly?";
        }
        
        // Build professional message with advisor as hero
        // Include context-aware personalization (Profession, Region)
        const professionContext = personalizedVars.profession 
          ? `Given your work in ${personalizedVars.profession}, `
          : "";
        const regionContext = personalizedVars.region 
          ? `serving the ${personalizedVars.region} community, `
          : "";
        const segmentContext = personalizedVars.segment 
          ? `As a ${personalizedVars.segment} client, `
          : "";
        
        // Include AI reasoning if available
        const aiReasoningText = aiSituation 
          ? `\n\nBased on our analysis: ${aiSituation}`
          : "";
        
        const keyBenefitsText = aiKeyBenefits.length > 0
          ? `\n\nKey benefits:\n${aiKeyBenefits.slice(0, 3).map(b => `• ${b}`).join('\n')}`
          : "";
        
        // Context-aware message with profession and region
        const contextIntro = professionContext || regionContext || segmentContext || "";
        
        explanation = `${greeting} ${personalizedVars.name || cleanCustomerName},

${contextIntro}I was reviewing your portfolio and noticed that ${valueProp.toLowerCase()}.${aiReasoningText}${keyBenefitsText}

${cta}

Best regards,
WellBank Team`;
      } else {
        // Fallback: Professional message with Value Pillars
        explanation = `Good morning ${cleanCustomerName},

I was reviewing your portfolio and thought that ${cleanProductName} could simplify your financial management. I've prepared a personalized proposal for you.

Would you like to discuss this briefly?

Best regards,
WellBank Team`;
      }
      
      // Determine AI insights based on tone strategy and customer data
      const toneStrategy = TONE_STRATEGIES[tone] || TONE_STRATEGIES.growth;
      const currentProductDisplayName = formatProductName(effectiveProductName || effectiveProductCode || productName || productCode);
      const insights = {
        toneReason: `Selected "${toneStrategy.name}" tone because: ${toneStrategy.description}`,
        customerFit: clusterLabel 
          ? `Customer belongs to "${clusterLabel}" segment, indicating ${clusterLabel.toLowerCase().includes("high") ? "premium" : "standard"} service expectations`
          : "Customer profile suggests personalized approach",
        productMatch: currentProductDisplayName 
          ? `${currentProductDisplayName} aligns with ${toneStrategy.suitableFor.join(", ")} category preferences`
          : "Product category matches tone strategy",
        strategy: relevantExample?.category 
          ? `Using ${relevantExample.category} reasoning pattern from examples`
          : "Using general financial advisory best practices",
      };
      setAiInsights(insights);
      
      // Apply streaming effect if enabled
      if (useStreaming && isStreaming) {
        setStreamedText("");
        setDraft("");
        // Simulate streaming by adding text character by character
        for (let i = 0; i <= explanation.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms per character
          const partialText = explanation.slice(0, i);
          setStreamedText(partialText);
          setDraft(partialText);
          checkCompliance(partialText);
        }
        setIsStreaming(false);
      } else {
        setDraft(explanation);
      }
      setOriginalDraft(explanation); // Store original for comparison
      checkCompliance(explanation);
    } catch (err) {
      console.error("Failed to generate explanation:", err);
      // Safe fallback
      const fallbackExplanation = `${personalizedVars.name || customerName || "This customer"} is recommended for ${productName || productCode || "this service"} based on their financial profile and behavioral patterns.`;
      setDraft(fallbackExplanation);
      checkCompliance(fallbackExplanation);
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  }

  // Get product type for compliance disclaimers
  const getProductType = () => {
    const productLower = (productName || productCode || "").toLowerCase();
    if (productLower.includes("loan") || productLower.includes("credit") || productLower.includes("mortgage")) {
      return "loan";
    } else if (productLower.includes("investment") || productLower.includes("portfolio") || productLower.includes("fund")) {
      return "investment";
    } else if (productLower.includes("insurance")) {
      return "insurance";
    }
    return "general";
  };

  // Get appropriate disclaimer text based on product type
  const getDisclaimerText = (productType) => {
    switch (productType) {
      case "loan":
        return "\n\nPlease note: Terms and conditions apply. Annual Percentage Rate (APR) and repayment terms are subject to credit approval. Please review the loan agreement carefully before accepting.";
      case "investment":
        return "\n\nPlease note: Investments carry risk and the value of your investment may go down as well as up. Past performance is not indicative of future results. Please review the product documentation and risk assessment before proceeding.";
      case "insurance":
        return "\n\nPlease note: Terms and conditions apply. Coverage is subject to policy terms and exclusions. Please review the policy documentation carefully before accepting.";
      default:
        return "\n\nPlease note: Terms and conditions apply. Please review the product documentation carefully before proceeding.";
    }
  };

  // Insert disclaimer into message
  const insertDisclaimer = () => {
    const productType = getProductType();
    const disclaimerText = getDisclaimerText(productType);
    const newDraft = draft + disclaimerText;
    setDraft(newDraft);
    checkCompliance(newDraft);
  };

  // Enhanced compliance check with prohibited words detection
  function checkCompliance(text) {
    const textLower = text.toLowerCase();
    
    // Prohibited words/phrases for banking compliance
    const prohibitedWords = [
      "guaranteed returns",
      "guaranteed profit",
      "risk-free",
      "no risk",
      "100% safe",
      "guaranteed income",
      "sure thing",
      "cannot lose",
    ];
    
    // Check for prohibited words
    const foundProhibited = prohibitedWords.filter(word => textLower.includes(word));
    
    // Check for disclaimers
    const hasDisclaimer = textLower.includes("terms") || 
                         textLower.includes("conditions") ||
                         textLower.includes("subject to") ||
                         textLower.includes("please review") ||
                         textLower.includes("apr") ||
                         textLower.includes("annual percentage rate");
    
    // Warnings
    const warnings = [];
    if (!hasDisclaimer) {
      warnings.push("Consider adding legal disclaimers");
    }
    if (text.length < 50) {
      warnings.push("Message may be too brief");
    }
    
    if (foundProhibited.length > 0) {
      setComplianceStatus({
        passed: false,
        message: `Compliance violation: Prohibited words detected`,
        warnings: warnings,
        prohibitedWords: foundProhibited,
        needsDisclaimer: !hasDisclaimer,
        productType: getProductType(),
      });
    } else if (!hasDisclaimer) {
      setComplianceStatus({
        passed: true,
        message: "AI Draft: Please ensure this aligns with the customer's latest risk profile",
        warnings: warnings,
        prohibitedWords: [],
        needsDisclaimer: true,
        productType: getProductType(),
      });
    } else {
      setComplianceStatus({
        passed: true,
        message: "Compliance check passed - includes required disclaimers",
        warnings: warnings,
        prohibitedWords: [],
        needsDisclaimer: false,
        productType: getProductType(),
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

  // Apply tone preset - instantly regenerate message
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
    
    // Instantly regenerate message with new tone
    if (draft || (customerName || customerId) && (productName || productCode)) {
      generateDraft(true); // Use streaming for instant feedback
    }
  }

  // Reset to system examples
  function handleResetToSystem() {
    setExamples(systemExamples);
  }

  // Initialize selected product from props
  useEffect(() => {
    if (customerRecommendations.length > 0) {
      // Find the product that matches current productCode, or select the first one
      const matchingProduct = customerRecommendations.find(r => r.product_code === productCode) || customerRecommendations[0];
      if (matchingProduct) {
        setSelectedProductId(matchingProduct.id);
        setCurrentProductData({
          acceptance_probability: matchingProduct.acceptance_probability,
          expected_revenue: matchingProduct.expected_revenue,
          product_code: matchingProduct.product_code,
          product_name: matchingProduct.product_name,
          narrative: matchingProduct.narrative,
        });
      }
    } else if (productCode) {
      // Fallback to props if no recommendations array
      setCurrentProductData({
        acceptance_probability: null,
        expected_revenue: null,
        product_code: productCode,
        product_name: productName,
        narrative: null,
      });
    }
  }, [customerRecommendations, productCode, productName]);

  // Handle product switching
  const handleProductSelect = async (recommendation) => {
    setIsSwitchingProduct(true);
    setSelectedProductId(recommendation.id);
    setCurrentProductData({
      acceptance_probability: recommendation.acceptance_probability,
      expected_revenue: recommendation.expected_revenue,
      product_code: recommendation.product_code,
      product_name: recommendation.product_name,
      narrative: recommendation.narrative,
    });
    
    // Call callback if provided
    if (onProductChange) {
      onProductChange(recommendation);
    }
    
    // Regenerate message with new product (after a brief delay to show loading)
    setTimeout(async () => {
      try {
        // Update the product context and regenerate
        await generateDraft(true); // Use streaming
      } catch (err) {
        console.error("Error regenerating message for new product:", err);
      } finally {
        setIsSwitchingProduct(false);
      }
    }, 500); // 500ms delay to show loading skeleton
  };

  // Initialize draft on mount or when dependencies change
  useEffect(() => {
    // Only generate if we have at least customer name or product info
    const effectiveProductCode = currentProductData?.product_code || productCode;
    if ((customerName || customerId) && effectiveProductCode) {
      // Use setTimeout to avoid calling during render
      const timer = setTimeout(() => {
        try {
          generateDraft(true); // Use streaming for initial generation
        } catch (err) {
          console.error("Error in generateDraft from useEffect:", err);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerName, customerId, currentProductData?.product_code, productCode]); // Use currentProductData.product_code instead of productCode

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
      situation: aiReasoning?.short_reasoning 
        ? `Customer ${customerName || customerId} - ${productName || productCode}. ${aiReasoning.short_reasoning}`
        : `Customer ${customerName || customerId} - ${productName || productCode}`,
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
        marginBottom: "16px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <Sparkles size={18} color="#22D3EE" />
          <h4 style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#E2E8F0",
            margin: 0,
          }}>
            Strategic Advisor Assistant
          </h4>
        </div>
        <button
          onClick={() => setShowAILab(!showAILab)}
          style={{
            padding: "6px 12px",
            background: "rgba(34, 211, 238, 0.1)",
            border: "1px solid rgba(34, 211, 238, 0.3)",
            borderRadius: "8px",
            color: "#22D3EE",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 500,
          }}
        >
          {showAILab ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAILab ? "Hide" : "Show"} Examples
        </button>
      </div>

      {/* Split View Container - AI Sidekick Panel */}
      <div style={{
        display: "flex",
        gap: "20px",
        minHeight: "500px",
      }}>
        {/* LEFT SIDE - AI Insights (Always Visible) */}
        <div style={{
          flex: "0 0 380px",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}>
          <div style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#F8FAFC",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <Lightbulb size={18} color="#4fd8eb" />
            AI Insights
          </div>
          
          {/* Service Tabs Component - Prominent at Top */}
          {customerRecommendations.length > 0 && (
            <div style={{
              marginBottom: "20px",
            }}>
              <div style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(148, 163, 184, 0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Target size={14} />
                Select Service ({customerRecommendations.length} available)
              </div>
              <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}>
                {customerRecommendations.map((rec, index) => {
                  const isSelected = selectedProductId === rec.id;
                  const prob = rec.acceptance_probability || 0;
                  const revenue = rec.expected_revenue || 0;
                  const serviceName = formatProductName(rec.product_name || rec.product_code);
                  
                  return (
                    <button
                      key={rec.id}
                      onClick={() => handleProductSelect(rec)}
                      disabled={isSwitchingProduct}
                      style={{
                        padding: "12px 16px",
                        background: isSelected
                          ? `linear-gradient(135deg, rgba(79, 216, 235, 0.3), rgba(59, 130, 246, 0.2))`
                          : "rgba(255, 255, 255, 0.05)",
                        border: `2px solid ${isSelected 
                          ? "#4fd8eb" 
                          : "rgba(255, 255, 255, 0.1)"}`,
                        borderRadius: "12px",
                        color: isSelected ? "#4fd8eb" : "#94A3B8",
                        fontSize: "13px",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: isSwitchingProduct ? "wait" : "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "6px",
                        minWidth: "160px",
                        position: "relative",
                        boxShadow: isSelected 
                          ? "0 0 24px rgba(79, 216, 235, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)"
                          : "0 2px 4px rgba(0, 0, 0, 0.1)",
                        transform: isSelected ? "translateY(-2px)" : "translateY(0)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isSwitchingProduct) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.4)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      <div style={{ 
                        fontWeight: isSelected ? 700 : 600, 
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                      }}>
                        {serviceName}
                        {isSelected && (
                          <div style={{
                            marginLeft: "auto",
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: "#4fd8eb",
                            boxShadow: "0 0 12px rgba(79, 216, 235, 1)",
                            animation: "pulse 2s ease-in-out infinite",
                          }} />
                        )}
                      </div>
                      <div style={{ 
                        fontSize: "11px", 
                        opacity: 0.9,
                        display: "flex",
                        gap: "10px",
                        width: "100%",
                        alignItems: "center",
                      }}>
                        <span style={{ 
                          color: prob >= 0.7 ? "#10b981" : prob >= 0.5 ? "#f59e0b" : "#ef4444",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                          <span>{(prob * 100).toFixed(0)}%</span>
                          <span style={{ opacity: 0.7 }}>Match</span>
                        </span>
                        <span style={{ 
                          color: "#4fd8eb", 
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                          <span>€{(revenue / 1000).toFixed(1)}K</span>
                          <span style={{ opacity: 0.7, fontSize: "10px" }}>Revenue</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Current Product Stats - Always show when a product is selected */}
          {currentProductData && customerRecommendations.length > 0 && (
            <div style={{
              padding: "12px",
              background: "rgba(79, 216, 235, 0.1)",
              border: "1px solid rgba(79, 216, 235, 0.2)",
              borderRadius: "10px",
              marginBottom: "16px",
            }}>
              <div style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#4fd8eb",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Current Selection: {formatProductName(currentProductData.product_name || currentProductData.product_code)}
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}>
                <div>
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", marginBottom: "4px" }}>
                    Match Score
                  </div>
                  <div style={{ 
                    fontSize: "18px", 
                    fontWeight: 700,
                    color: currentProductData.acceptance_probability >= 0.7 
                      ? "#10b981" 
                      : currentProductData.acceptance_probability >= 0.5 
                      ? "#f59e0b" 
                      : "#ef4444",
                  }}>
                    {(currentProductData.acceptance_probability * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ width: "1px", height: "30px", background: "rgba(255, 255, 255, 0.1)" }} />
                <div>
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", marginBottom: "4px" }}>
                    Estimated Revenue
                  </div>
                  <div style={{ 
                    fontSize: "18px", 
                    fontWeight: 700,
                    color: "#4fd8eb",
                  }}>
                    €{(currentProductData.expected_revenue / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Smart Tone Toggles */}
          <div>
            <div style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(148, 163, 184, 0.8)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "12px",
            }}>
              Strategic Tone
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}>
              {Object.entries(TONE_STRATEGIES).map(([key, strategy]) => {
                const Icon = strategy.icon;
                const isActive = tone === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      handleToneChange(key);
                    }}
                    style={{
                      padding: "12px 16px",
                      background: isActive
                        ? `linear-gradient(135deg, ${strategy.color}20, ${strategy.color}10)`
                        : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${isActive ? strategy.color + "40" : "rgba(255, 255, 255, 0.1)"}`,
                      borderRadius: "12px",
                      color: isActive ? strategy.color : "#94A3B8",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.3s",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                      }
                    }}
                  >
                    {/* Icon Container - Circle with Neon Glow Effect */}
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: isActive
                        ? `rgba(${strategy.color === "#34d399" ? "52, 211, 153" : strategy.color === "#60a5fa" ? "96, 165, 250" : "251, 191, 36"}, 0.1)`
                        : "rgba(255, 255, 255, 0.05)",
                      border: `2px solid ${isActive ? strategy.color + "40" : "rgba(255, 255, 255, 0.1)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                      boxShadow: isActive
                        ? `0 0 16px ${strategy.color}40, inset 0 0 8px ${strategy.color}20`
                        : "none",
                      animation: isActive ? "pulse 2s ease-in-out infinite" : "none",
                    }}>
                      <Icon 
                        size={20} 
                        style={{ 
                          color: isActive ? strategy.color : "#94A3B8",
                          filter: isActive ? `drop-shadow(0 0 6px ${strategy.color}80)` : "none",
                        }} 
                      />
                      {/* Pulse ring effect when active */}
                      {isActive && (
                        <div style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          border: `2px solid ${strategy.color}`,
                          opacity: 0.3,
                          animation: "pulse-ring 2s ease-in-out infinite",
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: "2px" }}>
                        {strategy.name}
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.7 }}>
                        {strategy.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Insights Display */}
          {aiInsights && (
            <div style={{
              background: "rgba(79, 216, 235, 0.1)",
              border: "1px solid rgba(79, 216, 235, 0.2)",
              borderRadius: "12px",
              padding: "16px",
              marginTop: "8px",
            }}>
              <div style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#4fd8eb",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <Info size={14} />
                Why This Tone?
              </div>
              <div style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.8)",
                lineHeight: "1.6",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                <div>
                  <strong style={{ color: "#4fd8eb" }}>Tone:</strong> {aiInsights.toneReason}
                </div>
                <div>
                  <strong style={{ color: "#4fd8eb" }}>Customer Fit:</strong> {aiInsights.customerFit}
                </div>
                <div>
                  <strong style={{ color: "#4fd8eb" }}>Product Match:</strong> {aiInsights.productMatch}
                </div>
                <div>
                  <strong style={{ color: "#4fd8eb" }}>Strategy:</strong> {aiInsights.strategy}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Status - Enhanced */}
          {complianceStatus.message && (
            <div style={{
              background: complianceStatus.passed
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${complianceStatus.passed ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: "12px",
              padding: "16px",
              marginTop: "8px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}>
                {complianceStatus.passed ? (
                  <Shield size={18} color="#10b981" style={{ filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))" }} />
                ) : (
                  <AlertCircle size={18} color="#ef4444" />
                )}
                <div style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: complianceStatus.passed ? "#10b981" : "#ef4444",
                }}>
                  {complianceStatus.passed ? "Compliance Check Passed" : "Compliance Warning"}
                </div>
              </div>
              <div style={{
                fontSize: "12px",
                color: complianceStatus.passed ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
                lineHeight: "1.5",
                marginBottom: complianceStatus.prohibitedWords?.length > 0 ? "8px" : "0",
              }}>
                {complianceStatus.message}
              </div>
              {complianceStatus.prohibitedWords?.length > 0 && (
                <div style={{
                  marginTop: "8px",
                  padding: "8px",
                  background: "rgba(239, 68, 68, 0.2)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F87171",
                }}>
                  <strong>Prohibited words found:</strong> {complianceStatus.prohibitedWords.join(", ")}
                </div>
              )}
              {complianceStatus.warnings?.length > 0 && (
                <div style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "rgba(255, 255, 255, 0.7)",
                }}>
                  {complianceStatus.warnings.map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}
              {/* Proactive Compliance Disclaimer Button */}
              {complianceStatus.needsDisclaimer && (
                <button
                  onClick={insertDisclaimer}
                  style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
                  }}
                >
                  <FileText size={14} />
                  {complianceStatus.productType === "loan" 
                    ? "Insert APR & Terms Disclaimer"
                    : complianceStatus.productType === "investment"
                    ? "Insert Investment Risk Disclaimer"
                    : "Insert Legal Disclaimers"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Message Editor */}
        <div style={{
          flex: "1",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}>
            <div style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <MessageSquare size={18} color="#4fd8eb" />
              Message Editor
            </div>
            <button
              onClick={generateDraft}
              disabled={isGenerating}
              style={{
                padding: "8px 16px",
                background: "rgba(79, 216, 235, 0.15)",
                border: "1px solid rgba(79, 216, 235, 0.3)",
                borderRadius: "10px",
                color: "#4fd8eb",
                fontSize: "12px",
                fontWeight: 600,
                cursor: isGenerating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: isGenerating ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.background = "rgba(79, 216, 235, 0.25)";
                  e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.background = "rgba(79, 216, 235, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.3)";
                }
              }}
            >
              <RefreshCw size={14} style={{
                animation: isGenerating ? "spin 1s linear infinite" : "none",
              }} />
              Regenerate
            </button>
          </div>

          {/* Personalized Variables - Data Chips with Live Editing */}
          <div style={{
            padding: "12px 16px",
            background: "rgba(79, 216, 235, 0.1)",
            border: "1px solid rgba(79, 216, 235, 0.2)",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#4fd8eb",
          }}>
            <div style={{ marginBottom: "8px", fontWeight: 600 }}>
              <strong>Personalized Variables:</strong>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {/* Name Chip - Editable */}
              <div style={{
                padding: "6px 10px",
                background: "rgba(79, 216, 235, 0.2)",
                borderRadius: "8px",
                border: "1px solid rgba(79, 216, 235, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>Name:</span>
                <input
                  type="text"
                  value={personalizedVars.name || cleanCustomerName}
                  onChange={(e) => {
                    const newVars = { ...personalizedVars, name: e.target.value };
                    setPersonalizedVars(newVars);
                    // Update draft with new name
                    const oldName = personalizedVars.name || cleanCustomerName;
                    const updatedDraft = draft.replace(new RegExp(oldName, 'g'), e.target.value);
                    setDraft(updatedDraft);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#4fd8eb",
                    fontWeight: 600,
                    fontSize: "12px",
                    minWidth: "100px",
                    outline: "none",
                  }}
                />
              </div>
              
              {/* Profession Chip */}
              {personalizedVars.profession && (
                <div style={{
                  padding: "6px 10px",
                  background: "rgba(16, 185, 129, 0.2)",
                  borderRadius: "8px",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span style={{ fontSize: "11px", opacity: 0.8 }}>Profession:</span>
                  <strong style={{ color: "#10b981" }}>{personalizedVars.profession}</strong>
                </div>
              )}
              
              {/* Segment Chip */}
              {personalizedVars.segment && (
                <div style={{
                  padding: "6px 10px",
                  background: "rgba(139, 92, 246, 0.2)",
                  borderRadius: "8px",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span style={{ fontSize: "11px", opacity: 0.8 }}>Segment:</span>
                  <strong style={{ color: "#8b5cf6" }}>{personalizedVars.segment}</strong>
                </div>
              )}
              
              {/* Region Chip */}
              {personalizedVars.region && (
                <div style={{
                  padding: "6px 10px",
                  background: "rgba(245, 158, 11, 0.2)",
                  borderRadius: "8px",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span style={{ fontSize: "11px", opacity: 0.8 }}>Region:</span>
                  <strong style={{ color: "#f59e0b" }}>{personalizedVars.region}</strong>
                </div>
              )}
              
              {/* Product Chip */}
              <div style={{
                padding: "6px 10px",
                background: "rgba(79, 216, 235, 0.2)",
                borderRadius: "8px",
                border: "1px solid rgba(79, 216, 235, 0.3)",
              }}>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>Product:</span>
                <strong style={{ color: "#4fd8eb", marginLeft: "6px" }}>{cleanProductName}</strong>
              </div>
            </div>
          </div>

          {/* Draft Preview - Live Preview of glassmorphic card customer will see */}
          <div style={{ position: "relative" }}>
            {/* Live Preview Label */}
            {draft && !isSwitchingProduct && (
              <div style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "rgba(148, 163, 184, 0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <Sparkles size={12} />
                Message Preview
              </div>
            )}
            
            {/* Loading Skeleton when switching products */}
            {isSwitchingProduct && (
              <div style={{
                padding: "16px",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", color: "#4fd8eb" }} />
                  <span style={{ fontSize: "12px", color: "#4fd8eb", fontWeight: 600 }}>
                    Regenerating message for {formatProductName(currentProductData?.product_name || currentProductData?.product_code || "")}...
                  </span>
                </div>
                <div style={{
                  background: "rgba(79, 216, 235, 0.1)",
                  borderRadius: "8px",
                  padding: "12px",
                  animation: "pulse 2s ease-in-out infinite",
                }}>
                  <div style={{ height: "12px", background: "rgba(79, 216, 235, 0.3)", borderRadius: "4px", marginBottom: "8px", width: "80%" }} />
                  <div style={{ height: "12px", background: "rgba(79, 216, 235, 0.3)", borderRadius: "4px", marginBottom: "8px", width: "90%" }} />
                  <div style={{ height: "12px", background: "rgba(79, 216, 235, 0.3)", borderRadius: "4px", width: "70%" }} />
                </div>
              </div>
            )}
            
            {/* Glassmorphic Editor - Professional Style */}
            {!isSwitchingProduct && (
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                checkCompliance(e.target.value);
              }}
              placeholder="AI-generated message will appear here. Edit as needed..."
              rows={14}
              style={{
                flex: 1,
                width: "100%",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.05)", // bg-white/5
                backdropFilter: "blur(12px)", // backdrop-blur-md
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.1)", // border-white/10
                borderRadius: "12px",
                color: "#F8FAFC",
                fontSize: "14px",
                lineHeight: "1.7",
                resize: "vertical",
                fontFamily: "'Inter', -apple-system, sans-serif",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 216, 235, 0.1), 0 0 20px rgba(79, 216, 235, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              }}
            />
            )}
            
            {/* Badge di Verifica - High-Trust Indicator */}
            {draft && complianceStatus.passed && (
              <div style={{
                position: "absolute",
                top: draft ? "32px" : "12px",
                right: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                background: "rgba(16, 185, 129, 0.2)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "#10b981",
                pointerEvents: "none",
                zIndex: 10,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
              }}>
                <Shield size={12} style={{ filter: "drop-shadow(0 0 2px rgba(16, 185, 129, 0.5))" }} />
                <span style={{ fontWeight: 600 }}>Tone Verified</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px",
          }}>
            <button
              onClick={() => {
                if (onSave) onSave(draft, examples, saveAsDefault);
              }}
              style={{
                flex: 1,
                padding: "12px 20px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "#E2E8F0",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <Save size={16} />
              Save Draft
            </button>
            <button
              onClick={handleSend}
              disabled={!complianceStatus.passed || !draft.trim()}
              style={{
                flex: 2,
                padding: "12px 20px",
                background: complianceStatus.passed && draft.trim()
                  ? "linear-gradient(135deg, #4fd8eb 0%, #3b82f6 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                boxShadow: complianceStatus.passed && draft.trim()
                  ? "0 4px 20px rgba(79, 216, 235, 0.4)"
                  : "none",
                border: "none",
                borderRadius: "12px",
                color: complianceStatus.passed && draft.trim() ? "#0B0E14" : "#94A3B8",
                fontSize: "14px",
                fontWeight: 700,
                cursor: complianceStatus.passed && draft.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: complianceStatus.passed && draft.trim() ? 1 : 0.5,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (complianceStatus.passed && draft.trim()) {
                  e.currentTarget.style.boxShadow = "0 6px 30px rgba(79, 216, 235, 0.6)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (complianceStatus.passed && draft.trim()) {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(79, 216, 235, 0.4)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <Send size={16} />
              Send Message
            </button>
          </div>
        </div>

        {/* AI Lab (Examples) - Collapsible */}
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
      </div>
    </div>
  );
}

