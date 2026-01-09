import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  Target,
  Lightbulb,
  Eye,
  Phone,
  Mail,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Send,
  ThumbsDown,
  TrendingDown,
  BarChart3,
  MessageSquare,
  FileText,
  Zap,
  CreditCard,
  Wallet,
  PiggyBank,
  Briefcase,
  Home,
  Package,
  MapPin,
  Shield,
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";
import AIMessageComposer from "./AIMessageComposer";
import ErrorBoundary from "./ErrorBoundary";
import { getBatchRuns, getClusterRecommendations } from "../api/clusters";
import { getRecommendationById, getAdvisorStrategy, getServicesByCategory } from "../api/offers";
import "./LoginPage.css";
import "./EmployeeDashboard.css";

// Cluster Personas - Matching ClusterResultsPage
const CLUSTER_PERSONAS = {
  0: { 
    name: "Silver Savers", 
    subtitle: "High Balance, Low Activity",
    color: "#3b82f6", 
    icon: Users, 
    description: "High savings focus, conservative spending patterns",
    idealProducts: ["Wealth Management", "Premium Savings", "Investment Portfolios"],
  },
  1: { 
    name: "Digital Nomads", 
    subtitle: "High Tech, Global Transactions",
    color: "#8b5cf6", 
    icon: Users, 
    description: "Frequent digital transactions, international activity",
    idealProducts: ["Premium Debit", "International Cards", "Digital Banking"],
  },
  2: { 
    name: "The Foundation", 
    subtitle: "Young Professionals Building Wealth",
    color: "#10b981", 
    icon: Users, 
    description: "Steady income, growing savings, building financial foundation",
    idealProducts: ["Personal Loans", "Savings Plans", "Credit Building"],
  },
  3: { 
    name: "Family Anchors", 
    subtitle: "Stable Income, Home-Focused",
    color: "#f59e0b", 
    icon: Users, 
    description: "Family-oriented spending, home-related financial needs",
    idealProducts: ["Mortgages", "Home Insurance", "Family Plans"],
  },
  4: { 
    name: "Portfolio Builders", 
    subtitle: "Investment-Focused, Diversified",
    color: "#ec4899", 
    icon: Users, 
    description: "Diverse portfolio, investment-oriented, high-value customers",
    idealProducts: ["Investment Funds", "Premium Services", "Wealth Advisory"],
  },
  5: { 
    name: "Essential Users", 
    subtitle: "Basic Banking Needs",
    color: "#64748b", 
    icon: Users, 
    description: "Standard banking services, minimal product usage",
    idealProducts: ["Basic Checking", "Standard Accounts", "Essential Services"],
  },
};

// Radar Chart Component for Product Fit
function ProductFitRadar({ customerData, idealData, size = 200 }) {
  const center = size / 2;
  const radius = size * 0.35;
  const categories = ["Savings", "Investments", "Credit", "Insurance", "Digital"];
  const maxValue = 100;
  
  const points = categories.map((cat, index) => {
    const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
    const customerValue = customerData[cat] || 0;
    const idealValue = idealData[cat] || 0;
    const customerDistance = (customerValue / maxValue) * radius;
    const idealDistance = (idealValue / maxValue) * radius;
    
    return {
      customerX: center + customerDistance * Math.cos(angle),
      customerY: center + customerDistance * Math.sin(angle),
      idealX: center + idealDistance * Math.cos(angle),
      idealY: center + idealDistance * Math.sin(angle),
      label: cat,
      customerValue,
      idealValue,
      angle,
    };
  });

  const customerPath = points.map(p => `${p.customerX},${p.customerY}`).join(' ');
  const idealPath = points.map(p => `${p.idealX},${p.idealY}`).join(' ');

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius * scale}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
      ))}
      
      {/* Axes lines */}
      {categories.map((_, index) => {
        const angle = (index * 2 * Math.PI) / categories.length - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
        );
      })}

      {/* Ideal portfolio (dashed) */}
      <polygon
        points={idealPath}
        fill="rgba(16, 185, 129, 0.1)"
        stroke="#10b981"
        strokeWidth="2"
        strokeDasharray="4,4"
      />

      {/* Customer portfolio (solid) */}
      <polygon
        points={customerPath}
        fill="rgba(79, 216, 235, 0.2)"
        stroke="#4fd8eb"
        strokeWidth="2"
      />

      {/* Data points and labels */}
      {points.map((point, index) => {
        const labelRadius = radius + 25;
        const labelX = center + labelRadius * Math.cos(point.angle);
        const labelY = center + labelRadius * Math.sin(point.angle);
        
        return (
          <g key={index}>
            <circle cx={point.customerX} cy={point.customerY} r="4" fill="#4fd8eb" />
            <circle cx={point.idealX} cy={point.idealY} r="4" fill="#10b981" />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="10"
              fontWeight="600"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Probability Gauge Component
function ProbabilityGauge({ value, size = 80 }) {
  const percentage = Math.round(value * 100);
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const offset = circumference - (percentage / 100) * circumference;
  
  let color = "#10b981"; // Green
  if (percentage < 50) color = "#f59e0b"; // Yellow
  if (percentage < 30) color = "#ef4444"; // Red

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "white" }}>
          {percentage}%
        </div>
        <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.6)" }}>
          Match
        </div>
      </div>
    </div>
  );
}

