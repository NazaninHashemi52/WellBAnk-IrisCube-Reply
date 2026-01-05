import React, { useState, useEffect } from "react";
import "./LandingPage.css";
import backgroundImage from "../assets/best.png"; 
import { 
  FiShield, 
  FiCpu, 
  FiUsers, 
  FiPieChart, 
  FiLogIn,
  FiTrendingUp,
  FiTarget,
  FiZap,
  FiBarChart2,
  FiCheckCircle,
  FiArrowRight
} from "react-icons/fi";

export default function LandingPage({ onNavigate }) {
  const [animatedStats, setAnimatedStats] = useState({
    customers: 0,
    clusters: 0,
    accuracy: 0,
    recommendations: 0,
  });

  const handleLoginClick = () => {
    if (onNavigate) {
      onNavigate("login");
    }
  };

  // Animate statistics on mount
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      customers: 50000,
      clusters: 8,
      accuracy: 94,
      recommendations: 12000,
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(currentStep / steps, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Easing function

      setAnimatedStats({
        customers: Math.floor(targets.customers * easeOut),
        clusters: Math.floor(targets.clusters * easeOut),
        accuracy: Math.floor(targets.accuracy * easeOut),
        recommendations: Math.floor(targets.recommendations * easeOut),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="wbl-root">
      {/* Background Floating Orbs */}
      <div className="wbl-icon-orb orb-1" />
      <div className="wbl-icon-orb orb-2" />
      <div className="wbl-icon-orb orb-3" />

      {/* Main Container */}
      <div className="wbl-bg">
        {/* Background Image Layer */}
        <div 
          className="wbl-bg-img" 
          style={{ backgroundImage: `url(${backgroundImage})` }} 
        />
        
        {/* --- TOP NAVIGATION AREA --- */}
        <div className="wbl-nav-overlay">
          <div className="wbl-top-nav">
            <div className="wbl-logo-text"></div>
            <button 
              className="wbl-login-btn" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLoginClick();
              }}
              type="button"
            >
              <span>Login</span>
              <FiLogIn className="login-icon" />
            </button>
          </div>
        </div>

        {/* --- HERO SECTION --- */}
        <div className="wbl-hero-section">
          <div className="wbl-hero-content">
            
            <h1 className="wbl-hero-title">
              Transform Customer Insights into
              <span className="wbl-hero-highlight"> Actionable Opportunities</span>
            </h1>
            <p className="wbl-hero-description">
              WellBank empowers your team with advanced customer segmentation, AI-augmentation and Machine Learning-driven service recommendations. Make data-driven decisions that drive 
              revenue and enhance customer relationships.
            </p>
            <div className="wbl-hero-cta">
              <button 
                className="wbl-cta-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLoginClick();
                }}
              >
                Get Started
                <FiArrowRight />
              </button>
              <button className="wbl-cta-secondary">
                Watch Demo
              </button>
            </div>
          </div>
        </div>

      

        {/* --- FEATURES SECTION --- */}
        <div className="wbl-features-section">
          <div className="wbl-section-header">
            <div className="wbl-pill">Powered by AI Augmentation & Machine Learning</div>
           
          </div>
          
          <div className="wbl-services-grid">
            <ServiceCard 
              icon={<FiUsers />} 
              title="Intelligent Customer Clustering" 
              //scription="Automatically segment customers into meaningful groups using advanced ML algorithms. Identify patterns, behaviors, and opportunities across your entire customer base."
              features={["K-Means Clustering", "Behavioral Analysis", "Real-time Updates"]}
            />
            <ServiceCard 
              icon={<FiCpu />} 
              title="AI-Powered Recommendations" 
              //scription="Get personalized service suggestions for each customer based on their profile, transaction history, and cluster characteristics. Boost conversion rates with data-driven insights."
              features={["Predictive Modeling", "Revenue Optimization", "Risk Assessment"]}
            />
            <ServiceCard 
              icon={<FiPieChart />} 
              title="Advanced Analytics & Reporting" 
              //scription="Comprehensive dashboards and reports that provide deep insights into customer segments, recommendation performance, and revenue opportunities."
              features={["Interactive Dashboards", "Custom Reports", "Export Capabilities"]}
            />
            <ServiceCard 
              icon={<FiShield />} 
              title="Bank-Grade Security & Compliance" 
              //scription="Enterprise-level security with end-to-end encryption, audit trails, and compliance checks. Your data and customer information are protected at every step."
              features={["SOC 2 Compliant", "Data Encryption", "Access Controls"]}
            />
          </div>
        </div>

        {/* --- TRUST INDICATORS --- */}
        <div className="wbl-trust-section">
          <div className="wbl-trust-item">
            <FiCheckCircle />
            <span>Enterprise Security</span>
          </div>
          <div className="wbl-trust-item">
            <FiCheckCircle />
            <span>99.9% Uptime</span>
          </div>
          <div className="wbl-trust-item">
            <FiCheckCircle />
            <span>24/7 Support</span>
          </div>
          <div className="wbl-trust-item">
            <FiCheckCircle />
            <span>GDPR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, suffix = "" }) {
  return (
    <div className="wbl-stat-card">
      <div className="wbl-stat-icon">{icon}</div>
      <div className="wbl-stat-value">
        {value}{suffix}
      </div>
      <div className="wbl-stat-label">{label}</div>
    </div>
  );
}

function ServiceCard({ icon, title, description, features }) {
  return (
    <div className="wbl-card">
      <div className="wbl-card-header">
        <div className="wbl-card-icon">{icon}</div>
        <h3>{title}</h3>
      </div>
      <div className="wbl-card-body">
        <p>{description}</p>
        <ul className="wbl-card-features">
          {features.map((feature, idx) => (
            <li key={idx}>
              <FiCheckCircle className="feature-check" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}