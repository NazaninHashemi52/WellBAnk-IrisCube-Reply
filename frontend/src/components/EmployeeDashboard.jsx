import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Shield,
  Clock,
  Phone,
  Mail,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  TrendingUp as TrendingUpIcon,
  Globe,
  PiggyBank,
  Briefcase,
  Home,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Upload,
  FileCheck,
  PieChart,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";
import { getBatchRuns, getClusterSummary } from "../api/clusters";
import { getPendingRecommendations } from "../api/offers";
import { getLastBatchRun } from "../api/batch";

// Cluster Personas - Matching ClusterResultsPage
const CLUSTER_PERSONAS = {
  0: { 
    name: "Silver Savers", 
    color: "#3b82f6", 
    icon: PiggyBank, 
    description: "High savings focus, conservative spending"
  },
  1: { 
    name: "Digital Nomads", 
    color: "#8b5cf6", 
    icon: Globe, 
    description: "Frequent digital transactions, international activity"
  },
  2: { 
    name: "The Foundation", 
    color: "#10b981", 
    icon: TrendingUpIcon, 
    description: "Young professionals building wealth"
  },
  3: { 
    name: "Family Focused", 
    color: "#f59e0b", 
    icon: Home, 
    description: "Stable income, home-related spending"
  },
  4: { 
    name: "Investment Seekers", 
    color: "#ef4444", 
    icon: Briefcase, 
    description: "Diverse portfolio, investment-oriented"
  },
  5: { 
    name: "Basic Users", 
    color: "#6b7280", 
    icon: Users, 
    description: "Minimal product usage, standard needs"
  },
};

