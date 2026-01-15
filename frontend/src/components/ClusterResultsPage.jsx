import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Users,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Settings,
  Sparkles,
  PieChart,
  Target,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Info,
  Send,
  X,
  Eye,
  RefreshCw,
  HelpCircle,
  Shield,
  TrendingDown,
  Download,
  Filter,
  Search,
  BarChart,
  Activity,
  Zap,
  Award,
  TrendingUp as TrendingUpIcon,
  Globe,
  Home,
  Briefcase,
  PiggyBank,
  ArrowRight as ArrowRightIcon,
  Lightbulb,
  TrendingDown as TrendingDownIcon,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import RecommendationModalEnhanced from "./RecommendationModalEnhanced";
import { getBatchRuns, getClusterSummary, getClusterCustomers, getClusterRecommendations, getClusterComparison } from "../api/clusters";
import "./LoginPage.css";
import "./EmployeeDashboard.css";
import backgroundImage from "../assets/Dashboard.png";

// Strategic Business Personas - Manager-Friendly Names
const CLUSTER_PERSONAS = {
  0: { 
    name: "Silver Savers", 
    subtitle: "High Balance, Low Activity",
    color: "#3b82f6", 
    icon: PiggyBank, 
    description: "High savings focus, conservative spending patterns",
    suggestedProducts: ["Wealth Management", "Premium Savings", "Investment Portfolios"],
    characteristics: {
      balance: 85,
      transactions: 25,
      savings: 90,
      investment: 70,
      debt: 15,
      age: 55,
    }
  },
  1: { 
    name: "Digital Nomads", 
    subtitle: "High Tech, Global Transactions",
    color: "#8b5cf6", 
    icon: Globe, 
    description: "Frequent digital transactions, international activity",
    suggestedProducts: ["Premium Debit", "International Cards", "Digital Banking"],
    characteristics: {
      balance: 45,
      transactions: 95,
      savings: 30,
      investment: 40,
      debt: 50,
      age: 32,
    }
  },
  2: { 
    name: "The Foundation", 
    subtitle: "Young Professionals Building Wealth",
    color: "#10b981", 
    icon: TrendingUpIcon, 
    description: "Steady income, growing savings, building financial foundation",
    suggestedProducts: ["Personal Loans", "Savings Plans", "Credit Building"],
    characteristics: {
      balance: 40,
      transactions: 60,
      savings: 55,
      investment: 35,
      debt: 45,
      age: 28,
    }
  },
  3: { 
    name: "Family Anchors", 
    subtitle: "Stable Income, Home-Focused",
    color: "#f59e0b", 
    icon: Home, 
    description: "Family-oriented spending, home-related financial needs",
    suggestedProducts: ["Mortgages", "Home Insurance", "Family Plans"],
    characteristics: {
      balance: 60,
      transactions: 50,
      savings: 65,
      investment: 50,
      debt: 70,
      age: 42,
    }
  },
  4: { 
    name: "Portfolio Builders", 
    subtitle: "Investment-Focused, Diversified",
    color: "#ec4899", 
    icon: Award, 
    description: "Diverse portfolio, investment-oriented, high-value customers",
    suggestedProducts: ["Investment Funds", "Premium Services", "Wealth Advisory"],
    characteristics: {
      balance: 90,
      transactions: 70,
      savings: 75,
      investment: 95,
      debt: 30,
      age: 48,
    }
  },
  5: { 
    name: "Essential Users", 
    subtitle: "Basic Banking Needs",
    color: "#64748b", 
    icon: User, 
    description: "Standard banking services, minimal product usage",
    suggestedProducts: ["Basic Checking", "Standard Accounts", "Essential Services"],
    characteristics: {
      balance: 30,
      transactions: 40,
      savings: 35,
      investment: 20,
      debt: 25,
      age: 38,
    }
  },
};

