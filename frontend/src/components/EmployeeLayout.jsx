import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  User,
  Database,
  Sparkles,
  PieChart,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import "./LoginPage.css";
import "./EmployeeDashboard.css";
import backgroundImage from "../assets/Dashboard.png";

export default function EmployeeLayout({ 
  children, 
  currentPage, 
  onNavigate,
  onBack 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load sidebar state from localStorage
    try {
      const stored = localStorage.getItem('wellbank_sidebar_collapsed');
      return stored === 'true';
    } catch (e) {
      return false;
    }
  });

  // Save sidebar state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wellbank_sidebar_collapsed', sidebarCollapsed.toString());
    } catch (e) {
      console.error('Failed to save sidebar state:', e);
    }
  }, [sidebarCollapsed]);

  const handleNavClick = (pageKey) => {
    if (onNavigate) {
      onNavigate(pageKey);
    }
  };

  const navigationItems = [
    {
      key: "dashboard",
      label: "Command Center",
      icon: LayoutDashboard,
      section: "Main",
    },
    {
      key: "upload",
      label: "Dataset Management",
      icon: Database,
      section: "Data Management",
    },
    {
      key: "batch",
      label: "Batch Processing",
      icon: Sparkles,
      section: "Data Management",
    },
    {
      key: "results",
      label: "Cluster Results",
      icon: PieChart,
      section: "Data Management",
    },
    {
      key: "suggestions",
      label: "Service Suggestions",
      icon: Lightbulb,
      section: "Data Management",
    },
    {
      key: "transactions",
      label: "Transactions",
      icon: CreditCard,
      section: "Financial",
    },
    {
      key: "reports",
      label: "Reports",
      icon: FileText,
      section: "Financial",
    },
    {
      key: "analytics",
      label: "Analytics",
      icon: BarChart3,
      section: "Financial",
    },
    {
      key: "settings",
      label: "Settings",
      icon: Settings,
      section: "System",
    },
  ];

  // Group items by section
  const itemsBySection = navigationItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <div className="wbd-root">
      <div className="wbd-bg">
        {/* Galaxy Glow Effect - Subtle radial gradient (handled by CSS) */}
        
        <div className="wbd-container">
          <div className="wbd-glass-container">
            <div className="wb-dashboard" style={{ background: "transparent" }}>
              {/* Persistent Sidebar */}
              <aside 
                className="wb-sidebar"
                style={{
                  width: sidebarCollapsed ? "80px" : "280px",
                  transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)", /* Fast transition */
                  position: "relative",
                }}
              >
                {/* Collapse Toggle - Always Visible */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: sidebarCollapsed ? "8px" : "8px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(34, 211, 238, 0.15)", /* Electric Cyan tint */
                    border: "1px solid rgba(34, 211, 238, 0.3)",
                    color: "#22D3EE", /* Electric Cyan */
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    zIndex: 100,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(34, 211, 238, 0.2)";
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.4)";
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(34, 211, 238, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(34, 211, 238, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.3)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
                  }}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronLeft size={16} />
                  )}
                </button>

                {/* User Profile */}
                <div className="wb-profile" style={{
                  padding: sidebarCollapsed ? "20px 12px" : "20px",
                  opacity: sidebarCollapsed ? 0 : 1,
                  transition: "opacity 0.2s",
                  pointerEvents: sidebarCollapsed ? "none" : "auto",
                  marginTop: sidebarCollapsed ? "0" : "0",
                }}>
                  <div className="wb-avatar">
                    <User size={24} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="wb-profile-text">
                      <div className="wb-profile-name">Alex Johnson</div>
                      <div className="wb-profile-email">alex.johnson@wellbank.com</div>
                    </div>
                  )}
                </div>

                {/* Navigation Menu */}
                <nav className="wb-nav" style={{
                  paddingTop: sidebarCollapsed ? "60px" : "20px",
                }}>
                  {Object.entries(itemsBySection).map(([section, items]) => (
                    <div key={section} className="wb-nav-section">
                      {!sidebarCollapsed && (
                        <div className="wb-nav-section-title">{section}</div>
                      )}
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.key;
                        
                        return (
                          <button
                            key={item.key}
                            className={`wb-nav-item ${isActive ? "active" : ""}`}
                            onClick={() => handleNavClick(item.key)}
                            title={sidebarCollapsed ? item.label : undefined}
                            style={{
                              position: "relative",
                              padding: sidebarCollapsed ? "12px" : "12px 20px",
                              justifyContent: sidebarCollapsed ? "center" : "flex-start",
                            }}
                          >
                            {/* Active Indicator - Vertical Bar */}
                            {isActive && (
                              <div style={{
                                position: "absolute",
                                left: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "4px",
                                height: "24px",
                                background: "linear-gradient(180deg, #4fd8eb, #3b82f6)",
                                borderRadius: "0 4px 4px 0",
                                boxShadow: "0 0 12px rgba(79, 216, 235, 0.6)",
                              }} />
                            )}
                            
                            {/* Active Glow Background */}
                            {isActive && (
                              <div style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                background: "linear-gradient(90deg, rgba(79, 216, 235, 0.15), rgba(59, 130, 246, 0.1))",
                                borderRadius: "12px",
                                zIndex: -1,
                              }} />
                            )}

                            <Icon size={22} style={{
                              flexShrink: 0,
                              filter: isActive ? "drop-shadow(0 0 4px rgba(79, 216, 235, 0.6))" : "none",
                            }} />
                            {!sidebarCollapsed && (
                              <span style={{
                                marginLeft: "12px",
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? "#4fd8eb" : "inherit",
                              }}>
                                {item.label}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </aside>

              {/* Main Content Area */}
              <main className="wb-main" style={{ 
                flex: 1,
                minWidth: 0,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", /* Fast fade/slide */
              }}>
                <div className="wb-main-content">
                  {/* Modern Back Button - Only show when not on dashboard and onBack is provided */}
                  {onBack && currentPage !== "dashboard" && (
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
                        {/* Animated Arrow Icon */}
                        <ArrowLeft 
                          size={18} 
                          style={{
                            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ position: "relative", zIndex: 1 }}>Back to Dashboard</span>
                        {/* Shine effect on hover */}
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
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

