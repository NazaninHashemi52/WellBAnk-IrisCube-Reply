import React, { useState, useEffect } from "react";
import "./App.css";

// --- REQUIRED COMPONENTS ---
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployeeDatasetsPage from "./components/EmployeeDatasetsPage";
import BatchProcessingPage from "./components/BatchProcessingPage";
import ClusterResultsPage from "./components/ClusterResultsPage";
import ServiceSuggestionsPage from "./components/ServiceSuggestionsPage";

// Placeholder components for unused features
const EmployeeShell = ({ children }) => <div>{children}</div>;
const AdvisorShell = ({ children }) => <div>{children}</div>;

export default function App() {
  console.log('🚀 App component rendering...');
  
  const [currentPage, setCurrentPage] = useState("landing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [area, setArea] = useState("employee");
  const [pageHistory, setPageHistory] = useState(["landing"]);

  // Navigation states - MUST be declared before debugOverlay uses them
  const [advPage, setAdvPage] = useState("home");
  const [empPage, setEmpPage] = useState("dashboard");
  const [empPageHistory, setEmpPageHistory] = useState(["dashboard"]);
  
  console.log('🚀 App state - currentPage:', currentPage, 'isAuthenticated:', isAuthenticated);

  const handleLogin = () => {
    console.log("🔐 Login triggered - setting authentication state");
    setIsAuthenticated(true);
    setCurrentPage("employee");
    setEmpPage("dashboard");
    setEmpPageHistory(["dashboard"]);
    setPageHistory(prev => [...prev, "employee"]);
    console.log("🔐 Login complete - currentPage:", "employee", "empPage:", "dashboard", "isAuthenticated:", true);
    console.log("🔐 Should now render EmployeeDashboard");
  };

  const handleNavigate = (page) => {
    setPageHistory(prev => [...prev, page]);
    setCurrentPage(page);
  };

  const handleBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory];
      newHistory.pop();
      const previousPage = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      setCurrentPage(previousPage);
    } else {
      setCurrentPage("landing");
    }
  };

  const handleBackToLanding = () => {
    setCurrentPage("landing");
    setPageHistory(["landing"]);
  };

  const handleEmployeePageChange = (newPage) => {
    setEmpPageHistory(prev => [...prev, newPage]);
    setEmpPage(newPage);
  };

  const handleEmployeeBack = () => {
    if (empPageHistory.length > 1) {
      const newHistory = [...empPageHistory];
      newHistory.pop();
      setEmpPage(newHistory[newHistory.length - 1]);
      setEmpPageHistory(newHistory);
    } else {
      handleBack();
    }
  };

  // DEBUG: Log state changes
  useEffect(() => {
    console.log("🔄 App state changed - currentPage:", currentPage, "isAuthenticated:", isAuthenticated, "empPage:", empPage);
  }, [currentPage, isAuthenticated, empPage]);

  // CRITICAL: Ensure dashboard renders after login
  useEffect(() => {
    if (isAuthenticated && currentPage === "employee" && empPage === "dashboard") {
      console.log("✅✅✅ Login state confirmed - Dashboard should render NOW!");
    }
  }, [isAuthenticated, currentPage, empPage]);

  // --- RENDERING LOGIC ---
  console.log('🚀 App rendering logic - currentPage:', currentPage);

  if (currentPage === "landing") {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentPage === "login") {
    return <LoginPage onNavigate={handleNavigate} onBack={handleBack} onLogin={handleLogin} />;
  }

  // CRITICAL DEBUG: Log all state values
  console.log("🔍 App.jsx Render Check:");
  console.log("  - currentPage:", currentPage);
  console.log("  - isAuthenticated:", isAuthenticated);
  console.log("  - area:", area);
  console.log("  - empPage:", empPage);
  console.log("  - Condition 1 (currentPage === 'employee'):", currentPage === "employee");
  console.log("  - Condition 2 (isAuthenticated && area === 'employee'):", isAuthenticated && area === "employee");
  console.log("  - Combined condition:", currentPage === "employee" || (isAuthenticated && area === "employee"));

  if (currentPage === "employee" || (isAuthenticated && area === "employee")) {
    console.log("✅✅✅ ENTERED EMPLOYEE AREA BLOCK!");
    console.log("✅ Rendering employee area - currentPage:", currentPage, "empPage:", empPage, "isAuthenticated:", isAuthenticated);
    
    if (empPage === "dashboard") {
      console.log("✅✅✅✅✅ RENDERING DASHBOARD - empPage is 'dashboard'");
      console.log("✅ Creating wrapper div and EmployeeDashboard component");
      
      return (
        <div style={{ 
          width: "100vw", 
          minHeight: "100vh", 
          background: "#0B0E14",
          position: "relative",
          zIndex: 1,
          overflow: "visible",
          display: "block",
          color: "#E2E8F0"
        }}>
          <EmployeeDashboard onBack={handleBackToLanding} onNavigate={handleEmployeePageChange} />
        </div>
      );
    }
    if (empPage === "upload") return <EmployeeDatasetsPage onBack={handleEmployeeBack} onNavigate={handleEmployeePageChange} />;
    if (empPage === "batch") return <BatchProcessingPage onBack={handleEmployeeBack} onNavigate={handleEmployeePageChange} />;
    if (empPage === "results") return <ClusterResultsPage onBack={handleEmployeeBack} onNavigate={handleEmployeePageChange} />;
    if (empPage === "suggestions") return <ServiceSuggestionsPage onBack={handleEmployeeBack} onNavigate={handleEmployeePageChange} />;

    return (
      <EmployeeShell pageKey={empPage} setPageKey={handleEmployeePageChange}>
        <div style={{ padding: "100px", color: "white" }}>
            <h2>Employee Area: {empPage}</h2>
            <button onClick={handleEmployeeBack}>Go Back</button>
        </div>
      </EmployeeShell>
    );
  }

  return (
    <AdvisorShell pageKey={advPage} setPageKey={setAdvPage} onBack={handleBack}>
        <div style={{ padding: "100px", color: "white" }}>
            <h2>Advisor Area</h2>
            <button onClick={() => setArea("employee")}>Switch to Employee</button>
        </div>
    </AdvisorShell>
  );
}