// Radar Chart Component
function RadarChart({ data, size = 200 }) {
  const center = size / 2;
  const radius = size * 0.35;
  const axes = Object.keys(data);
  const maxValue = 100;
  
  // Calculate points for the polygon
  const points = axes.map((key, index) => {
    const angle = (index * 2 * Math.PI) / axes.length - Math.PI / 2;
    const value = data[key] || 0;
    const distance = (value / maxValue) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y, label: key, value };
  });

  // Create path for the polygon
  const pathData = points.map(p => `${p.x},${p.y}`).join(' ');

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
      {axes.map((_, index) => {
        const angle = (index * 2 * Math.PI) / axes.length - Math.PI / 2;
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

      {/* Data polygon */}
      <polygon
        points={pathData}
        fill="rgba(79, 216, 235, 0.2)"
        stroke="#4fd8eb"
        strokeWidth="2"
      />

      {/* Data points and labels */}
      {points.map((point, index) => {
        const angle = (index * 2 * Math.PI) / axes.length - Math.PI / 2;
        const labelRadius = radius + 25;
        const labelX = center + labelRadius * Math.cos(angle);
        const labelY = center + labelRadius * Math.sin(angle);
        
        return (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#4fd8eb"
            />
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
            <text
              x={point.x}
              y={point.y - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#4fd8eb"
              fontSize="11"
              fontWeight="700"
            >
              {point.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Pie Chart Component for Market Composition
function MarketCompositionChart({ clusters, total }) {
  const size = 280;
  const center = size / 2;
  const radius = size * 0.35;
  let currentAngle = -Math.PI / 2;

  if (!clusters || !Array.isArray(clusters) || clusters.length === 0) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255, 255, 255, 0.6)" }}>
        No data available
      </div>
    );
  }

  const segments = clusters.map((cluster) => {
    if (!cluster || cluster.cluster_id === null || cluster.cluster_id === undefined) {
      return null;
    }
    const persona = CLUSTER_PERSONAS[cluster.cluster_id] || CLUSTER_PERSONAS[5];
    const percentage = total > 0 && cluster.customer_count ? (cluster.customer_count / total) * 100 : 0;
    const angle = (percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    currentAngle = endAngle;

    return {
      pathData,
      percentage,
      persona,
      cluster,
      midAngle: startAngle + angle / 2,
    };
  }).filter(segment => segment !== null);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={segment.pathData}
              fill={segment.persona.color}
              opacity="0.8"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="2"
            />
            {/* Percentage labels */}
            {segment.percentage > 5 && (
              <text
                x={center + (radius * 0.6) * Math.cos(segment.midAngle)}
                y={center + (radius * 0.6) * Math.sin(segment.midAngle)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="12"
                fontWeight="700"
              >
                {segment.percentage.toFixed(1)}%
              </text>
            )}
          </g>
        ))}
      </svg>
      {/* Center circle */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ fontSize: "20px", fontWeight: 800, color: "white" }}>
          {total}
        </div>
        <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.7)" }}>
          Customers
        </div>
      </div>
    </div>
  );
}

export default function ClusterResultsPage({ onNavigate, onBack }) {
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runs, setRuns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [comparison, setComparison] = useState(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("revenue");
    const [nbaIndex, setNbaIndex] = useState(0);

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    if (runs.length === 0 && !error) {
      const interval = setInterval(() => {
        loadRuns();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [runs.length, error]);

  useEffect(() => {
    if (selectedRunId) {
      loadSummary(selectedRunId);
      loadCustomers(selectedRunId);
      loadRecommendations(selectedRunId);
      loadComparison(selectedRunId);
    }
  }, [selectedRunId]);

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

  async function loadSummary(runId) {
    try {
      setIsLoading(true);
      setError("");
      const data = await getClusterSummary(runId);
      setSummary(data);
    } catch (err) {
      setError(`Failed to load summary: ${err.message}`);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCustomers(runId, clusterId = null) {
    try {
      const data = await getClusterCustomers(runId, clusterId, 100);
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  }

  async function loadRecommendations(runId) {
    try {
      const data = await getClusterRecommendations(runId, 100);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setRecommendations([]);
    }
  }

  async function loadComparison(runId) {
    try {
      const data = await getClusterComparison(runId);
      if (data) {
      setComparison(data);
      }
    } catch (err) {
      // Comparison data not available
    }
  }

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

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  // Helper function to parse customer name from CSV or raw data
  function parseCustomerName(data) {
    if (!data) return null;
    // If it's already a formatted name (no commas), return it
    if (typeof data === 'string' && !data.includes(',')) {
      return data;
    }
    // If it's CSV format, parse it
    if (typeof data === 'string' && data.includes(',')) {
      const parts = data.split(',');
      if (parts.length >= 3) {
        // Format: ID,Last,First,...
        const lastName = parts[1]?.trim() || '';
        const firstName = parts[2]?.trim() || '';
        return `${firstName} ${lastName}`.trim() || parts[0]?.trim() || null;
      }
    }
    return data;
  }

  // Helper function to format product codes to display names (case-insensitive)
  function formatProductName(productCode) {
    if (!productCode) return "Unknown Product";
    
    // Normalize input to uppercase for matching
    const normalizedCode = productCode.toUpperCase().trim();
    
    // Product name mapping (all uppercase keys for case-insensitive matching)
    const productMap = {
      "BASIC_CHECKING": "Daily Flow Account",
      "CCOR602": "MyEnergy Checking Account",
      "CACR432": "AureaCard Exclusive",
      "CACR748": "AureaCard Infinity",
      "CADB439": "ZynaFlow Plus",
      "CADB783": "EasyYoung Pay",
      "CINV819": "SharesVault Investment",
      "CRDT356": "FlexiCredit Line",
      "DPAM682": "WealthPlus Managed Deposit",
      "DPAM234": "SaveSmart Goal Account",
      "DPAM891": "FutureSecure Pension Fund",
      "PRPE771": "Premium Business+ Package",
      "SINV263": "PlannerPro Advisory",
      "BUSINESS_ACCOUNT": "Business Prime Account",
      "MORTGAGE": "DreamHome Mortgage",
      "QUICKCASH": "QuickCash Personal Loan",
      "REWARDS_CREDIT": "Rewards Credit Card",
      "PERSONAL_LOAN": "Personal Loan",
      "MYENERGY": "MyEnergy Digital Account",
    };
    
    // Check if it's a known product code (case-insensitive)
    if (productMap[normalizedCode]) {
      return productMap[normalizedCode];
    }
    
    // Also check original case in case it's already formatted
    if (productMap[productCode]) {
      return productMap[productCode];
    }
    
    // If it's already a display name (contains spaces or is readable), return as is
    if (productCode.includes(' ') || productCode.length > 15) {
      return productCode;
    }
    
    // Otherwise, format the code to be more readable
    return productCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Calculate Next Best Actions
  const nextBestActions = useMemo(() => {
    try {
      if (!summary || !summary.clusters || !Array.isArray(summary.clusters) || !recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        return [];
      }
      
      const actions = [];
      const clusterProductMap = {};
      
      // Group recommendations by cluster and product
      recommendations.forEach(rec => {
        if (!rec || rec.cluster_id === null || rec.cluster_id === undefined) return;
        const clusterId = rec.cluster_id;
        const productCode = rec.product_code;
        if (!productCode) return;
        
        if (!clusterProductMap[clusterId]) {
          clusterProductMap[clusterId] = {};
        }
        if (!clusterProductMap[clusterId][productCode]) {
          clusterProductMap[clusterId][productCode] = {
            count: 0,
            totalRevenue: 0,
            avgProb: 0,
            customers: new Set(),
          };
        }
        clusterProductMap[clusterId][productCode].count++;
        clusterProductMap[clusterId][productCode].totalRevenue += rec.expected_revenue || 0;
        if (rec.customer_id) {
          clusterProductMap[clusterId][productCode].customers.add(rec.customer_id);
        }
        clusterProductMap[clusterId][productCode].avgProb = 
          (clusterProductMap[clusterId][productCode].avgProb * (clusterProductMap[clusterId][productCode].count - 1) + (rec.acceptance_probability || 0)) / 
          clusterProductMap[clusterId][productCode].count;
      });

      // Find opportunities
      summary.clusters.forEach(cluster => {
        if (!cluster || cluster.cluster_id === null || cluster.cluster_id === undefined || !cluster.customer_count) return;
        const persona = CLUSTER_PERSONAS[cluster.cluster_id] || CLUSTER_PERSONAS[5];
        const clusterProducts = clusterProductMap[cluster.cluster_id] || {};
        
        Object.entries(clusterProducts).forEach(([productCode, stats]) => {
          if (!stats || !stats.customers || stats.count === 0) return;
          const ownershipRate = (stats.customers.size / cluster.customer_count) * 100;
          const opportunity = cluster.customer_count - stats.customers.size;
          
          if (opportunity > 0 && stats.avgProb > 0.6) {
            const avgRevenuePerCustomer = stats.totalRevenue / stats.count;
            actions.push({
              clusterId: cluster.cluster_id,
              persona: persona.name,
              productCode,
              opportunity,
              potentialRevenue: stats.avgProb * avgRevenuePerCustomer * opportunity,
              acceptanceRate: stats.avgProb,
              currentOwnership: ownershipRate,
              priority: stats.avgProb * opportunity,
            });
          }
        });
      });

      return actions.sort((a, b) => b.priority - a.priority).slice(0, 10);
    } catch (error) {
      console.error("Error calculating next best actions:", error);
      return [];
    }
  }, [summary, recommendations]);

  // Filter and sort recommendations
  const filteredRecommendations = useMemo(() => {
    if (!recommendations || !Array.isArray(recommendations)) return [];
    return recommendations
      .filter(rec => {
        if (!rec) return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const parsedName = parseCustomerName(rec.customer_name) || '';
  return (
          parsedName.toLowerCase().includes(query) ||
          rec.customer_id?.toLowerCase().includes(query) ||
          rec.product_code?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === "revenue") return (b.expected_revenue || 0) - (a.expected_revenue || 0);
        if (sortBy === "probability") return (b.acceptance_probability || 0) - (a.acceptance_probability || 0);
        return 0;
      });
  }, [recommendations, searchQuery, sortBy]);

  // Calculate cluster statistics
  const clusterStats = useMemo(() => {
    try {
      if (!summary || !summary.clusters || !Array.isArray(summary.clusters)) {
        return [];
      }
      if (!recommendations || !Array.isArray(recommendations)) {
        return summary.clusters.map(cluster => {
          const persona = CLUSTER_PERSONAS[cluster.cluster_id] || CLUSTER_PERSONAS[5];
          return {
            ...cluster,
            persona,
            clusterRevenue: 0,
            avgProb: 0,
            recommendationCount: 0,
          };
        });
      }
      
      return summary.clusters.map(cluster => {
        const persona = CLUSTER_PERSONAS[cluster.cluster_id] || CLUSTER_PERSONAS[5];
        const clusterRecs = recommendations.filter(r => r && r.cluster_id === cluster.cluster_id);
        const clusterRevenue = clusterRecs.reduce((sum, r) => sum + (r.expected_revenue || 0), 0);
        const avgProb = clusterRecs.length > 0
          ? clusterRecs.reduce((sum, r) => sum + (r.acceptance_probability || 0), 0) / clusterRecs.length
          : 0;

        return {
          ...cluster,
          persona,
          clusterRevenue,
          avgProb,
          recommendationCount: clusterRecs.length,
        };
      });
    } catch (error) {
      console.error("Error calculating cluster stats:", error);
      return [];
    }
  }, [summary, recommendations]);


  return (
    <div className="wbd-root">
      <div className="wbd-bg">
        <div 
          className="wbd-bg-img" 
          style={{ backgroundImage: `url(${backgroundImage})` }} 
        />
        
        <div className="wbd-container wbd-container-wide">
          <div className="wbd-glass-container">
          <div className="wb-dashboard" style={{ background: "transparent" }}>
            {/* Main Content Area - Matches Dashboard Layout */}
            <div className="wb-main" style={{ 
              display: "flex", 
              flexDirection: "column", 
              height: "100%", 
              overflow: "hidden",
              background: "transparent"
            }}>
              <div className="wb-main-content wb-main-content-wide" style={{ 
                overflowY: "auto", 
                height: "100%",
                flex: 1,
                width: "100%"
              }}>
                
                {/* Modern Back Button */}
                {(onBack || onNavigate) && (
                  <div style={{ 
                    marginBottom: "24px",
                    position: "relative",
                    zIndex: 10,
                  }}>
                    <button
                      onClick={onBack || (() => onNavigate("dashboard"))}
                      className="wb-back-button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 20px",
                        background: "linear-gradient(135deg, rgba(79, 216, 235, 0.15), rgba(59, 130, 246, 0.1))",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(79, 216, 235, 0.3)",
                        borderRadius: "12px",
                        color: "#4fd8eb",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(79, 216, 235, 0.4)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 216, 235, 0.25), rgba(59, 130, 246, 0.2))";
                        e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.5)";
                        e.currentTarget.style.transform = "translateX(-4px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.15), 0 0 0 4px rgba(79, 216, 235, 0.2)";
                        e.currentTarget.style.color = "#3b82f6";
                        const shine = e.currentTarget.querySelector('.wb-back-shine');
                        if (shine) shine.style.left = "100%";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(79, 216, 235, 0.15), rgba(59, 130, 246, 0.1))";
                        e.currentTarget.style.borderColor = "rgba(79, 216, 235, 0.3)";
                        e.currentTarget.style.transform = "translateX(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(79, 216, 235, 0.4)";
                        e.currentTarget.style.color = "#4fd8eb";
                        const shine = e.currentTarget.querySelector('.wb-back-shine');
                        if (shine) shine.style.left = "-100%";
                      }}
                    >
                      <ArrowLeft 
                        size={18} 
                        style={{
                          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ position: "relative", zIndex: 1 }}>Back to Dashboard</span>
                      <div 
                        className="wb-back-shine"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "-100%",
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                          transition: "left 0.5s ease",
                          pointerEvents: "none",
                        }}
                      />
                    </button>
                  </div>
                )}
                
                {/* Header */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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
                        Strategic Intelligence Dashboard
                      </h1>
                      <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "16px", margin: 0 }}>
                        AI-powered customer segmentation and revenue opportunities
                      </p>
            </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select
              value={selectedRunId || ""}
              onChange={(e) => setSelectedRunId(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                          padding: "10px 16px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                          color: "white",
                          fontSize: "13.5px",
                          cursor: "pointer",
                          backdropFilter: "blur(10px)",
                          minWidth: "250px",
              }}
            >
              {runs.length === 0 ? (
                <option value="">No batch runs available</option>
              ) : (
                <>
                  <option value="">Select a batch run...</option>
                  {runs.map((run) => (
                    <option key={run.run_id} value={run.run_id}>
                                Run #{run.run_id} - {formatDate(run.finished_at || run.started_at)} - {run.status}
                    </option>
                  ))}
                </>
              )}
            </select>
                      <button
                        onClick={loadRuns}
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

                  {/* Tab Navigation */}
                  <div style={{ 
                    display: "flex", 
                    gap: "8px", 
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    overflowX: "auto",
                  }}>
                    {[
                      { id: "overview", label: "Market Intelligence", icon: LayoutDashboard },
                      { id: "segments", label: "Customer Segments", icon: PieChart },
                      { id: "actions", label: "Next Best Actions", icon: Lightbulb },
                      { id: "products", label: "Product Analysis", icon: Target },
                      { id: "customers", label: "Customer Insights", icon: Users },
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            padding: "12px 20px",
                            background: activeTab === tab.id ? "rgba(255, 255, 255, 0.15)" : "transparent",
                            border: "none",
                            borderBottom: activeTab === tab.id ? "2px solid #4fd8eb" : "2px solid transparent",
                            color: "white",
                            fontSize: "13.5px",
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Icon size={16} />
                          {tab.label}
                        </button>
                      );
                    })}
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
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255, 255, 255, 0.7)" }}>
                <RefreshCw size={32} style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ marginTop: "16px" }}>Loading strategic analysis...</p>
            </div>
          )}

          {summary && !isLoading && (
            <>
                {/* MARKET INTELLIGENCE TAB */}
                {activeTab === "overview" && (
                  <div>
              {/* Executive KPIs */}
              <div style={{
                display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "20px",
                      marginBottom: "30px",
                    }}>
                      {[
                        {
                          label: "Total Customers",
                          value: summary.total_customers_processed || 0,
                          icon: Users,
                          color: "#3b82f6",
                          change: comparison?.changes?.customers_percent,
                        },
                        {
                          label: "Market Segments",
                          value: summary.clusters?.length || 0,
                          icon: PieChart,
                          color: "#8b5cf6",
                        },
                        {
                          label: "Revenue Potential",
                          value: formatCurrency(summary.total_expected_revenue || 0),
                          icon: DollarSign,
                          color: "#10b981",
                          change: comparison?.changes?.revenue_percent,
                        },
                        {
                          label: "Acceptance Rate",
                          value: formatPercent(summary.avg_acceptance_probability || 0),
                          icon: TrendingUp,
                          color: "#f59e0b",
                          change: comparison?.changes?.acceptance_prob_percent,
                        },
                      ].map((kpi, idx) => {
                        const Icon = kpi.icon;
                        return (
                          <div
                            key={idx}
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              backdropFilter: "blur(20px)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "24px",
                              color: "white",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                              <div style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background: `linear-gradient(135deg, ${kpi.color}40, ${kpi.color}20)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: kpi.color,
                              }}>
                                <Icon size={24} />
                  </div>
                              {kpi.change !== null && kpi.change !== undefined && (
                <div style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "14px",
                                  color: kpi.change > 0 ? "#10b981" : kpi.change < 0 ? "#ef4444" : "#64748b",
                                }}>
                                  {kpi.change > 0 ? <ArrowUp size={14} /> : kpi.change < 0 ? <ArrowDown size={14} /> : <ArrowRight size={14} />}
                                  {Math.abs(kpi.change).toFixed(1)}%
                                </div>
                    )}
                  </div>
                            <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
                              {kpi.value}
                </div>
                            <div style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.6)" }}>
                              {kpi.label}
                  </div>
                  </div>
                        );
                      })}
                </div>

                    {/* Market Composition & Cluster Overview */}
                <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.5fr",
                      gap: "20px",
                      marginBottom: "30px",
                    }}>
                      {/* Market Composition Pie Chart */}
                      <div style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                        padding: "30px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "white", marginBottom: "20px" }}>
                          Market Composition
                        </h3>
                        <MarketCompositionChart 
                          clusters={summary.clusters || []} 
                          total={summary.total_customers_processed || 0}
                        />
                        <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                          {clusterStats && clusterStats.length > 0 ? clusterStats.slice(0, 6).map((cluster) => {
                            if (!cluster || !cluster.persona) return null;
                            const percentage = summary.total_customers_processed > 0 && cluster.customer_count
                              ? (cluster.customer_count / summary.total_customers_processed) * 100
                              : 0;
                            return (
                              <div
                                key={cluster.cluster_id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "6px 12px",
                                  background: "rgba(255, 255, 255, 0.05)",
                                  borderRadius: "8px",
                                }}
                              >
                                <div style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "3px",
                                  background: cluster.persona.color,
                                }} />
                                <span style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.8)" }}>
                                  {cluster.persona.name}: {percentage.toFixed(1)}%
                      </span>
                  </div>
                            );
                          }) : (
                            <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                              No cluster data available
                  </div>
                    )}
                </div>
              </div>

                      {/* Cluster Overview Cards */}
              <div style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "16px",
                  padding: "24px",
                      }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "white", marginBottom: "20px" }}>
                          Customer Segments Overview
                </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
                          {clusterStats && clusterStats.length > 0 ? clusterStats.map((cluster) => {
                            if (!cluster || !cluster.persona) return null;
                            const PersonaIcon = cluster.persona.icon;
                            const percentage = summary.total_customers_processed > 0 && cluster.customer_count
                              ? (cluster.customer_count / summary.total_customers_processed) * 100
                              : 0;
                            
                            return (
                    <div
                      key={cluster.cluster_id}
                                onClick={() => {
                                  setSelectedCluster(cluster.cluster_id);
                                  setActiveTab("segments");
                                  loadCustomers(selectedRunId, cluster.cluster_id);
                                }}
                      style={{
                        background: selectedCluster === cluster.cluster_id
                                    ? `linear-gradient(135deg, ${cluster.persona.color}30, ${cluster.persona.color}10)`
                                    : "rgba(255, 255, 255, 0.05)",
                                  border: `2px solid ${selectedCluster === cluster.cluster_id ? cluster.persona.color : "rgba(255, 255, 255, 0.1)"}`,
                        borderRadius: "12px",
                                  padding: "16px",
                        cursor: "pointer",
                                  transition: "all 0.3s",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: `linear-gradient(135deg, ${cluster.persona.color}, ${cluster.persona.color}80)`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                  }}>
                                    <PersonaIcon size={20} />
                      </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>
                                      {cluster.persona.name}
                      </div>
                                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                      {cluster.persona.subtitle}
                      </div>
                    </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "20px", fontWeight: 800, color: cluster.persona.color }}>
                                      {cluster.customer_count || 0}
                </div>
                                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                      {percentage.toFixed(1)}%
              </div>
                                  </div>
                                </div>
              <div style={{
                                  marginTop: "12px",
                                  height: "6px",
                                  background: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${Math.min(100, percentage)}%`,
                                    background: `linear-gradient(90deg, ${cluster.persona.color}, ${cluster.persona.color}80)`,
                                    transition: "width 0.3s",
                                  }} />
                        </div>
                        </div>
                            );
                          }) : (
                            <div style={{ textAlign: "center", padding: "20px", color: "rgba(255, 255, 255, 0.6)" }}>
                              No cluster data available
                      </div>
                    )}
                      </div>
                    </div>
                </div>
              </div>
                )}

                {/* CUSTOMER SEGMENTS TAB with Radar Charts */}
                {activeTab === "segments" && (
                  <div>
              <div style={{
                      display: "grid",
                      gridTemplateColumns: selectedCluster !== null ? "1fr 1fr" : "repeat(auto-fit, minmax(350px, 1fr))",
                      gap: "20px",
                      marginBottom: "30px",
                    }}>
                      {clusterStats && clusterStats.length > 0 ? clusterStats.map((cluster) => {
                        if (!cluster || !cluster.persona) return null;
                        const PersonaIcon = cluster.persona.icon;
                        const isSelected = selectedCluster === cluster.cluster_id;
                        
                      return (
                    <div
                      key={cluster.cluster_id}
                      style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              backdropFilter: "blur(20px)",
                              border: `2px solid ${isSelected ? cluster.persona.color : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "16px",
                  padding: "24px",
                        cursor: "pointer",
                              transition: "all 0.3s",
                            }}
                            onClick={() => {
                              setSelectedCluster(isSelected ? null : cluster.cluster_id);
                              loadCustomers(selectedRunId, isSelected ? null : cluster.cluster_id);
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                              <div style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "14px",
                                background: `linear-gradient(135deg, ${cluster.persona.color}, ${cluster.persona.color}80)`,
                          display: "flex",
                          alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                        }}>
                                <PersonaIcon size={28} />
                      </div>
                          <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "20px", fontWeight: 800, color: "white" }}>
                                  {cluster.persona.name}
                              </div>
                                <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                  {cluster.persona.subtitle}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>
                                  {cluster.persona.description}
                                </div>
                              </div>
                            </div>

                            {/* Radar Chart */}
                            {cluster.persona.characteristics && (
                              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", padding: "20px", background: "rgba(0, 0, 0, 0.2)", borderRadius: "12px" }}>
                                <RadarChart data={cluster.persona.characteristics} size={220} />
                              </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                              <div>
                                <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>Customers</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "white" }}>{cluster.customer_count}</div>
                  </div>
                              <div>
                                <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>Revenue Potential</div>
                                <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>
                                  {formatCurrency(cluster.clusterRevenue)}
                  </div>
                </div>
              </div>

              <div style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              borderRadius: "8px",
                              padding: "12px",
                              marginBottom: "12px",
                            }}>
                              <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                                Avg Acceptance Rate
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{
                                  flex: 1,
                                  height: "8px",
                                  background: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                }}>
                                  <div style={{
                                    height: "100%",
                                    width: `${cluster.avgProb * 100}%`,
                                    background: `linear-gradient(90deg, ${cluster.persona.color}, ${cluster.persona.color}80)`,
                                  }} />
                            </div>
                                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "white", minWidth: "50px" }}>
                                  {formatPercent(cluster.avgProb)}
                            </div>
                            </div>
                              </div>

                            <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "8px" }}>
                              Recommended Products:
                          </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {cluster.persona.suggestedProducts.map((product, idx) => (
                                <div
                                  key={idx}
                            style={{
                                    padding: "4px 10px",
                                    background: `linear-gradient(135deg, ${cluster.persona.color}30, ${cluster.persona.color}10)`,
                                    border: `1px solid ${cluster.persona.color}40`,
                                    borderRadius: "6px",
                                    fontSize: "11.5px",
                                    color: cluster.persona.color,
                              fontWeight: 600,
                                  }}
                                >
                                  {product}
                                </div>
                              ))}
                            </div>
                        </div>
                      );
                      }).filter(Boolean) : (
                        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.6)" }}>
                          No cluster data available
                        </div>
                  )}
              </div>

                    {/* Customer List for Selected Cluster */}
                    {selectedCluster !== null && (
              <div style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "16px",
                        padding: "24px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>
                            Customers in {CLUSTER_PERSONAS[selectedCluster]?.name || `Cluster ${selectedCluster}`}
                  </h3>
                    <button
                      onClick={() => {
                        setSelectedCluster(null);
                        loadCustomers(selectedRunId);
                      }}
                      style={{
                        padding: "8px 16px",
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                              color: "white",
                        cursor: "pointer",
                              fontSize: "13.5px",
                      }}
                    >
                      Clear Filter
                    </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                  {customers.map((customer) => (
                            <div
                              key={customer.customer_id}
                              style={{
                                background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                                padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                      <div>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>
                                  {customer.first_name} {customer.last_name}
                        </div>
                                <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                  {customer.customer_id} • {customer.profession || "N/A"} • Income: {formatCurrency(customer.annual_income || 0)}
                        </div>
                      </div>
                      <div style={{
                        padding: "4px 12px",
                                background: `linear-gradient(135deg, ${CLUSTER_PERSONAS[selectedCluster]?.color || "#64748b"}40, ${CLUSTER_PERSONAS[selectedCluster]?.color || "#64748b"}20)`,
                        borderRadius: "6px",
                                fontSize: "14px",
                        fontWeight: 700,
                                color: CLUSTER_PERSONAS[selectedCluster]?.color || "#64748b",
                      }}>
                                {CLUSTER_PERSONAS[selectedCluster]?.name || `Cluster ${customer.cluster_id}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                    )}
                  </div>
          )}

                {/* NEXT BEST ACTIONS TAB - Tinder-style Carousel */}
                {activeTab === "actions" && (
                  <div>
            <div style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      padding: "30px",
                      marginBottom: "20px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <div>
                          <h3 style={{ fontSize: "24px", fontWeight: 800, color: "white", marginBottom: "8px" }}>
                            Next Best Actions
                </h3>
                          <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                            Strategic opportunities to drive revenue and customer engagement
                          </p>
                </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => setNbaIndex(Math.max(0, nbaIndex - 1))}
                            disabled={nbaIndex === 0}
                            style={{
                              padding: "10px",
                              background: nbaIndex === 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "10px",
                              color: "white",
                              cursor: nbaIndex === 0 ? "not-allowed" : "pointer",
                              opacity: nbaIndex === 0 ? 0.5 : 1,
                            }}
                          >
                            <ArrowLeft size={18} />
                          </button>
                          <button
                            onClick={() => setNbaIndex(Math.min(nextBestActions.length - 1, nbaIndex + 1))}
                            disabled={nbaIndex >= nextBestActions.length - 1}
                            style={{
                              padding: "10px",
                              background: nbaIndex >= nextBestActions.length - 1 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "10px",
                              color: "white",
                              cursor: nbaIndex >= nextBestActions.length - 1 ? "not-allowed" : "pointer",
                              opacity: nbaIndex >= nextBestActions.length - 1 ? 0.5 : 1,
                            }}
                          >
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>

                      {nextBestActions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px", color: "rgba(255, 255, 255, 0.6)" }}>
                          <Lightbulb size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                          <div>No actionable opportunities found at this time.</div>
                    </div>
                  ) : (
                        <div style={{ position: "relative", minHeight: "400px" }}>
                          {nextBestActions.map((action, idx) => {
                            const persona = CLUSTER_PERSONAS[action.clusterId] || CLUSTER_PERSONAS[5];
                            const isActive = idx === nbaIndex;
                            
                      return (
                              <div
                                key={idx}
                                style={{
                                  position: isActive ? "relative" : "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  opacity: isActive ? 1 : 0,
                                  transform: isActive ? "scale(1)" : "scale(0.95)",
                                  transition: "all 0.3s",
                                  pointerEvents: isActive ? "auto" : "none",
                                }}
                              >
                                <div style={{
                                  background: `linear-gradient(135deg, ${persona.color}20, rgba(255, 255, 255, 0.08))`,
                                  border: `2px solid ${persona.color}40`,
              borderRadius: "20px",
                padding: "32px",
                                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                                    <div style={{
                                      width: "64px",
                                      height: "64px",
                                      borderRadius: "16px",
                                      background: `linear-gradient(135deg, ${persona.color}, ${persona.color}80)`,
                          display: "flex",
                          alignItems: "center",
                                      justifyContent: "center",
                                      color: "white",
                        }}>
                                      <Lightbulb size={32} />
                                    </div>
                          <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                                        OPPORTUNITY DETECTED
                              </div>
                                      <div style={{ fontSize: "24px", fontWeight: 800, color: "white" }}>
                                        {action.persona} Segment
                                      </div>
                                    </div>
                                    <div style={{
                                      padding: "8px 16px",
                                      background: `linear-gradient(135deg, ${persona.color}40, ${persona.color}20)`,
                                      borderRadius: "10px",
                                      fontSize: "14px",
                                      fontWeight: 700,
                                      color: persona.color,
                                    }}>
                                      {formatPercent(action.acceptanceRate)} Match
                                    </div>
                                  </div>

                                  <div style={{
                                    background: "rgba(0, 0, 0, 0.2)",
                      borderRadius: "12px",
                                    padding: "20px",
                                    marginBottom: "20px",
                                  }}>
                                    <div style={{ fontSize: "16px", fontWeight: 700, color: "white", marginBottom: "12px" }}>
                                      Strategic Insight
                            </div>
                                    <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.6" }}>
                                      The <strong style={{ color: persona.color }}>{action.persona}</strong> segment has a{" "}
                                      <strong style={{ color: "#10b981" }}>{formatPercent(action.acceptanceRate)}</strong> acceptance rate for{" "}
                                      <strong>{formatProductName(action.productCode)}</strong>, but only{" "}
                                      <strong style={{ color: "#f59e0b" }}>{action.currentOwnership.toFixed(1)}%</strong> currently own this product.
                            </div>
                            </div>

                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                                    <div>
                                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                                        Opportunity Size
                                      </div>
                                      <div style={{ fontSize: "24px", fontWeight: 800, color: persona.color }}>
                                        {action.opportunity}
                                      </div>
                                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                                        potential customers
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                                        Revenue Potential
                                      </div>
                                      <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981" }}>
                                        {formatCurrency(action.potentialRevenue)}
                                      </div>
                                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                                        estimated value
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                                        Current Penetration
                                      </div>
                                      <div style={{ fontSize: "24px", fontWeight: 800, color: "#f59e0b" }}>
                                        {action.currentOwnership.toFixed(1)}%
                                      </div>
                                      <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                                        market share
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{
                                    background: "rgba(16, 185, 129, 0.1)",
                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                    borderRadius: "12px",
                                    padding: "16px",
                      display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}>
                                    <ArrowRightIcon size={20} color="#10b981" />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#10b981", marginBottom: "4px" }}>
                                        Recommended Action
                                      </div>
                                      <div style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.8)" }}>
                                        Launch targeted campaign for <strong>{formatProductName(action.productCode)}</strong> to {action.opportunity} customers in the {action.persona} segment
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                              </div>
                            )}

                      {/* Action Counter */}
                      <div style={{ marginTop: "20px", textAlign: "center", color: "rgba(255, 255, 255, 0.6)", fontSize: "16px" }}>
                        Action {nbaIndex + 1} of {nextBestActions.length}
                          </div>
                    </div>
                  </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === "products" && (
                      <div>
                    <div style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      padding: "24px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "white" }}>
                          Product Recommendations Analysis
                        </h3>
                        <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                              padding: "12px 36px 12px 14px",
                              background: "rgba(255, 255, 255, 0.12)",
                              backdropFilter: "blur(10px)",
                              border: "1.5px solid rgba(255, 255, 255, 0.25)",
                              borderRadius: "10px",
                              color: "#F8FAFC",
                              fontSize: "14px",
                              fontWeight: 500,
                              cursor: "pointer",
                              outline: "none",
                              appearance: "none",
                              WebkitAppearance: "none",
                              MozAppearance: "none",
                              transition: "all 0.2s ease",
                              minWidth: "180px",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#4fd8eb";
                              e.target.style.boxShadow = "0 0 0 3px rgba(79, 216, 235, 0.15)";
                              e.target.style.background = "rgba(255, 255, 255, 0.15)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.25)";
                              e.target.style.boxShadow = "none";
                              e.target.style.background = "rgba(255, 255, 255, 0.12)";
                            }}
                          >
                            <option value="revenue" style={{ 
                              background: "#1e293b", 
                              color: "#F8FAFC",
                              padding: "12px",
                            }}>
                              Sort by Revenue
                            </option>
                            <option value="probability" style={{ 
                              background: "#1e293b", 
                              color: "#F8FAFC",
                              padding: "12px",
                            }}>
                              Sort by Acceptance Rate
                            </option>
                          </select>
                          <ChevronDown 
                            size={18} 
                            style={{ 
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                              color: "rgba(255, 255, 255, 0.5)",
                              transition: "color 0.2s ease",
                            }} 
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                        {summary.products?.map((product) => {
                          const productRecs = recommendations.filter(r => r.product_code === product.product_code);
                          const clusterBreakdown = {};
                          productRecs.forEach(rec => {
                            const clusterId = rec.cluster_id;
                            if (!clusterBreakdown[clusterId]) {
                              clusterBreakdown[clusterId] = 0;
                            }
                            clusterBreakdown[clusterId]++;
                          });

                          return (
                            <div
                              key={product.product_code}
                              style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "12px",
                                padding: "20px",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                              }}
                            >
                              <div style={{ fontSize: "20px", fontWeight: 700, color: "white", marginBottom: "12px" }}>
                          {formatProductName(product.product_code)}
                        </div>
                              <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981", marginBottom: "16px" }}>
                                {formatCurrency(product.total_expected_revenue || 0)}
                        </div>
                              <div style={{ marginBottom: "12px" }}>
                                <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                                  Acceptance Rate
                      </div>
                                <div style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>
                                  {formatPercent(product.avg_acceptance_probability)}
                      </div>
                    </div>
                              <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                {product.recommendation_count} recommendations across {Object.keys(clusterBreakdown).length} segments
                </div>
              </div>
                      );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOMERS TAB */}
                {activeTab === "customers" && (
                  <div>
              <div style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "20px",
                    }}>
                      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255, 255, 255, 0.5)" }} />
                          <input
                            type="text"
                            placeholder="Search customers by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "12px 12px 12px 40px",
                              background: "rgba(255, 255, 255, 0.1)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: "10px",
                              color: "white",
                              fontSize: "14px",
                            }}
                          />
                </div>
                        <div style={{ position: "relative" }}>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                              padding: "12px 36px 12px 14px",
                              background: "rgba(255, 255, 255, 0.12)",
                              backdropFilter: "blur(10px)",
                              border: "1.5px solid rgba(255, 255, 255, 0.25)",
                              borderRadius: "10px",
                              color: "#F8FAFC",
                              fontSize: "14px",
                              fontWeight: 500,
                              cursor: "pointer",
                              outline: "none",
                              appearance: "none",
                              WebkitAppearance: "none",
                              MozAppearance: "none",
                              transition: "all 0.2s ease",
                              minWidth: "180px",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#4fd8eb";
                              e.target.style.boxShadow = "0 0 0 3px rgba(79, 216, 235, 0.15)";
                              e.target.style.background = "rgba(255, 255, 255, 0.15)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.25)";
                              e.target.style.boxShadow = "none";
                              e.target.style.background = "rgba(255, 255, 255, 0.12)";
                            }}
                          >
                            <option value="revenue" style={{ 
                              background: "#1e293b", 
                              color: "#F8FAFC",
                              padding: "12px",
                            }}>
                              Sort by Revenue
                            </option>
                            <option value="probability" style={{ 
                              background: "#1e293b", 
                              color: "#F8FAFC",
                              padding: "12px",
                            }}>
                              Sort by Acceptance
                            </option>
                          </select>
                          <ChevronDown 
                            size={18} 
                            style={{ 
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                              color: "rgba(255, 255, 255, 0.5)",
                              transition: "color 0.2s ease",
                            }} 
                          />
                        </div>
              </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "500px", overflowY: "auto" }}>
                        {filteredRecommendations.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.6)" }}>
                            No recommendations found
                    </div>
                  ) : (
                          filteredRecommendations.map((rec) => {
                            const persona = CLUSTER_PERSONAS[rec.cluster_id] || CLUSTER_PERSONAS[5];
                      return (
                              <div
                                key={rec.id}
                                style={{
                                  background: "rgba(255, 255, 255, 0.05)",
                          borderRadius: "12px",
                                  padding: "16px",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onClick={() => setSelectedRecommendationId(rec.id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                      <div style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>
                                {parseCustomerName(rec.customer_name) || rec.customer_id}
                              </div>
              <div style={{
                                        padding: "4px 10px",
                                        background: `linear-gradient(135deg, ${persona.color}40, ${persona.color}20)`,
                                        borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: 600,
                                        color: persona.color,
                                      }}>
                                        {persona.name}
                                      </div>
                                      {rec.status && (
                                        <div style={{
                                          padding: "4px 10px",
                                          background: rec.status === "sent" ? "rgba(16, 185, 129, 0.2)" : rec.status === "dismissed" ? "rgba(239, 68, 68, 0.2)" : "rgba(100, 116, 139, 0.2)",
                                          borderRadius: "6px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                          color: rec.status === "sent" ? "#10b981" : rec.status === "dismissed" ? "#ef4444" : "#64748b",
                                }}>
                                          {rec.status.toUpperCase()}
                                        </div>
                              )}
                            </div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#4fd8eb", marginBottom: "4px" }}>
                              {formatProductName(rec.product_code)}
                            </div>
                                    <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                                      Acceptance: {formatPercent(rec.acceptance_probability)} • 
                                      Revenue: {formatCurrency(rec.expected_revenue || 0)} • 
                                      Income: {formatCurrency(rec.customer_income || 0)}
                            </div>
                          </div>
                          <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRecommendationId(rec.id);
                      }}
                            style={{
                              padding: "8px 16px",
                                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                              border: "none",
                              borderRadius: "8px",
                                      color: "white",
                              fontSize: "16px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <Eye size={14} />
                                    View
                          </button>
                </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
                </div>
                )}
            </>
          )}

            {!summary && !isLoading && selectedRunId && runs.length > 0 && (
            <div style={{
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
              padding: "40px",
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.7)",
              }}>
                <AlertCircle size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                <div style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "8px" }}>
                No Results Found
              </div>
                <div>
                This batch run doesn't have any cluster data yet. The processing may have failed or the data hasn't been saved.
              </div>
            </div>
          )}

            {!summary && !isLoading && runs.length === 0 && (
            <div style={{
                background: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
              padding: "40px",
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.7)",
              }}>
                <PieChart size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                <div style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "8px" }}>
                No Batch Runs Found
              </div>
                <div style={{ marginBottom: "24px" }}>
                You need to run batch processing first to see cluster results.
              </div>
              <button
                onClick={() => onNavigate("batch")}
                style={{
                  padding: "12px 24px",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  border: "none",
                  borderRadius: "12px",
                    color: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Go to Batch Processing
              </button>
            </div>
          )}
        </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Recommendation Modal */}
      {selectedRecommendationId && (
        <RecommendationModalEnhanced
          recommendationId={selectedRecommendationId}
          onClose={() => {
            setSelectedRecommendationId(null);
            if (selectedRunId) {
              loadRecommendations(selectedRunId);
            }
          }}
          onUpdate={() => {
            if (selectedRunId) {
              loadRecommendations(selectedRunId);
              loadSummary(selectedRunId);
            }
          }}
        />
      )}
    </div>
  );
}