// Enhanced Market Pulse Chart Component with Labels and Details
function MarketPulseChart({ clusters, total }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const size = 320;
  const center = size / 2;
  const radius = size * 0.36;
  const innerRadius = size * 0.20;
  const labelRadius = size * 0.52;
  const containerSize = size + 80;
  let currentAngle = -Math.PI / 2;

  // Animate total number
  useEffect(() => {
    if (total > 0) {
      const duration = 1500;
      const steps = 60;
      const increment = total / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= total) {
          setAnimatedTotal(total);
          clearInterval(timer);
        } else {
          setAnimatedTotal(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [total]);

  if (!clusters || clusters.length === 0) {
    return (
      <div style={{ 
        width: size, 
        height: size, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "16px"
      }}>
        No data
      </div>
    );
  }

  // Enhanced color gradients for modern look
  const enhancedColors = {
    0: { gradient: "linear-gradient(135deg, #3b82f6, #2563eb)", base: "#3b82f6", glow: "#60a5fa" },
    1: { gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)", base: "#8b5cf6", glow: "#a78bfa" },
    2: { gradient: "linear-gradient(135deg, #10b981, #059669)", base: "#10b981", glow: "#34d399" },
    3: { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", base: "#f59e0b", glow: "#fbbf24" },
    4: { gradient: "linear-gradient(135deg, #ef4444, #dc2626)", base: "#ef4444", glow: "#f87171" },
    5: { gradient: "linear-gradient(135deg, #6b7280, #4b5563)", base: "#6b7280", glow: "#9ca3af" },
  };

  const segments = clusters.map((cluster) => {
    const persona = CLUSTER_PERSONAS[cluster.cluster_id] || CLUSTER_PERSONAS[5];
    const percentage = total > 0 ? (cluster.customer_count / total) * 100 : 0;
    const angle = (percentage / 100) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    
    const x1Inner = center + innerRadius * Math.cos(startAngle);
    const y1Inner = center + innerRadius * Math.sin(startAngle);
    const x2Inner = center + innerRadius * Math.cos(endAngle);
    const y2Inner = center + innerRadius * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    
    // Donut chart path (outer arc + inner arc)
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x2Inner} ${y2Inner}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}`,
      'Z'
    ].join(' ');

    currentAngle = endAngle;

    const colorData = enhancedColors[cluster.cluster_id] || enhancedColors[5];
    const isHovered = hoveredSegment === cluster.cluster_id;

    return {
      pathData,
      percentage,
      persona,
      cluster,
      midAngle: startAngle + angle / 2,
      colorData,
      isHovered,
    };
  });

  return (
    <div style={{ width: "100%", overflow: "visible" }}>
      <div style={{ 
        position: "relative", 
        width: containerSize, 
        height: containerSize, 
        margin: "0 auto 24px",
        padding: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`}
          style={{ filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.1))" }}
        >
          <defs>
            {segments.map((segment, index) => {
              const gradientId = `gradient-${segment.cluster.cluster_id}`;
              const colorData = segment.colorData;
              return (
                <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={colorData.base} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={colorData.base} stopOpacity="0.7" />
                </linearGradient>
              );
            })}
          </defs>
          {segments.map((segment, index) => {
            const labelX = center + labelRadius * Math.cos(segment.midAngle);
            const labelY = center + labelRadius * Math.sin(segment.midAngle);
            
            return (
              <g key={index}>
                <path
                  d={segment.pathData}
                  fill={`url(#gradient-${segment.cluster.cluster_id})`}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="2"
                  opacity={segment.isHovered ? "1" : hoveredSegment === null ? "0.9" : "0.5"}
                  style={{
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: segment.isHovered ? "scale(1.08)" : "scale(1)",
                    transformOrigin: `${center}px ${center}px`,
                    filter: segment.isHovered ? `drop-shadow(0 0 15px ${segment.colorData.glow})` : "none",
                  }}
                  onMouseEnter={() => setHoveredSegment(segment.cluster.cluster_id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  cursor="pointer"
                />
                {/* Percentage Label Inside */}
                {segment.percentage > 4 && (
                  <text
                    x={center + ((radius + innerRadius) / 2) * Math.cos(segment.midAngle)}
                    y={center + ((radius + innerRadius) / 2) * Math.sin(segment.midAngle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#F8FAFC"
                    fontSize="12"
                    fontWeight="700"
                    style={{
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.6)",
                      opacity: segment.isHovered || hoveredSegment === null ? "1" : "0.4",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {segment.percentage.toFixed(1)}%
                  </text>
                )}
                {/* Cluster Name Label Outside */}
                <g opacity={segment.isHovered || hoveredSegment === null ? "1" : "0.4"}>
                  <line
                    x1={center + radius * Math.cos(segment.midAngle)}
                    y1={center + radius * Math.sin(segment.midAngle)}
                    x2={labelX}
                    y2={labelY}
                    stroke={segment.colorData.base}
                    strokeWidth="1.5"
                    opacity="0.4"
                    style={{ transition: "opacity 0.2s ease" }}
                  />
                  <circle
                    cx={labelX}
                    cy={labelY}
                    r="22"
                    fill={segment.colorData.base}
                    opacity="0.2"
                    style={{ transition: "all 0.2s ease" }}
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#F8FAFC"
                    fontSize="10"
                    fontWeight="700"
                    style={{
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    {segment.persona.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
        {/* Modern Center Circle with Glass Effect */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%), rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(15px)",
          WebkitBackdropFilter: "blur(15px)",
          border: "2px solid rgba(255, 255, 255, 0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 25px rgba(255, 255, 255, 0.08)",
        }}>
          <div style={{ 
            fontSize: "32px", 
            fontWeight: 800, 
            color: "#F8FAFC", 
            letterSpacing: "-0.03em",
            lineHeight: "1.1",
            textShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
          }}>
            {animatedTotal.toLocaleString()}
          </div>
          <div style={{ 
            fontSize: "11px", 
            color: "#94A3B8",
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            marginTop: "4px",
          }}>
            Customers
          </div>
        </div>
      </div>

      {/* Interactive Legend with Details */}
      <div style={{ marginTop: "20px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "10px",
        }}>
          {segments.map((segment, index) => {
            const PersonaIcon = segment.persona.icon;
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredSegment(segment.cluster.cluster_id)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{
                  background: segment.isHovered 
                    ? `linear-gradient(135deg, ${segment.colorData.base}20, ${segment.colorData.base}10)`
                    : "rgba(255, 255, 255, 0.04)",
                  border: `1.5px solid ${segment.isHovered ? segment.colorData.base + "60" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: segment.isHovered ? "translateX(4px)" : "translateX(0)",
                  boxShadow: segment.isHovered ? `0 4px 12px ${segment.colorData.base}30` : "none",
                }}
              >
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${segment.colorData.base}, ${segment.colorData.base}dd)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: segment.isHovered ? `0 0 12px ${segment.colorData.glow}` : "0 2px 8px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.3s ease",
                }}>
                  <PersonaIcon size={16} style={{ color: "#FFFFFF" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: "13px", 
                    fontWeight: 600, 
                    color: "#F8FAFC",
                    marginBottom: "2px",
                    lineHeight: "1.2",
                  }}>
                    {segment.persona.name}
                  </div>
                  <div style={{ 
                    fontSize: "11px", 
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}>
                    <span>{segment.cluster.customer_count.toLocaleString()} customers</span>
                    <span>•</span>
                    <span>{segment.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDashboard({ onNavigate, onBack }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showClusterDetails, setShowClusterDetails] = useState(false);
  
  // Real-time data states
  const [latestRun, setLatestRun] = useState(null);
  const [clusterSummary, setClusterSummary] = useState(null);
  const [topActions, setTopActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [monthlyGoal, setMonthlyGoal] = useState({ current: 0, target: 100 });

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      
      // Load latest batch run
      const runsData = await getBatchRuns();
      const runs = runsData.runs || [];
      const latest = runs.length > 0 ? runs[0] : null;
      setLatestRun(latest);

      if (latest) {
        // Load cluster summary
        try {
          const summary = await getClusterSummary(latest.run_id);
          setClusterSummary(summary);
        } catch (err) {
          console.error("Failed to load cluster summary:", err);
        }

        // Load top recommendations (Next Best Actions)
        try {
          const recommendations = await getPendingRecommendations('pending', 5, 0);
          setTopActions(recommendations.recommendations || []);
        } catch (err) {
          console.error("Failed to load recommendations:", err);
        }
      }

      // Simulate activity log (in production, this would come from an API)
      setActivityLog([
        { type: "upload", message: "movimenti_dec_2025.csv uploaded by Admin", time: "2 hours ago", icon: Upload },
        { type: "batch", message: "Batch processing completed successfully", time: "3 hours ago", icon: CheckCircle2 },
        { type: "cluster", message: "6 clusters identified in customer base", time: "3 hours ago", icon: PieChart },
        { type: "recommendation", message: "47 new recommendations generated", time: "3 hours ago", icon: Lightbulb },
      ]);

      // Calculate monthly goal progress (mock data - in production from API)
      if (latest) {
        const summary = await getClusterSummary(latest.run_id);
        const totalRecs = summary?.total_recommendations || 0;
        setMonthlyGoal({ current: totalRecs, target: 200 });
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNavClick = (navKey) => {
    setActiveNav(navKey);
    const pageMap = {
      dataset: "upload",
      batch: "batch",
      results: "results",
      suggestions: "suggestions",
      dashboard: "dashboard",
      transactions: "data",
      reports: "report",
      analytics: "data",
      settings: "data",
    };
    if (onNavigate && pageMap[navKey]) {
      onNavigate(pageMap[navKey]);
    }
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalCustomers = clusterSummary?.total_customers_processed || 0;
    const activeClusters = clusterSummary?.clusters?.length || 0;
    const suggestedDeals = topActions.length;
    const goalProgress = monthlyGoal.target > 0 
      ? (monthlyGoal.current / monthlyGoal.target) * 100 
      : 0;

    return {
      totalCustomers,
      activeClusters,
      suggestedDeals,
      goalProgress: Math.min(100, goalProgress),
    };
  }, [clusterSummary, topActions, monthlyGoal]);

  // Calculate engagement scores (mock - in production from backend)
  const engagementScores = useMemo(() => {
    if (!clusterSummary?.clusters) return {};
    const scores = {};
    clusterSummary.clusters.forEach(cluster => {
      // Mock engagement: higher customer count = higher engagement
      const baseScore = 50;
      const customerRatio = cluster.customer_count / (clusterSummary.total_customers_processed || 1);
      scores[cluster.cluster_id] = Math.round(baseScore + (customerRatio * 50));
    });
    return scores;
  }, [clusterSummary]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <EmployeeLayout 
      currentPage="dashboard" 
      onNavigate={onNavigate}
      onBack={onBack}
    >
                {/* Modern Back Button */}
                {onBack && (
                  <div style={{ 
                    marginBottom: "24px",
                    position: "relative",
                    zIndex: 10,
                  }}>
                    <button
                      onClick={onBack}
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

                {/* Header - Narrative Typography */}
                <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h1 style={{ 
                      fontSize: "24px", 
                      fontWeight: 600, 
                      color: "#F8FAFC", 
                      margin: "0 0 6px 0",
                      letterSpacing: "-0.02em",
                      lineHeight: "1.3",
                    }}>
                      Command Center
                    </h1>
                    <p style={{ color: "#94A3B8", fontSize: "16px", margin: 0, lineHeight: "1.5" }}>
                      Real-time insights and actionable opportunities
                    </p>
              </div>
                  <button
                    onClick={loadDashboardData}
                    style={{
                      padding: "10px 16px",
                      background: "#1e40af",
                      border: "none",
                      borderRadius: "12px",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      boxShadow: "0 2px 8px rgba(30, 64, 175, 0.3)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#3b82f6";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 64, 175, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#1e40af";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(30, 64, 175, 0.3)";
                    }}
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
          </div>

                {/* Top Row - KPI Bar - F-Pattern: Money Metrics Top-Left */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(4, 1fr)", 
                  gap: "16px", 
                  marginBottom: "20px" 
                }}>
                  {/* Suggested Deals - MONEY METRIC (Top-Left for F-Pattern) - Glass Card */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>Suggested Deals</div>
                      <Lightbulb size={18} style={{ color: "#94A3B8" }} />
                    </div>
                    {/* Narrative Metric: Label → Number → Context */}
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#F8FAFC", marginBottom: "6px", letterSpacing: "-0.02em", lineHeight: "1.2" }}>
                      {isLoading ? "..." : kpis.suggestedDeals}
                    </div>
                    <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 400 }}>
                      High-priority actions today
                    </div>
          </div>

                  {/* Monthly Goal - MONEY METRIC (Top-Left for F-Pattern) - Glass Card */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>Monthly Goal</div>
                      <Target size={18} style={{ color: "#94A3B8" }} />
                    </div>
                    {/* Narrative Metric: Label → Number → Context */}
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#F8FAFC", marginBottom: "8px", letterSpacing: "-0.02em", lineHeight: "1.2" }}>
                      {isLoading ? "..." : `${kpis.goalProgress.toFixed(0)}%`}
                    </div>
                    <div style={{ 
                      height: "4px", 
                      background: "rgba(255, 255, 255, 0.1)", 
                      borderRadius: "2px",
                      overflow: "hidden",
                      marginTop: "8px"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${kpis.goalProgress}%`,
                        background: "linear-gradient(90deg, #22D3EE, #3B82F6)",
                        transition: "width 0.3s",
                      }} />
                    </div>
            </div>

                  {/* Total Customers - Narrative Metrics - Glass Card */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>Total Customers</div>
                      <Users size={18} style={{ color: "#94A3B8" }} />
              </div>
                    {/* Narrative Metric: Label → Number → Context */}
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#F8FAFC", marginBottom: "6px", letterSpacing: "-0.02em", lineHeight: "1.2" }}>
                      {isLoading ? "..." : kpis.totalCustomers.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 400 }}>
                      {latestRun ? `Updated ${new Date(latestRun.finished_at || latestRun.started_at).toLocaleDateString()}` : "No data available"}
          </div>
        </div>

                  {/* Active Clusters - Narrative Metrics - Glass Card */}
          <div style={{ 
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>Active Clusters</div>
                      <PieChart size={18} style={{ color: "#94A3B8" }} />
                    </div>
                    {/* Narrative Metric: Label → Number → Context */}
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#F8FAFC", marginBottom: "6px", letterSpacing: "-0.02em", lineHeight: "1.2" }}>
                      {isLoading ? "..." : kpis.activeClusters}
                    </div>
                    <div style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 400 }}>
                      Customer segments identified
                    </div>
          </div>
          </div>

                {/* Main Content Grid - Compact */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: "16px", 
                  marginBottom: "16px" 
                }}>
                  {/* Left Column - Market Pulse - Glass Card */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "16px",
                    padding: "20px",
                    maxHeight: "calc(100vh - 320px)",
                    overflowY: "auto",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease",
                  }}>
                    <div style={{ marginBottom: "16px" }}>
                      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#F8FAFC", marginBottom: "6px", lineHeight: "1.3" }}>
                        Market Pulse
                      </h2>
                      <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: "1.5" }}>
                        Customer segmentation & engagement
                      </p>
                    </div>

                    {isLoading ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.6)" }}>
                        Loading...
            </div>
                    ) : clusterSummary?.clusters ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                          <MarketPulseChart 
                            clusters={clusterSummary.clusters} 
                            total={clusterSummary.total_customers_processed || 0}
                          />
          </div>

                        {/* Show More Details Button */}
                        <button
                          onClick={() => setShowClusterDetails(!showClusterDetails)}
                          style={{
                            width: "100%",
                            padding: "14px 18px",
                            background: showClusterDetails 
                              ? "rgba(255, 255, 255, 0.08)" 
                              : "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            borderRadius: "14px",
                            color: "#F8FAFC",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            marginTop: "12px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = showClusterDetails 
                              ? "rgba(255, 255, 255, 0.08)" 
                              : "rgba(255, 255, 255, 0.05)";
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                          }}
                        >
                          <BarChart3 size={16} />
                          <span>{showClusterDetails ? "Hide Cluster Details" : "Show Cluster Details"}</span>
                          {showClusterDetails ? (
                            <ChevronUp size={16} style={{ transition: "transform 0.3s" }} />
                          ) : (
                            <ChevronDown size={16} style={{ transition: "transform 0.3s" }} />
                          )}
                        </button>

                        {/* Beautiful Cluster Details Panel */}
                        {showClusterDetails && (
                          <div style={{
                            marginTop: "16px",
                            padding: "20px",
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "16px",
                            animation: "fadeIn 0.4s ease",
                          }}>
                            <div style={{ 
                              fontSize: "13px", 
                              fontWeight: 600, 
                              color: "#94A3B8",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "20px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}>
                              <BarChart3 size={14} />
                              Cluster Analytics
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                              {clusterSummary.clusters.map((cluster) => {
                                const persona = CLUSTER_PERSONAS[cluster.cluster_id] || CLUSTER_PERSONAS[5];
                                const PersonaIcon = persona.icon;
                                const engagement = engagementScores[cluster.cluster_id] || 50;
                                const percentage = clusterSummary.total_customers_processed > 0
                                  ? (cluster.customer_count / clusterSummary.total_customers_processed) * 100
                                  : 0;

                                // Enhanced color for each cluster
                                const enhancedColors = {
                                  0: { base: "#3b82f6", glow: "#60a5fa" },
                                  1: { base: "#8b5cf6", glow: "#a78bfa" },
                                  2: { base: "#10b981", glow: "#34d399" },
                                  3: { base: "#f59e0b", glow: "#fbbf24" },
                                  4: { base: "#ef4444", glow: "#f87171" },
                                  5: { base: "#6b7280", glow: "#9ca3af" },
                                };
                                const colorData = enhancedColors[cluster.cluster_id] || enhancedColors[5];

                                return (
                                  <div
                                    key={cluster.cluster_id}
                                    style={{
                                      background: `linear-gradient(135deg, ${colorData.base}15, ${colorData.base}05)`,
                                      borderRadius: "16px",
                                      padding: "20px",
                                      border: `1.5px solid ${colorData.base}30`,
                                      position: "relative",
                                      overflow: "hidden",
                                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = "translateY(-4px)";
                                      e.currentTarget.style.borderColor = `${colorData.base}50`;
                                      e.currentTarget.style.boxShadow = `0 8px 24px ${colorData.base}25`;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = "translateY(0)";
                                      e.currentTarget.style.borderColor = `${colorData.base}30`;
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    {/* Decorative gradient circle */}
                                    <div style={{
                                      position: "absolute",
                                      top: "-30px",
                                      right: "-30px",
                                      width: "100px",
                                      height: "100px",
                                      borderRadius: "50%",
                                      background: `radial-gradient(circle, ${colorData.base}20, transparent)`,
                                      opacity: 0.6,
                                    }} />
                                    
                                    {/* Icon and Header */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", position: "relative", zIndex: 1 }}>
                                      <div style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "14px",
                                        background: `linear-gradient(135deg, ${colorData.base}, ${colorData.base}dd)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: `0 4px 12px ${colorData.base}40`,
                                      }}>
                                        <PersonaIcon size={22} style={{ color: "#FFFFFF" }} />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ 
                                          fontSize: "14px", 
                                          fontWeight: 700, 
                                          color: "#F8FAFC",
                                          marginBottom: "2px",
                                        }}>
                                          {persona.name}
                                        </div>
                                        <div style={{ 
                                          fontSize: "11px", 
                                          color: "#94A3B8",
                                        }}>
                                          {persona.description}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", position: "relative", zIndex: 1 }}>
                                      {/* Customer Count */}
                                      <div>
                                        <div style={{ 
                                          fontSize: "11px", 
                                          fontWeight: 600, 
                                          color: "#94A3B8",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                          marginBottom: "6px",
                                        }}>
                                          Customers
                                        </div>
                                        <div style={{ 
                                          fontSize: "24px", 
                                          fontWeight: 800, 
                                          color: "#F8FAFC",
                                          letterSpacing: "-0.02em",
                                          lineHeight: "1.2",
                                        }}>
                                          {cluster.customer_count.toLocaleString()}
                                        </div>
                                        <div style={{ 
                                          fontSize: "12px", 
                                          color: colorData.base,
                                          fontWeight: 600,
                                          marginTop: "4px",
                                        }}>
                                          {percentage.toFixed(1)}% of total
                                        </div>
                                      </div>

                                      {/* Engagement Score */}
                                      <div>
                                        <div style={{ 
                                          fontSize: "11px", 
                                          fontWeight: 600, 
                                          color: "#94A3B8",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                          marginBottom: "6px",
                                        }}>
                                          Engagement
                                        </div>
                                        <div style={{ 
                                          fontSize: "24px", 
                                          fontWeight: 800, 
                                          color: colorData.glow,
                                          letterSpacing: "-0.02em",
                                          lineHeight: "1.2",
                                        }}>
                                          {engagement}%
                                        </div>
                                        {/* Engagement Bar */}
                                        <div style={{
                                          marginTop: "8px",
                                          height: "4px",
                                          background: "rgba(255, 255, 255, 0.1)",
                                          borderRadius: "2px",
                                          overflow: "hidden",
                                        }}>
                                          <div style={{
                                            height: "100%",
                                            width: `${engagement}%`,
                                            background: `linear-gradient(90deg, ${colorData.base}, ${colorData.glow})`,
                                            borderRadius: "2px",
                                            transition: "width 0.5s ease",
                                            boxShadow: `0 0 8px ${colorData.base}50`,
                                          }} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>
                        <AlertCircle size={32} style={{ marginBottom: "12px", opacity: 0.5, color: "#94A3B8" }} />
                        <div style={{ color: "#F8FAFC" }}>No cluster data available</div>
                        <div style={{ fontSize: "14px", marginTop: "8px", color: "#94A3B8" }}>
                          Run batch processing to generate clusters
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Next Best Actions - Glass Card */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    borderRadius: "16px",
                    padding: "20px",
                    maxHeight: "calc(100vh - 320px)",
                    overflowY: "auto",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(255, 255, 255, 0.05)",
                    transition: "all 0.2s ease",
                  }}>
                    <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#F8FAFC", marginBottom: "6px", lineHeight: "1.3" }}>
                          Next Best Actions
                        </h2>
                        <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: "1.5" }}>
                          Priority customers to contact
                        </p>
                      </div>
            <button
                        onClick={() => onNavigate("results")}
                        style={{
                          padding: "8px 14px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "12px",
                          color: "#F8FAFC",
                          fontSize: "14px",
                          cursor: "pointer",
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        View All
            </button>
          </div>

                    {isLoading ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        Loading...
                      </div>
                    ) : topActions.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {topActions.slice(0, 3).map((action, idx) => {
                          const prob = action.acceptance_probability || 0;
                          const revenue = action.expected_revenue || 0;
                          
                          return (
                            <div
                              key={action.id || idx}
                              style={{
                                background: "rgba(255, 255, 255, 0.04)",
                                borderRadius: "14px",
                                padding: "16px",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#F8FAFC", marginBottom: "4px", lineHeight: "1.3" }}>
                                    {action.customer_name || action.customer_id || "Customer"}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#94A3B8", lineHeight: "1.4" }}>
                                    {action.product_code} • {formatPercent(prob)}
                                  </div>
                                </div>
                                <div style={{
                                  padding: "6px 12px",
                                  background: "rgba(255, 255, 255, 0.1)",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  borderRadius: "12px",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#F8FAFC",
                                  marginLeft: "8px",
                                  flexShrink: 0,
                                }}>
                                  {formatPercent(prob)}
            </div>
          </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <div style={{ fontSize: "14px", color: "#94A3B8" }}>
                                  Revenue: <span style={{ color: "#F8FAFC", fontWeight: 500 }}>{formatCurrency(revenue)}</span>
                                </div>
        </div>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  style={{
                                    flex: 1,
                                    padding: "10px",
                                    background: "#1e40af",
                                    border: "none",
                                    borderRadius: "12px",
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    boxShadow: "0 2px 8px rgba(30, 64, 175, 0.3)",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#3b82f6";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(30, 64, 175, 0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#1e40af";
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(30, 64, 175, 0.3)";
                                  }}
                                  onClick={() => onNavigate("results")}
                                >
                                  <Phone size={14} />
                                  Call
              </button>
                                <button
                                  style={{
                                    flex: 1,
                                    padding: "10px",
                                    background: "rgba(255, 255, 255, 0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    borderRadius: "12px",
                                    color: "#F8FAFC",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                  }}
                                  onClick={() => onNavigate("results")}
                                >
                                  <Mail size={14} />
                                  Offer
              </button>
            </div>
          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>
                        <Lightbulb size={32} style={{ marginBottom: "12px", opacity: 0.5, color: "#94A3B8" }} />
                        <div style={{ color: "#F8FAFC" }}>No actions available</div>
                        <div style={{ fontSize: "14px", marginTop: "8px", color: "#94A3B8" }}>
                          Run batch processing to generate recommendations
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row - Activity Log - Glass Card */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.4)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: "16px",
                  padding: "20px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px rgba(255, 255, 255, 0.05)",
                  transition: "all 0.2s ease",
                }}>
                  <div style={{ marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#F8FAFC", marginBottom: "6px", lineHeight: "1.3" }}>
                      Recent Activity
                    </h2>
                    <p style={{ fontSize: "16px", color: "#94A3B8", lineHeight: "1.5" }}>
                      System updates & notifications
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activityLog.slice(0, 4).map((activity, idx) => {
                      const Icon = activity.icon || Activity;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            background: "rgba(255, 255, 255, 0.04)",
                            borderRadius: "14px",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "12px",
                            background: "rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94A3B8",
                            flexShrink: 0,
                          }}>
                            <Icon size={16} />
                </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#F8FAFC", lineHeight: "1.3", marginBottom: "2px" }}>
                              {activity.message}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
    </EmployeeLayout>
  );
}