// Skeleton Loading Component
function SkeletonCard() {
  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "16px",
      padding: "20px",
      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{
          width: "100px",
          height: "24px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
        }} />
        <div style={{
          width: "60px",
          height: "60px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50%",
        }} />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <div style={{
          width: "60%",
          height: "20px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          marginBottom: "8px",
        }} />
        <div style={{
          width: "40%",
          height: "16px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
        }} />
      </div>
      <div style={{
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "16px",
      }}>
        <div style={{
          width: "80%",
          height: "16px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
          marginBottom: "8px",
        }} />
        <div style={{
          width: "100%",
          height: "12px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4px",
        }} />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1, height: "36px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "8px" }} />
        <div style={{ flex: 1, height: "36px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "8px" }} />
        <div style={{ flex: 1, height: "36px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "8px" }} />
      </div>
    </div>
  );
}

export default function ServiceSuggestionsPage({ onNavigate, onBack }) {
  // Load pagination state from localStorage
  const getStoredPagination = () => {
    try {
      const stored = localStorage.getItem('serviceSuggestions_pagination');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          page: parsed.page || 1,
          pageSize: parsed.pageSize || 20,
        };
      }
    } catch (e) {
      console.error('Failed to load pagination state:', e);
    }
    return { page: 1, pageSize: 20 };
  };

  const storedPagination = getStoredPagination();
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runs, setRuns] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [pagination, setPagination] = useState({
    page: storedPagination.page,
    pageSize: storedPagination.pageSize,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [minPropensity, setMinPropensity] = useState(0);
  const [sortBy, setSortBy] = useState("revenue"); // revenue, probability, name
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set()); // For bulk actions
  const [advisorStrategy, setAdvisorStrategy] = useState(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);
  const [servicesByCategory, setServicesByCategory] = useState(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("Cards");
  const [manuallySelectedService, setManuallySelectedService] = useState(null); // Service selected by advisor

  // Save pagination state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('serviceSuggestions_pagination', JSON.stringify({
        page: pagination.page,
        pageSize: pagination.pageSize,
      }));
    } catch (e) {
      console.error('Failed to save pagination state:', e);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      loadRecommendations(selectedRunId, pagination.page, pagination.pageSize);
    }
  }, [selectedRunId, pagination.page, pagination.pageSize]);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerDetail(selectedCustomer);
    }
  }, [selectedCustomer]);

  async function loadRuns() {
    try {
      setError("");
      const data = await getBatchRuns();
      setRuns(data.runs || []);
      if (data.runs && data.runs.length > 0 && !selectedRunId) {
        setSelectedRunId(data.runs[0].run_id);
      }
    } catch (err) {
      setError(`Failed to load runs: ${err.message}`);
    }
  }

  async function loadRecommendations(runId, page, pageSize) {
    try {
      setIsLoading(true);
      setError("");
      const data = await getClusterRecommendations(runId, page, pageSize);
      setRecommendations(data.recommendations || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.total_pages || 1,
        page: data.page || page,
      }));
    } catch (err) {
      setError(`Failed to load recommendations: ${err.message}`);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCustomerDetail(customerId) {
    if (!customerId) return;
    try {
      setIsDetailLoading(true);
      setError(""); // Clear any previous errors
      
      // Load services by category
      try {
        const servicesData = await getServicesByCategory();
        console.log("Services by category loaded:", servicesData);
        if (servicesData && servicesData.services_by_category) {
          setServicesByCategory(servicesData);
          // Set default category if not set
          if (!selectedServiceCategory && Object.keys(servicesData.services_by_category).length > 0) {
            setSelectedServiceCategory(Object.keys(servicesData.services_by_category)[0]);
          }
        } else {
          console.warn("Services data structure invalid:", servicesData);
        }
      } catch (err) {
        console.error("Failed to load services by category:", err);
        setServicesByCategory(null);
      }
      
      // Load AI Strategy Package (Intelligence + Reasoning layers)
      setIsLoadingStrategy(true);
      try {
        const strategy = await getAdvisorStrategy(customerId);
        setAdvisorStrategy(strategy);
      } catch (err) {
        console.warn("Failed to load advisor strategy:", err);
        setAdvisorStrategy(null);
      } finally {
        setIsLoadingStrategy(false);
      }
      
      // Find the top recommendation for this customer
      const customerRecs = recommendations.filter(r => r.customer_id === customerId);
      if (customerRecs.length > 0) {
        const topRec = customerRecs.sort((a, b) => (b.expected_revenue || 0) - (a.expected_revenue || 0))[0];
        
        // Try to get full detail from API if recommendation ID exists
        if (topRec.id) {
          try {
            const detail = await getRecommendationById(topRec.id);
            
            // Enhance explanation with AI reasoning if available and explanation is missing
            if ((!detail.ai_explanation?.narrative || detail.ai_explanation.narrative === "No explanation available") 
                && advisorStrategy && advisorStrategy.recommendations && advisorStrategy.recommendations.length > 0) {
              const topAIRecommendation = advisorStrategy.recommendations[0];
              if (topAIRecommendation.detailed_reasoning) {
                detail.ai_explanation = {
                  ...detail.ai_explanation,
                  narrative: topAIRecommendation.detailed_reasoning,
                  bullets: topAIRecommendation.key_benefits?.map(b => `• ${b}`) || detail.ai_explanation?.bullets,
                };
              } else if (topAIRecommendation.short_reasoning) {
                detail.ai_explanation = {
                  ...detail.ai_explanation,
                  narrative: topAIRecommendation.short_reasoning,
                  bullets: topAIRecommendation.key_benefits?.map(b => `• ${b}`) || detail.ai_explanation?.bullets,
                };
              }
            }
            
            setCustomerDetail(detail);
            return; // Success, exit early
          } catch (err) {
            console.warn("Failed to load full detail from API, using fallback:", err);
            // Continue to fallback below
          }
        }
        
        // Fallback: Use basic data from recommendation
        // Generate AI explanation from advisor strategy if available
        let explanationNarrative = topRec.narrative;
        let explanationBullets = [];
        
        if (!explanationNarrative && advisorStrategy && advisorStrategy.recommendations && advisorStrategy.recommendations.length > 0) {
          // Use AI reasoning from top recommendation
          const topAIRecommendation = advisorStrategy.recommendations[0];
          if (topAIRecommendation.detailed_reasoning) {
            explanationNarrative = topAIRecommendation.detailed_reasoning;
          } else if (topAIRecommendation.short_reasoning) {
            explanationNarrative = topAIRecommendation.short_reasoning;
          }
          
          // Create bullets from key benefits
          if (topAIRecommendation.key_benefits && topAIRecommendation.key_benefits.length > 0) {
            explanationBullets = topAIRecommendation.key_benefits.map(benefit => `• ${benefit}`);
          }
        }
        
        // If still no explanation, create one from available data
        if (!explanationNarrative || explanationNarrative === "No explanation available") {
          const productName = advisorStrategy?.recommendations?.[0]?.product_name || topRec.product_code;
          const fitnessScore = advisorStrategy?.recommendations?.[0]?.fitness_score;
          const clusterInfo = advisorStrategy?.profile_summary?.cluster_interpretation || "";
          
          explanationNarrative = `Based on your financial profile and transaction patterns, ${productName} is recommended`;
          if (fitnessScore) {
            explanationNarrative += ` with a ${fitnessScore}% fitness score`;
          }
          explanationNarrative += `. `;
          
          if (clusterInfo) {
            explanationNarrative += clusterInfo + " ";
          }
          
          if (advisorStrategy?.recommendations?.[0]?.key_benefits?.length > 0) {
            explanationNarrative += `This product offers: ${advisorStrategy.recommendations[0].key_benefits.slice(0, 2).join(', ')}.`;
          }
        }
        
        setCustomerDetail({
          customer_snapshot: {
            customer_id: customerId,
            customer_name: topRec.customer_name || customerId,
            cluster_label: topRec.cluster_label || null,
          },
          recommended_service: {
            product_code: topRec.product_code,
            acceptance_probability: topRec.acceptance_probability,
            expected_revenue: topRec.expected_revenue,
            id: topRec.id || null,
          },
          ai_explanation: {
            narrative: explanationNarrative || "AI-powered recommendation based on customer profile analysis.",
            bullets: explanationBullets.length > 0 ? explanationBullets : undefined,
          },
        });
      } else {
        // No recommendations found for this customer
        setCustomerDetail({
          customer_snapshot: {
            customer_id: customerId,
            customer_name: customerId,
          },
          recommended_service: null,
          ai_explanation: {
            narrative: "No recommendations available for this customer.",
          },
        });
      }
    } catch (err) {
      console.error("Failed to load customer detail:", err);
      setError(`Failed to load customer details: ${err.message}`);
      // Set minimal detail so panel still shows
      setCustomerDetail({
        customer_snapshot: {
          customer_id: customerId,
          customer_name: customerId,
        },
        recommended_service: null,
        ai_explanation: {
          narrative: "Error loading customer details. Please try again.",
        },
      });
    } finally {
      setIsDetailLoading(false);
    }
  }
  
  async function reanalyzeCustomer(customerId) {
    if (!customerId) return;
    setIsLoadingStrategy(true);
    try {
      const strategy = await getAdvisorStrategy(customerId);
      setAdvisorStrategy(strategy);
    } catch (err) {
      setError(`Failed to re-analyze: ${err.message}`);
    } finally {
      setIsLoadingStrategy(false);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  function formatPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  function formatDate(dateString) {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Group recommendations by customer and get top recommendation per customer
  // Note: Since we're paginating, we work with the current page's recommendations
  const customerOpportunities = useMemo(() => {
    const customerMap = {};
    
    recommendations.forEach(rec => {
      if (!rec || !rec.customer_id) return;
      
      const customerId = rec.customer_id;
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          customer_id: customerId,
          customer_name: rec.customer_name || customerId,
          cluster_id: rec.cluster_id,
          annual_income: rec.customer_income || 0,
          profession: rec.customer_profession || "N/A",
          topRecommendation: null,
          allRecommendations: [],
          totalRevenue: 0,
          maxProbability: 0,
        };
      }
      
      customerMap[customerId].allRecommendations.push(rec);
      customerMap[customerId].totalRevenue += rec.expected_revenue || 0;
      customerMap[customerId].maxProbability = Math.max(
        customerMap[customerId].maxProbability,
        rec.acceptance_probability || 0
      );
    });

    // Set top recommendation for each customer
    Object.values(customerMap).forEach(customer => {
      if (customer.allRecommendations.length > 0) {
        customer.topRecommendation = customer.allRecommendations.sort(
          (a, b) => (b.expected_revenue || 0) - (a.expected_revenue || 0)
        )[0];
      }
    });

    return Object.values(customerMap);
  }, [recommendations]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      setSelectedCustomers(new Set()); // Clear selections on page change
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newPageSize,
      page: 1, // Reset to first page when changing page size
    }));
    setSelectedCustomers(new Set());
  };

  // Handle jump to page
  const handleJumpToPage = (e) => {
    e.preventDefault();
    const pageInput = e.target.elements.jumpPage;
    const pageNum = parseInt(pageInput.value);
    if (pageNum >= 1 && pageNum <= pagination.totalPages) {
      handlePageChange(pageNum);
      pageInput.value = '';
    }
  };

  // Toggle customer selection
  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  // Select all on current page
  const selectAllOnPage = () => {
    const allIds = new Set(customerOpportunities.map(c => c.customer_id));
    setSelectedCustomers(allIds);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedCustomers(new Set());
  };

  // Note: Filtering is now done on the backend via pagination
  // We only do client-side filtering for the current page if needed
  // For now, we'll show all customers from the current page
  const filteredOpportunities = useMemo(() => {
    let filtered = customerOpportunities.filter(customer => {
      // Search filter (client-side for current page)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          customer.customer_name?.toLowerCase().includes(query) ||
          customer.customer_id?.toLowerCase().includes(query) ||
          customer.profession?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Cluster filter (client-side for current page)
      if (selectedCluster !== null && customer.cluster_id !== selectedCluster) {
        return false;
      }

      // Product filter (client-side for current page)
      if (selectedProduct && customer.topRecommendation?.product_code !== selectedProduct) {
        return false;
      }

      // Propensity filter (client-side for current page)
      if (customer.maxProbability < minPropensity / 100) {
        return false;
      }

      return true;
    });

    // Sort (client-side for current page)
    filtered.sort((a, b) => {
      if (sortBy === "revenue") {
        return b.totalRevenue - a.totalRevenue;
      } else if (sortBy === "probability") {
        return b.maxProbability - a.maxProbability;
      } else if (sortBy === "name") {
        return (a.customer_name || a.customer_id).localeCompare(b.customer_name || b.customer_id);
      }
      return 0;
    });

    return filtered;
  }, [customerOpportunities, searchQuery, selectedCluster, selectedProduct, minPropensity, sortBy]);

  // Get unique products
  const availableProducts = useMemo(() => {
    const productSet = new Set();
    customerOpportunities.forEach(customer => {
      if (customer.topRecommendation?.product_code) {
        productSet.add(customer.topRecommendation.product_code);
      }
    });
    return Array.from(productSet).sort();
  }, [customerOpportunities]);

  // Get unique clusters
  const availableClusters = useMemo(() => {
    const clusterSet = new Set();
    customerOpportunities.forEach(customer => {
      if (customer.cluster_id !== null && customer.cluster_id !== undefined) {
        clusterSet.add(customer.cluster_id);
      }
    });
    return Array.from(clusterSet).sort();
  }, [customerOpportunities]);

  function handleDismiss(customerId, recommendationId) {
    // Refresh recommendations
    if (selectedRunId) {
      loadRecommendations(selectedRunId);
    }
  }

  function handleSendEmail(customerId, recommendationId, message = null) {
    if (message) {
      // In production, this would call the backend API to send the email
      alert(`Message sent to customer ${customerId}:\n\n${message}`);
    }
  }

  function handleScheduleCall(customerId, recommendationId) {
    // Placeholder for calendar integration
  }

  // Mock data for radar chart (in production, this would come from API)
  const getRadarData = (clusterId) => {
    const persona = CLUSTER_PERSONAS[clusterId] || CLUSTER_PERSONAS[5];
    // Mock customer data (would be real in production)
    const customerData = {
      Savings: 60,
      Investments: 40,
      Credit: 50,
      Insurance: 30,
      Digital: 70,
    };
    // Ideal data based on cluster
    const idealData = {
      Savings: persona.name === "Silver Savers" ? 90 : 70,
      Investments: persona.name === "Portfolio Builders" ? 95 : 60,
      Credit: persona.name === "The Foundation" ? 80 : 50,
      Insurance: persona.name === "Family Anchors" ? 85 : 60,
      Digital: persona.name === "Digital Nomads" ? 95 : 60,
    };
    return { customerData, idealData };
  };

  return (
    <EmployeeLayout 
      currentPage="suggestions" 
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <div style={{ 
        display: "flex", 
        flexDirection: "row",
        height: "100%", 
        overflow: "hidden",
        background: "transparent",
        gap: "20px",
      }}>
                
                {/* LEFT SIDEBAR - FILTERS */}
                <aside style={{
                  width: "280px",
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  overflowY: "auto",
                  flexShrink: 0,
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: "16px", 
                      fontWeight: 700, 
                      color: "white",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <Filter size={18} />
                      Filters
                    </h3>

                    {/* Search */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ 
                        fontSize: "12px", 
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "8px",
                        display: "block",
                      }}>
                        Search by ID
                      </label>
                      <div style={{ position: "relative" }}>
                        <Search size={16} style={{ 
                          position: "absolute", 
                          left: "10px", 
                          top: "50%", 
                          transform: "translateY(-50%)", 
                          color: "rgba(255, 255, 255, 0.5)" 
                        }} />
                        <input
                          type="text"
                          placeholder="Customer ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 10px 10px 36px",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "8px",
                            color: "white",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                    </div>

                    {/* Cluster Filter */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ 
                        fontSize: "12px", 
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "8px",
                        display: "block",
                      }}>
                        Filter by Cluster
                      </label>
                      <select
                        value={selectedCluster !== null ? selectedCluster.toString() : ""}
                        onChange={(e) => setSelectedCluster(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">All Clusters</option>
                        {availableClusters.map(clusterId => {
                          const persona = CLUSTER_PERSONAS[clusterId] || CLUSTER_PERSONAS[5];
                          return (
                            <option key={clusterId} value={clusterId}>
                              {persona.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Product Filter */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ 
                        fontSize: "12px", 
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "8px",
                        display: "block",
                      }}>
                        Filter by Product
                      </label>
                      <select
                        value={selectedProduct || ""}
                        onChange={(e) => setSelectedProduct(e.target.value || null)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">All Products</option>
                        {availableProducts.map(product => (
                          <option key={product} value={product}>
                            {product}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Min Propensity */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ 
                        fontSize: "12px", 
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "8px",
                        display: "block",
                      }}>
                        Min. Propensity: {minPropensity}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={minPropensity}
                        onChange={(e) => setMinPropensity(parseInt(e.target.value))}
                        style={{
                          width: "100%",
                        }}
                      />
                    </div>

                    {/* Sort By */}
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ 
                        fontSize: "12px", 
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "8px",
                        display: "block",
                      }}>
                        Sort by Value
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="revenue">Highest Revenue</option>
                        <option value="probability">Highest Match</option>
                        <option value="name">Customer Name</option>
                      </select>
                    </div>

                    {/* Batch Run Selector */}
                    <div>
                      <label style={{ 
                        fontSize: "12px", 
                        color: "rgba(255, 255, 255, 0.6)",
                        marginBottom: "8px",
                        display: "block",
                      }}>
                        Batch Run
                      </label>
                      <select
                        value={selectedRunId || ""}
                        onChange={(e) => setSelectedRunId(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          color: "white",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        {runs.length === 0 ? (
                          <option value="">No runs available</option>
                        ) : (
                          <>
                            {runs.map((run) => (
                              <option key={run.run_id} value={run.run_id}>
                                Run #{run.run_id}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </aside>

                {/* MAIN CONTENT - CUSTOMER CARDS GALLERY */}
                <main style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}>
                  <div style={{ 
                    overflowY: "auto",
                    flex: 1,
                    paddingRight: selectedCustomer ? "0" : "20px",
                  }}>
                    {/* Header */}
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div>
                          <h1 style={{ 
                            fontSize: "24px", 
                            fontWeight: 700,
                            letterSpacing: "-0.02em", 
                            color: "white", 
                            margin: "0 0 8px 0",
                            background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}>
                            Customer Opportunities
                          </h1>
                          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", margin: 0 }}>
                            Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total.toLocaleString()} customers
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          {selectedCustomers.size > 0 && (
                            <div style={{
                              padding: "8px 16px",
                              background: "rgba(59, 130, 246, 0.2)",
                              border: "1px solid rgba(59, 130, 246, 0.4)",
                              borderRadius: "10px",
                              color: "#93c5fd",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}>
                              <CheckCircle2 size={16} />
                              {selectedCustomers.size} selected
                            </div>
                          )}
                          <button
                            onClick={() => {
                              if (selectedRunId) {
                                loadRecommendations(selectedRunId, pagination.page, pagination.pageSize);
                              } else {
                                loadRuns();
                              }
                            }}
                            style={{
                              padding: "10px 16px",
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "12px",
                              color: "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              backdropFilter: "blur(10px)",
                            }}
                          >
                            <RefreshCw size={16} />
                            Refresh
                          </button>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div style={{
                        padding: "16px",
                        background: "rgba(220, 38, 38, 0.2)",
                        border: "1px solid #dc2626",
                        borderRadius: "12px",
                        color: "#fca5a5",
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                      </div>
                    )}

                    {isLoading && (
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                        gap: "16px",
                      }}>
                        {Array.from({ length: pagination.pageSize }).map((_, idx) => (
                          <SkeletonCard key={idx} />
                        ))}
                      </div>
                    )}

                    {!isLoading && filteredOpportunities.length === 0 && (
                      <div style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "16px",
                        padding: "40px",
                        textAlign: "center",
                        color: "rgba(255, 255, 255, 0.7)",
                      }}>
                        <Users size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "8px" }}>
                          No Opportunities Found
                        </div>
                        <div>
                          Try adjusting your filters or select a different batch run.
                        </div>
                      </div>
                    )}

                    {!isLoading && filteredOpportunities.length > 0 && (
                      <>
                        {/* Bulk Actions Bar */}
                        {selectedCustomers.size > 0 && (
                          <div style={{
                            background: "rgba(59, 130, 246, 0.1)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "12px",
                            padding: "12px 16px",
                            marginBottom: "16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}>
                            <div style={{ color: "#93c5fd", fontSize: "14px", fontWeight: 600 }}>
                              {selectedCustomers.size} customer{selectedCustomers.size !== 1 ? 's' : ''} selected
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => {
                                  // Bulk email functionality - to be implemented
                                }}
                                style={{
                                  padding: "8px 16px",
                                  background: "rgba(59, 130, 246, 0.2)",
                                  border: "1px solid rgba(59, 130, 246, 0.4)",
                                  borderRadius: "8px",
                                  color: "#93c5fd",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <Mail size={14} />
                                Email All
                              </button>
                              <button
                                onClick={clearSelections}
                                style={{
                                  padding: "8px 16px",
                                  background: "rgba(255, 255, 255, 0.1)",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  borderRadius: "8px",
                                  color: "white",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                          gap: "16px",
                          marginBottom: "20px",
                        }}>
                          {filteredOpportunities.map((customer) => {
                            const persona = CLUSTER_PERSONAS[customer.cluster_id] || CLUSTER_PERSONAS[5];
                            const topRec = customer.topRecommendation;
                            if (!topRec) return null;

                            const probability = topRec.acceptance_probability || 0;
                            const isSelected = selectedCustomer === customer.customer_id;
                            const isCheckboxSelected = selectedCustomers.has(customer.customer_id);

                            return (
                              <div
                                key={customer.customer_id}
                                onClick={(e) => {
                                  // Don't select customer if clicking checkbox
                                  if (e.target.type !== 'checkbox') {
                                    setSelectedCustomer(customer.customer_id);
                                  }
                                }}
                                style={{
                                  background: isSelected 
                                    ? `linear-gradient(135deg, ${persona.color}20, rgba(255, 255, 255, 0.08))`
                                    : isCheckboxSelected
                                    ? `linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(255, 255, 255, 0.08))`
                                    : "rgba(255, 255, 255, 0.08)",
                                  backdropFilter: "blur(20px)",
                                  border: `2px solid ${
                                    isSelected ? persona.color 
                                    : isCheckboxSelected ? "rgba(59, 130, 246, 0.5)"
                                    : "rgba(255, 255, 255, 0.1)"
                                  }`,
                                  borderRadius: "16px",
                                  padding: "20px",
                                  cursor: "pointer",
                                  transition: "all 0.3s",
                                  position: "relative",
                                }}
                              >
                                {/* Selection Checkbox */}
                                <div style={{
                                  position: "absolute",
                                  top: "16px",
                                  left: "16px",
                                  zIndex: 10,
                                }}
                                onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isCheckboxSelected}
                                    onChange={() => toggleCustomerSelection(customer.customer_id)}
                                    style={{
                                      width: "20px",
                                      height: "20px",
                                      cursor: "pointer",
                                      accentColor: "#3b82f6",
                                    }}
                                  />
                                </div>

                                {/* Persona Tag */}
                                <div style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "16px",
                                  marginLeft: "32px",
                                }}>
                                  <div style={{
                                    padding: "6px 12px",
                                    background: `linear-gradient(135deg, ${persona.color}40, ${persona.color}20)`,
                                    border: `1px solid ${persona.color}40`,
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: persona.color,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}>
                                    {persona.name}
                                  </div>
                                  <ProbabilityGauge value={probability} size={60} />
                                </div>

                              {/* Customer Info - Structured Intelligence */}
                              <div style={{ marginBottom: "16px" }}>
                                {/* Primary Identifier: Full Name */}
                                <div style={{ 
                                  fontSize: "20px", 
                                  fontWeight: 700, 
                                  color: "white",
                                  marginBottom: "8px",
                                  lineHeight: "1.2",
                                }}>
                                  {customer.customer_name || customer.customer_id}
                                </div>
                                
                                {/* Key Descriptor: Cluster/Persona */}
                                <div style={{ 
                                  fontSize: "13px", 
                                  fontWeight: 600,
                                  color: persona.color,
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}>
                                  <span style={{
                                    padding: "3px 8px",
                                    background: `${persona.color}20`,
                                    border: `1px solid ${persona.color}40`,
                                    borderRadius: "6px",
                                  }}>
                                    {persona.name}
                                  </span>
                                </div>
                                
                                {/* Economic Context */}
                                <div style={{ 
                                  fontSize: "12px", 
                                  color: "rgba(255, 255, 255, 0.7)",
                                  marginBottom: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                }}>
                                  {customer.profession && (
                                    <span style={{
                                      padding: "2px 6px",
                                      background: "rgba(79, 216, 235, 0.15)",
                                      borderRadius: "4px",
                                    }}>
                                      {customer.profession}
                                    </span>
                                  )}
                                  {customer.segment_hint && (
                                    <span style={{
                                      padding: "2px 6px",
                                      background: "rgba(148, 163, 184, 0.15)",
                                      borderRadius: "4px",
                                    }}>
                                      {customer.segment_hint}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Financial Context */}
                                {customer.annual_income && (
                                <div style={{ 
                                  fontSize: "11px", 
                                  color: "rgba(255, 255, 255, 0.5)",
                                    marginTop: "4px",
                                }}>
                                    Income: {formatCurrency(customer.annual_income)}
                                </div>
                                )}
                              </div>

                              {/* Top Recommendation - The "Nudge" with Icon and AI Reasoning */}
                              {(() => {
                                // Get top AI recommendation from advisorStrategy if available (highest fitness_score)
                                const topAIRecommendation = advisorStrategy?.recommendations?.length > 0
                                  ? advisorStrategy.recommendations.sort((a, b) => (b.fitness_score || 0) - (a.fitness_score || 0))[0]
                                  : null;
                                const displayProduct = topAIRecommendation || topRec;
                                const productIcon = topAIRecommendation?.icon || "wallet";
                                
                                // Map icon name to component
                                const iconMap = {
                                  'credit-card': CreditCard,
                                  'wallet': Wallet,
                                  'piggy-bank': PiggyBank,
                                  'trending-up': TrendingUp,
                                  'shield': Shield,
                                  'home': Home,
                                  'briefcase': Briefcase,
                                  'package': Package,
                                  'map-pin': MapPin,
                                  'dollar-sign': DollarSign,
                                };
                                const IconComponent = iconMap[productIcon?.toLowerCase()] || Wallet;
                                
                                return (
                              <div style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "12px",
                                padding: "12px",
                                marginBottom: "16px",
                                    border: "1px solid rgba(79, 216, 235, 0.2)",
                              }}>
                                <div style={{ 
                                      fontSize: "11px",
                                  fontWeight: 600, 
                                      color: "rgba(79, 216, 235, 0.9)",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}>
                                      Suitable Service
                                    </div>
                                    <div style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                  marginBottom: "8px",
                                }}>
                                      <div style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        background: "rgba(79, 216, 235, 0.15)",
                                        border: "1px solid rgba(79, 216, 235, 0.3)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}>
                                        <IconComponent 
                                          size={20} 
                                          color="#4fd8eb"
                                          style={{ filter: "drop-shadow(0 0 4px rgba(79, 216, 235, 0.5))" }}
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ 
                                          fontSize: "15px", 
                                          fontWeight: 700, 
                                          color: "white",
                                          marginBottom: "2px",
                                        }}>
                                          {displayProduct.product_name || displayProduct.product_code}
                                        </div>
                                        {topAIRecommendation?.fitness_score && (
                                          <div style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "2px 6px",
                                            background: topAIRecommendation.fitness_score >= 80 
                                              ? "rgba(16, 185, 129, 0.2)" 
                                              : topAIRecommendation.fitness_score >= 70 
                                              ? "rgba(59, 130, 246, 0.2)" 
                                              : "rgba(245, 158, 11, 0.2)",
                                            border: `1px solid ${topAIRecommendation.fitness_score >= 80 
                                              ? "rgba(16, 185, 129, 0.4)" 
                                              : topAIRecommendation.fitness_score >= 70 
                                              ? "rgba(59, 130, 246, 0.4)" 
                                              : "rgba(245, 158, 11, 0.4)"}`,
                                            borderRadius: "4px",
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            color: topAIRecommendation.fitness_score >= 80 
                                              ? "#10b981" 
                                              : topAIRecommendation.fitness_score >= 70 
                                              ? "#3b82f6" 
                                              : "#f59e0b",
                                          }}>
                                            {topAIRecommendation.fitness_score}% Match
                                          </div>
                                        )}
                                      </div>
                                </div>
                                <div style={{ 
                                  fontSize: "12px", 
                                  color: "rgba(255, 255, 255, 0.7)",
                                  lineHeight: "1.5",
                                  marginBottom: "8px",
                                      fontStyle: "italic",
                                }}>
                                      {topAIRecommendation?.short_reasoning || topRec.narrative || "AI-powered recommendation based on customer profile"}
                                </div>
                                <div style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between",
                                      alignItems: "center",
                                      fontSize: "12px",
                                      paddingTop: "8px",
                                      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                                }}>
                                  <div style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                                        Expected Revenue:
                                      </div>
                                      <span style={{ color: "#10b981", fontWeight: 700, fontSize: "13px" }}>
                                        {formatCurrency(displayProduct.expected_revenue || topRec.expected_revenue)}
                                    </span>
                                  </div>
                                </div>
                                );
                              })()}

                              {/* Quick Actions */}
                              <div style={{
                                display: "flex",
                                gap: "8px",
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendEmail(customer.customer_id, topRec.id);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    background: "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <Mail size={14} />
                                  Email
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleScheduleCall(customer.customer_id, topRec.id);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    background: "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <Phone size={14} />
                                  Call
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomer(customer.customer_id);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "8px 12px",
                                    background: `linear-gradient(135deg, ${persona.color}, ${persona.color}80)`,
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <Eye size={14} />
                                  View
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        </div>

                        {/* Pagination Footer */}
                        {pagination.totalPages > 1 && (
                          <div style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "16px",
                            padding: "20px",
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "16px",
                          }}>
                            {/* Contextual Footer */}
                            <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>
                              Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total.toLocaleString()} customers
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                              {/* Page Size Selector */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <label style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "13px" }}>
                                  Rows per page:
                                </label>
                                <select
                                  value={pagination.pageSize}
                                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                                  style={{
                                    padding: "6px 12px",
                                    background: "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <option value={10}>10</option>
                                  <option value={20}>20</option>
                                  <option value={50}>50</option>
                                </select>
                              </div>

                              {/* Page Navigation */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                  onClick={() => handlePageChange(1)}
                                  disabled={pagination.page === 1}
                                  style={{
                                    padding: "8px 12px",
                                    background: pagination.page === 1 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "13px",
                                    cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                                    opacity: pagination.page === 1 ? 0.5 : 1,
                                  }}
                                >
                                  First
                                </button>
                                <button
                                  onClick={() => handlePageChange(pagination.page - 1)}
                                  disabled={pagination.page === 1}
                                  style={{
                                    padding: "8px 12px",
                                    background: pagination.page === 1 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "13px",
                                    cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                                    opacity: pagination.page === 1 ? 0.5 : 1,
                                  }}
                                >
                                  Previous
                                </button>

                                {/* Page Numbers */}
                                <div style={{ display: "flex", gap: "4px" }}>
                                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                      pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                      pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                      pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                      pageNum = pagination.page - 2 + i;
                                    }
                                    
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        style={{
                                          padding: "8px 12px",
                                          background: pagination.page === pageNum 
                                            ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                                            : "rgba(255, 255, 255, 0.1)",
                                          border: "1px solid rgba(255, 255, 255, 0.2)",
                                          borderRadius: "8px",
                                          color: "white",
                                          fontSize: "13px",
                                          fontWeight: pagination.page === pageNum ? 700 : 400,
                                          cursor: "pointer",
                                          minWidth: "40px",
                                        }}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  })}
                                </div>

                                <button
                                  onClick={() => handlePageChange(pagination.page + 1)}
                                  disabled={pagination.page >= pagination.totalPages}
                                  style={{
                                    padding: "8px 12px",
                                    background: pagination.page >= pagination.totalPages ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "13px",
                                    cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                                    opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                                  }}
                                >
                                  Next
                                </button>
                                <button
                                  onClick={() => handlePageChange(pagination.totalPages)}
                                  disabled={pagination.page >= pagination.totalPages}
                                  style={{
                                    padding: "8px 12px",
                                    background: pagination.page >= pagination.totalPages ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontSize: "13px",
                                    cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                                    opacity: pagination.page >= pagination.totalPages ? 0.5 : 1,
                                  }}
                                >
                                  Last
                                </button>
                              </div>

                              {/* Jump to Page */}
                              {pagination.totalPages > 10 && (
                                <form onSubmit={handleJumpToPage} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <label style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "13px" }}>
                                    Jump to:
                                  </label>
                                  <input
                                    type="number"
                                    name="jumpPage"
                                    min="1"
                                    max={pagination.totalPages}
                                    placeholder="Page"
                                    style={{
                                      width: "60px",
                                      padding: "6px 8px",
                                      background: "rgba(255, 255, 255, 0.1)",
                                      border: "1px solid rgba(255, 255, 255, 0.2)",
                                      borderRadius: "8px",
                                      color: "white",
                                      fontSize: "13px",
                                    }}
                                  />
                                  <button
                                    type="submit"
                                    style={{
                                      padding: "6px 12px",
                                      background: "rgba(255, 255, 255, 0.1)",
                                      border: "1px solid rgba(255, 255, 255, 0.2)",
                                      borderRadius: "8px",
                                      color: "white",
                                      fontSize: "13px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Go
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </main>

                {/* RIGHT PANEL - DETAIL VIEW */}
                {selectedCustomer && (
                  <aside style={{
                    width: "600px", // Wider to accommodate split-view messaging
                    background: "rgba(30, 41, 59, 0.5)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    flexShrink: 0,
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}>
                      <h3 style={{ 
                        fontSize: "18px", 
                        fontWeight: 700, 
                        color: "white",
                      }}>
                        Customer Deep Dive
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerDetail(null);
                        }}
                        style={{
                          padding: "6px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#E2E8F0",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {isDetailLoading ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.7)" }}>
                        <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }} />
                        <p style={{ marginTop: "12px" }}>Loading details...</p>
                      </div>
                    ) : customerDetail ? (
                      <>
                        {/* Customer Snapshot */}
                        <div style={{
                          background: "rgba(30, 41, 59, 0.5)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          padding: "16px",
                          marginBottom: "20px",
                        }}>
                          <div style={{ 
                            fontSize: "16px", 
                            fontWeight: 700, 
                            color: "#E2E8F0",
                            marginBottom: "12px",
                          }}>
                            {customerDetail.customer_snapshot?.customer_name || selectedCustomer}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "#94A3B8",
                            marginBottom: "4px",
                          }}>
                            ID: {customerDetail.customer_snapshot?.customer_id || selectedCustomer}
                          </div>
                          {customerDetail.customer_snapshot?.cluster_label && (
                            <div style={{ 
                              fontSize: "12px", 
                              color: "#94A3B8",
                            }}>
                              Cluster: {customerDetail.customer_snapshot.cluster_label}
                            </div>
                          )}
                        </div>

                        {/* AI Strategic Summary - Intelligence Layer */}
                        {advisorStrategy && advisorStrategy.profile_summary && (
                          <div style={{
                            background: "rgba(59, 130, 246, 0.1)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "20px",
                          }}>
                            <div style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center",
                              marginBottom: "12px",
                            }}>
                              <div style={{ 
                                fontSize: "14px", 
                                fontWeight: 700, 
                                color: "#4fd8eb",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}>
                                <Sparkles size={16} />
                                AI Strategic Summary
                              </div>
                              <button
                                onClick={() => reanalyzeCustomer(selectedCustomer)}
                                disabled={isLoadingStrategy}
                                style={{
                                  padding: "4px 8px",
                                  background: "rgba(59, 130, 246, 0.2)",
                                  border: "1px solid rgba(59, 130, 246, 0.4)",
                                  borderRadius: "6px",
                                  color: "#93c5fd",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: isLoadingStrategy ? "not-allowed" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <RefreshCw size={12} style={{ animation: isLoadingStrategy ? "spin 1s linear infinite" : "none" }} />
                                Re-analyze
                              </button>
                            </div>
                            
                            {isLoadingStrategy ? (
                              <div style={{ textAlign: "center", padding: "20px", color: "rgba(255, 255, 255, 0.7)" }}>
                                <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }} />
                                <p style={{ marginTop: "8px", fontSize: "12px" }}>Analyzing customer profile...</p>
                              </div>
                            ) : (
                              <>
                                <div style={{ 
                                  fontSize: "13px", 
                                  color: "#E2E8F0",
                                  lineHeight: "1.6",
                                  marginBottom: "12px",
                                }}>
                                  {advisorStrategy.profile_summary.summary || "No summary available"}
                                </div>
                                
                                {advisorStrategy.profile_summary.cluster_interpretation && (
                                  <div style={{
                                    marginTop: "12px",
                                    padding: "12px",
                                    background: "rgba(0, 0, 0, 0.2)",
                                    borderRadius: "8px",
                                    borderLeft: "3px solid #4fd8eb",
                                  }}>
                                    <div style={{ 
                                      fontSize: "12px", 
                                      fontWeight: 600, 
                                      color: "#4fd8eb",
                                      marginBottom: "6px",
                                    }}>
                                      Cluster Interpretation
                                    </div>
                                    <div style={{ 
                                      fontSize: "12px", 
                                      color: "rgba(255, 255, 255, 0.8)",
                                      lineHeight: "1.5",
                                    }}>
                                      {advisorStrategy.profile_summary.cluster_interpretation}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Financial Metrics Quick View */}
                                {advisorStrategy.profile_summary.customer_profile?.financial_metrics && (
                                  <div style={{
                                    marginTop: "12px",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "8px",
                                    fontSize: "11px",
                                  }}>
                                    {advisorStrategy.profile_summary.customer_profile.financial_metrics.average_transaction_amount && (
                                      <div>
                                        <div style={{ color: "rgba(255, 255, 255, 0.6)" }}>Avg Transaction</div>
                                        <div style={{ color: "#4fd8eb", fontWeight: 600 }}>
                                          €{advisorStrategy.profile_summary.customer_profile.financial_metrics.average_transaction_amount.toFixed(2)}
                                        </div>
                                      </div>
                                    )}
                                    {advisorStrategy.profile_summary.customer_profile.financial_metrics.transaction_frequency && (
                                      <div>
                                        <div style={{ color: "rgba(255, 255, 255, 0.6)" }}>Tx Frequency</div>
                                        <div style={{ color: "#4fd8eb", fontWeight: 600 }}>
                                          {advisorStrategy.profile_summary.customer_profile.financial_metrics.transaction_frequency}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Product Fit Radar */}
                        {selectedCustomer && (() => {
                          const customer = customerOpportunities.find(c => c.customer_id === selectedCustomer);
                          if (customer) {
                            const { customerData, idealData } = getRadarData(customer.cluster_id);
                            return (
                              <div style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "12px",
                                padding: "16px",
                                marginBottom: "20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}>
                                <div style={{ 
                                  fontSize: "14px", 
                                  fontWeight: 600, 
                                  color: "white",
                                  marginBottom: "12px",
                                }}>
                                  Product Fit Analysis
                                </div>
                                <ProductFitRadar 
                                  customerData={customerData} 
                                  idealData={idealData} 
                                  size={200}
                                />
                                <div style={{
                                  marginTop: "12px",
                                  fontSize: "11px",
                                  color: "rgba(255, 255, 255, 0.5)",
                                  textAlign: "center",
                                }}>
                                  <div style={{ marginBottom: "4px" }}>
                                    <span style={{ color: "#4fd8eb" }}>●</span> Current Portfolio
                                  </div>
                                  <div>
                                    <span style={{ color: "#10b981" }}>●</span> Ideal for Cluster
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Strategic Advisor Assistant - Grouped Service Selector */}
                        {servicesByCategory && servicesByCategory.services_by_category && Object.keys(servicesByCategory.services_by_category).length > 0 ? (
                          <div style={{
                            background: "rgba(59, 130, 246, 0.1)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "20px",
                          }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: 700, 
                              color: "#4fd8eb",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}>
                              <Target size={16} />
                              Strategic Advisor Assistant - Select Service
                            </div>
                            
                            {/* Category Tabs */}
                            <div style={{
                              display: "flex",
                              gap: "8px",
                              marginBottom: "16px",
                              flexWrap: "wrap",
                              borderBottom: "2px solid rgba(79, 216, 235, 0.2)",
                              paddingBottom: "12px",
                            }}>
                              {Object.keys(servicesByCategory.services_by_category).map((category) => (
                                <button
                                  key={category}
                                  onClick={() => setSelectedServiceCategory(category)}
                                  style={{
                                    padding: "8px 16px",
                                    background: selectedServiceCategory === category 
                                      ? "rgba(79, 216, 235, 0.3)" 
                                      : "rgba(255, 255, 255, 0.05)",
                                    border: selectedServiceCategory === category
                                      ? "2px solid rgba(79, 216, 235, 0.6)"
                                      : "2px solid transparent",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: selectedServiceCategory === category ? 700 : 500,
                                    color: selectedServiceCategory === category ? "#4fd8eb" : "rgba(255, 255, 255, 0.7)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {category}
                                  <span style={{
                                    fontSize: "10px",
                                    background: selectedServiceCategory === category 
                                      ? "rgba(79, 216, 235, 0.3)" 
                                      : "rgba(255, 255, 255, 0.1)",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                  }}>
                                    {servicesByCategory.services_by_category[category]?.length || 0}
                                  </span>
                                </button>
                              ))}
                            </div>
                            
                            {/* Services Grid for Selected Category */}
                            {servicesByCategory.services_by_category[selectedServiceCategory] && (
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: "12px",
                                maxHeight: "400px",
                                overflowY: "auto",
                                padding: "8px",
                              }}>
                                {servicesByCategory.services_by_category[selectedServiceCategory].map((service) => {
                                  const isSelected = manuallySelectedService?.product_code === service.product_code;
                                  const isRecommended = advisorStrategy?.recommendations?.some(
                                    rec => rec.product_code === service.product_code
                                  );
                                  
                                  return (
                                    <div
                                      key={service.product_code}
                                      onClick={() => {
                                        setManuallySelectedService(service);
                                      }}
                                      style={{
                                        background: isSelected 
                                          ? "rgba(79, 216, 235, 0.2)" 
                                          : "rgba(0, 0, 0, 0.2)",
                                        border: isSelected
                                          ? "2px solid rgba(79, 216, 235, 0.6)"
                                          : isRecommended
                                          ? "1px solid rgba(16, 185, 129, 0.4)"
                                          : "1px solid rgba(79, 216, 235, 0.2)",
                                        borderRadius: "8px",
                                        padding: "12px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        position: "relative",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSelected) {
                                          e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.5)";
                                          e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSelected) {
                                          e.currentTarget.style.borderColor = isRecommended
                                            ? "rgba(16, 185, 129, 0.4)"
                                            : "rgba(79, 216, 235, 0.2)";
                                          e.currentTarget.style.background = "rgba(0, 0, 0, 0.2)";
                                        }
                                      }}
                                    >
                                      {isRecommended && (
                                        <div style={{
                                          position: "absolute",
                                          top: "8px",
                                          right: "8px",
                                          background: "rgba(16, 185, 129, 0.2)",
                                          border: "1px solid rgba(16, 185, 129, 0.4)",
                                          borderRadius: "4px",
                                          padding: "2px 6px",
                                          fontSize: "9px",
                                          fontWeight: 600,
                                          color: "#10b981",
                                        }}>
                                          AI Recommended
                                        </div>
                                      )}
                                      
                                      {/* Service Icon */}
                                      {(() => {
                                        const iconMap = {
                                          'credit-card': CreditCard,
                                          'wallet': Wallet,
                                          'piggy-bank': PiggyBank,
                                          'trending-up': TrendingUp,
                                          'shield': Shield,
                                          'home': Home,
                                          'briefcase': Briefcase,
                                          'package': Package,
                                          'map-pin': MapPin,
                                          'dollar-sign': DollarSign,
                                        };
                                        const IconComponent = iconMap[service.icon?.toLowerCase()] || Wallet;
                                        return (
                                          <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            marginBottom: "8px",
                                          }}>
                                            <div style={{
                                              width: "32px",
                                              height: "32px",
                                              borderRadius: "8px",
                                              background: isSelected 
                                                ? "rgba(79, 216, 235, 0.2)" 
                                                : "rgba(79, 216, 235, 0.1)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexShrink: 0,
                                            }}>
                                              <IconComponent 
                                                size={18} 
                                                color={isSelected ? "#4fd8eb" : "rgba(79, 216, 235, 0.8)"}
                                              />
                                            </div>
                                            <div style={{ 
                                              fontSize: "13px", 
                                              fontWeight: 600, 
                                              color: "#E2E8F0",
                                              flex: 1,
                                              paddingRight: isRecommended ? "80px" : "0",
                                            }}>
                                              {service.name}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                      
                                      <div style={{ 
                                        fontSize: "10px", 
                                        color: "rgba(255, 255, 255, 0.5)",
                                        marginBottom: "8px",
                                      }}>
                                        {service.description || service.type}
                                      </div>
                                      
                                      {service.key_benefits && service.key_benefits.length > 0 && (
                                        <div style={{ marginTop: "8px" }}>
                                          <ul style={{ 
                                            margin: 0, 
                                            paddingLeft: "16px", 
                                            fontSize: "10px", 
                                            color: "rgba(255, 255, 255, 0.6)", 
                                            lineHeight: "1.4" 
                                          }}>
                                            {service.key_benefits.slice(0, 2).map((benefit, idx) => (
                                              <li key={idx}>{benefit}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Category Description */}
                            {servicesByCategory.category_info?.[selectedServiceCategory] && (
                              <div style={{
                                marginTop: "12px",
                                padding: "10px",
                                background: "rgba(0, 0, 0, 0.2)",
                                borderRadius: "6px",
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.6)",
                                fontStyle: "italic",
                              }}>
                                {servicesByCategory.category_info[selectedServiceCategory].description}
                              </div>
                            )}
                          </div>
                        ) : servicesByCategory && servicesByCategory.error ? (
                          <div style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "20px",
                          }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: 700, 
                              color: "#ef4444",
                              marginBottom: "8px",
                            }}>
                              ⚠️ Services Not Available
                            </div>
                            <div style={{ 
                              fontSize: "12px", 
                              color: "rgba(255, 255, 255, 0.7)",
                            }}>
                              {servicesByCategory.error || "Failed to load services. Please check backend logs."}
                            </div>
                          </div>
                        ) : null}

                        {/* Top 3 Recommended Products - Dynamic AI Insights */}
                        {(() => {
                          // Check if we have AI recommendations
                          if (advisorStrategy && advisorStrategy.recommendations && advisorStrategy.recommendations.length > 0) {
                            return (
                              <div style={{
                                background: "rgba(59, 130, 246, 0.1)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                borderRadius: "12px",
                                padding: "16px",
                                marginBottom: "20px",
                              }}>
                                <div style={{ 
                                  fontSize: "14px", 
                                  fontWeight: 700, 
                                  color: "#4fd8eb",
                                  marginBottom: "16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}>
                                  <Target size={16} />
                                  Top {advisorStrategy.recommendations.length} Recommended Products
                                </div>
                                
                                {advisorStrategy.recommendations
                                  .sort((a, b) => (b.fitness_score || 0) - (a.fitness_score || 0)) // Sort by fitness_score descending
                                  .map((rec, idx) => {
                              // Map icon name to component
                              const iconMap = {
                                'credit-card': CreditCard,
                                'wallet': Wallet,
                                'piggy-bank': PiggyBank,
                                'trending-up': TrendingUp,
                                'shield': Shield,
                                'home': Home,
                                'briefcase': Briefcase,
                                'package': Package,
                                'map-pin': MapPin,
                                'dollar-sign': DollarSign,
                              };
                              const IconComponent = iconMap[rec.icon?.toLowerCase()] || Wallet;
                              
                              return (
                                <div
                                  key={rec.product_code || idx}
                                  onClick={() => {
                                    // Set this as the manually selected service
                                    setManuallySelectedService(rec);
                                  }}
                                  style={{
                                    background: manuallySelectedService?.product_code === rec.product_code 
                                      ? "rgba(79, 216, 235, 0.2)" 
                                      : "rgba(0, 0, 0, 0.2)",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    marginBottom: idx < advisorStrategy.recommendations.length - 1 ? "12px" : "0",
                                    border: `1px solid ${manuallySelectedService?.product_code === rec.product_code 
                                      ? "rgba(79, 216, 235, 0.5)" 
                                      : "rgba(79, 216, 235, 0.2)"}`,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (manuallySelectedService?.product_code !== rec.product_code) {
                                      e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.5)";
                                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (manuallySelectedService?.product_code !== rec.product_code) {
                                      e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.2)";
                                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.2)";
                                    }
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
                                      {/* Product Icon */}
                                      <div style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        background: manuallySelectedService?.product_code === rec.product_code 
                                          ? "rgba(79, 216, 235, 0.2)" 
                                          : "rgba(79, 216, 235, 0.1)",
                                        border: `1px solid ${manuallySelectedService?.product_code === rec.product_code 
                                          ? "rgba(79, 216, 235, 0.4)" 
                                          : "rgba(79, 216, 235, 0.2)"}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}>
                                        <IconComponent 
                                          size={18} 
                                          color={manuallySelectedService?.product_code === rec.product_code ? "#4fd8eb" : "rgba(79, 216, 235, 0.8)"}
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ 
                                          fontSize: "14px", 
                                          fontWeight: 600, 
                                          color: "#E2E8F0",
                                          marginBottom: "4px",
                                        }}>
                                          #{rec.rank || idx + 1}. {rec.product_name || rec.product_code}
                                        </div>
                                        <div style={{ 
                                          fontSize: "11px", 
                                          color: "rgba(255, 255, 255, 0.5)",
                                        }}>
                                          {rec.category || "Unknown Category"}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{
                                      padding: "4px 8px",
                                      background: rec.fitness_score >= 80 ? "rgba(16, 185, 129, 0.2)" : rec.fitness_score >= 70 ? "rgba(59, 130, 246, 0.2)" : "rgba(245, 158, 11, 0.2)",
                                      border: `1px solid ${rec.fitness_score >= 80 ? "rgba(16, 185, 129, 0.4)" : rec.fitness_score >= 70 ? "rgba(59, 130, 246, 0.4)" : "rgba(245, 158, 11, 0.4)"}`,
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: rec.fitness_score >= 80 ? "#10b981" : rec.fitness_score >= 70 ? "#3b82f6" : "#f59e0b",
                                    }}>
                                      {rec.fitness_score || 0}% Match
                                    </div>
                                  </div>
                                
                                {/* Key Benefits */}
                                {rec.key_benefits && rec.key_benefits.length > 0 && (
                                  <div style={{ marginTop: "8px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)", marginBottom: "4px" }}>
                                      Key Benefits:
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.5" }}>
                                      {rec.key_benefits.slice(0, 3).map((benefit, bidx) => (
                                        <li key={bidx}>{benefit}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Short Reasoning - Display why this service was chosen */}
                                {rec.short_reasoning && (
                                  <div style={{ 
                                    marginTop: "8px",
                                    padding: "8px",
                                    background: "rgba(79, 216, 235, 0.1)",
                                    borderRadius: "6px",
                                    borderLeft: "3px solid #4fd8eb",
                                  }}>
                                    <div style={{ 
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      color: "#4fd8eb",
                                      marginBottom: "4px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}>
                                      Why This Fits
                                    </div>
                                    <div style={{ 
                                      fontSize: "11px",
                                      color: "rgba(255, 255, 255, 0.8)",
                                      lineHeight: "1.5",
                                      fontStyle: "italic",
                                    }}>
                                      {rec.short_reasoning}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Detailed Reasoning (if short_reasoning not available) */}
                                {!rec.short_reasoning && rec.detailed_reasoning && (
                                  <div style={{ 
                                    marginTop: "8px",
                                    padding: "8px",
                                    background: "rgba(79, 216, 235, 0.1)",
                                    borderRadius: "6px",
                                    borderLeft: "3px solid #4fd8eb",
                                  }}>
                                    <div style={{ 
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      color: "#4fd8eb",
                                      marginBottom: "4px",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}>
                                      Why This Fits
                                    </div>
                                    <div style={{ 
                                      fontSize: "11px",
                                      color: "rgba(255, 255, 255, 0.8)",
                                      lineHeight: "1.5",
                                      fontStyle: "italic",
                                    }}>
                                      {rec.detailed_reasoning.substring(0, 150)}...
                                    </div>
                                  </div>
                                )}
                                
                                {/* Metrics */}
                                <div style={{ 
                                  display: "flex", 
                                  gap: "12px", 
                                  marginTop: "8px",
                                  fontSize: "10px",
                                  color: "rgba(255, 255, 255, 0.5)",
                                }}>
                                  {rec.acceptance_probability && (
                                    <div>
                                      <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Acceptance:</span> {formatPercent(rec.acceptance_probability)}
                                    </div>
                                  )}
                                  {rec.expected_revenue && (
                                    <div>
                                      <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Revenue:</span> {formatCurrency(rec.expected_revenue)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                            })}
                              </div>
                            );
                          }
                          // Fallback: Single Recommendation Display
                          if (customerDetail?.recommended_service) {
                            return (
                              <div style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "12px",
                                padding: "16px",
                                marginBottom: "20px",
                              }}>
                                <div style={{ 
                                  fontSize: "14px", 
                                  fontWeight: 600, 
                                  color: "white",
                                  marginBottom: "12px",
                                }}>
                                  Recommendation
                                </div>
                                <div style={{ 
                                  fontSize: "16px", 
                                  fontWeight: 700, 
                                  color: "#4fd8eb",
                                  marginBottom: "8px",
                                }}>
                                  {customerDetail.recommended_service.product_code}
                                </div>
                                <div style={{ 
                                  fontSize: "12px", 
                                  color: "rgba(255, 255, 255, 0.6)",
                                  marginBottom: "12px",
                                }}>
                                  Expected Revenue: {formatCurrency(customerDetail.recommended_service.expected_revenue)}
                                </div>
                                <ProbabilityGauge 
                                  value={customerDetail.recommended_service.acceptance_probability || 0} 
                                  size={100}
                                />
                              </div>
                            );
                          }
                          // No recommendations available
                          return null;
                        })()}

                        {/* AI Explanation */}
                        {customerDetail.ai_explanation && (
                          <div style={{
                            background: "rgba(30, 41, 59, 0.5)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "20px",
                          }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: 600, 
                              color: "#E2E8F0",
                              marginBottom: "12px",
                            }}>
                              Why This Recommendation?
                            </div>
                            <div style={{ 
                              fontSize: "13px", 
                              color: "#E2E8F0",
                              lineHeight: "1.6",
                            }}>
                              {customerDetail.ai_explanation.narrative || "No explanation available"}
                            </div>
                            {customerDetail.ai_explanation.bullets && customerDetail.ai_explanation.bullets.length > 0 && (
                              <ul style={{
                                marginTop: "12px",
                                paddingLeft: "20px",
                                fontSize: "12px",
                                color: "rgba(255, 255, 255, 0.7)",
                                lineHeight: "1.8",
                              }}>
                                {customerDetail.ai_explanation.bullets.map((bullet, idx) => (
                                  <li key={idx}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Comparison to Cluster */}
                        {selectedCustomer && (() => {
                          const customer = customerOpportunities.find(c => c.customer_id === selectedCustomer);
                          if (customer) {
                            const persona = CLUSTER_PERSONAS[customer.cluster_id] || CLUSTER_PERSONAS[5];
                            return (
                              <div style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "12px",
                                padding: "16px",
                                marginBottom: "20px",
                              }}>
                                <div style={{ 
                                  fontSize: "14px", 
                                  fontWeight: 600, 
                                  color: "white",
                                  marginBottom: "12px",
                                }}>
                                  Comparison to {persona.name} Cluster
                                </div>
                                <div style={{ 
                                  fontSize: "12px", 
                                  color: "rgba(255, 255, 255, 0.7)",
                                  lineHeight: "1.6",
                                }}>
                                  This customer's profile aligns with the {persona.name} segment, which typically shows {persona.description.toLowerCase()}. The recommendation is based on identifying gaps between their current portfolio and the ideal portfolio for this segment.
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* AI Message Composer - Editable Message Draft */}
                        {advisorStrategy && advisorStrategy.recommendations && advisorStrategy.recommendations.length > 0 && (
                          <div style={{
                            background: "rgba(139, 92, 246, 0.1)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "20px",
                          }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: 700, 
                              color: "#a78bfa",
                              marginBottom: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}>
                              <MessageSquare size={16} />
                              AI-Generated Message Draft
                            </div>
                            <AIMessageComposer
                              customerName={customerDetail.customer_snapshot?.customer_name || selectedCustomer}
                              customerId={selectedCustomer}
                              productName={
                                manuallySelectedService?.name || 
                                advisorStrategy.recommendations[0]?.product_name || 
                                customerDetail.recommended_service?.product_code
                              }
                              productCode={
                                manuallySelectedService?.product_code || 
                                advisorStrategy.recommendations[0]?.product_code || 
                                customerDetail.recommended_service?.product_code
                              }
                              clusterLabel={customerDetail.customer_snapshot?.cluster_label || ""}
                              clusterId={advisorStrategy.profile_summary?.customer_profile?.cluster_id}
                              aiReasoning={
                                manuallySelectedService ? {
                                  short_reasoning: manuallySelectedService.description || "Service selected by advisor",
                                  detailed_reasoning: manuallySelectedService.description || "",
                                  key_benefits: manuallySelectedService.key_benefits || [],
                                } : (advisorStrategy.recommendations[0] ? {
                                  short_reasoning: advisorStrategy.recommendations[0].short_reasoning,
                                  detailed_reasoning: advisorStrategy.recommendations[0].detailed_reasoning,
                                  key_benefits: advisorStrategy.recommendations[0].key_benefits,
                                } : null)
                              }
                              onSend={(message) => {
                                console.log("Message ready to send:", message);
                                // Handle send action
                              }}
                              onSave={(message) => {
                                console.log("Message saved:", message);
                                // Handle save action
                              }}
                            />
                          </div>
                        )}

                        {/* Scripts / What to Say - Fallback */}
                        {customerDetail.draft_message && !advisorStrategy && (
                          <div style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "20px",
                          }}>
                            <div style={{ 
                              fontSize: "14px", 
                              fontWeight: 600, 
                              color: "white",
                              marginBottom: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}>
                              <MessageSquare size={16} />
                              What to Say
                            </div>
                            <div style={{ 
                              fontSize: "12px", 
                              color: "rgba(255, 255, 255, 0.8)",
                              lineHeight: "1.6",
                              fontStyle: "italic",
                            }}>
                              {customerDetail.draft_message}
                            </div>
                          </div>
                        )}

                        {/* AI-Augmented Messaging */}
                        {customerDetail && customerDetail.recommended_service && (
                          <div style={{ 
                            marginTop: "20px",
                            minHeight: "400px",
                          }}>
                            <ErrorBoundary>
                              <AIMessageComposer
                              key={`${selectedCustomer}-${customerDetail.recommended_service?.product_code || 'default'}`}
                              customerName={customerDetail.customer_snapshot?.customer_name || selectedCustomer || "Customer"}
                              customerId={customerDetail.customer_snapshot?.customer_id || selectedCustomer || ""}
                              productName={customerDetail.recommended_service?.product_code || ""}
                              productCode={customerDetail.recommended_service?.product_code || ""}
                              clusterLabel={customerDetail.customer_snapshot?.cluster_label || ""}
                              clusterId={customerDetail.customer_snapshot?.cluster_id || null}
                            onSend={(draft, compliancePassed) => {
                              if (compliancePassed) {
                                const customer = customerOpportunities.find(c => c.customer_id === selectedCustomer);
                                const recommendationId = customer?.topRecommendation?.id || 
                                                        customerDetail?.recommended_service?.id ||
                                                        null;
                                if (recommendationId) {
                                  handleSendEmail(selectedCustomer, recommendationId, draft);
                                } else {
                                  alert("Unable to find recommendation ID. Please try again.");
                                }
                              } else {
                                alert("Please ensure compliance requirements are met before sending.");
                              }
                            }}
                            onSave={(draft, examples, saveAsDefault) => {
                              // Save draft and examples to backend - to be implemented
                              if (saveAsDefault) {
                                // Save to user preferences
                                localStorage.setItem('wellbank_ai_examples', JSON.stringify(examples));
                              }
                            }}
                            />
                            </ErrorBoundary>
                          </div>
                        )}

                        {/* Additional Action Buttons */}
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          marginTop: "20px",
                        }}>
                          <button
                            onClick={() => {
                              const customer = customerOpportunities.find(c => c.customer_id === selectedCustomer);
                              if (customer?.topRecommendation) {
                                handleScheduleCall(selectedCustomer, customer.topRecommendation.id);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "12px",
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "10px",
                              color: "white",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <Calendar size={16} />
                            Schedule Call
                          </button>
                          <button
                            onClick={() => {
                              const customer = customerOpportunities.find(c => c.customer_id === selectedCustomer);
                              if (customer?.topRecommendation) {
                                handleDismiss(selectedCustomer, customer.topRecommendation.id);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "12px",
                              background: "rgba(239, 68, 68, 0.2)",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              borderRadius: "10px",
                              color: "#fca5a5",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <ThumbsDown size={16} />
                            Not Interested
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.7)" }}>
                        <AlertCircle size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                        <div>No details available</div>
                      </div>
                    )}
                  </aside>
                )}
              </div>
    </EmployeeLayout>
  );
}
