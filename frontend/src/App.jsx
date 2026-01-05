import React, { useState } from "react";
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
  const [currentPage, setCurrentPage] = useState("landing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [area, setArea] = useState("employee");
  const [pageHistory, setPageHistory] = useState(["landing"]);

  // Navigation states
  const [advPage, setAdvPage] = useState("home");
  const [empPage, setEmpPage] = useState("dashboard");
  const [empPageHistory, setEmpPageHistory] = useState(["dashboard"]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage("employee");
    setEmpPage("dashboard");
    setEmpPageHistory(["dashboard"]);
    setPageHistory(prev => [...prev, "employee"]);
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

  // --- RENDERING LOGIC ---

  if (currentPage === "landing") {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentPage === "login") {
    return <LoginPage onNavigate={handleNavigate} onBack={handleBack} onLogin={handleLogin} />;
  }

  if (currentPage === "employee" || (isAuthenticated && area === "employee")) {
    if (empPage === "dashboard") return <EmployeeDashboard onBack={handleBackToLanding} onNavigate={handleEmployeePageChange} />;
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