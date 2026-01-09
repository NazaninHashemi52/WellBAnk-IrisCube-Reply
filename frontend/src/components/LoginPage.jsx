import React, { useState } from "react";
import "./LoginPage.css";
import backgroundImage from "../assets/Dashboard.png"; 
import { FiMail, FiLock, FiArrowRight, FiArrowLeft, FiInstagram } from "react-icons/fi";
import { FaGoogle, FaApple } from "react-icons/fa";

export default function LoginPage({ onNavigate, onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      // Only call onLogin - it will handle navigation internally
      // Don't call onNavigate separately as it can cause conflicts
      if (onLogin) {
        onLogin();
      } else if (onNavigate) {
        // Fallback if onLogin is not provided
        onNavigate("employee");
      }
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate("landing");
    }
  };

  return (
    <div className="wbl-root">
      <div className="wbl-icon-orb orb-1" />
      <div className="wbl-icon-orb orb-2" />
      <div className="wbl-icon-orb orb-3" />

      <div className="wbl-bg">
        <div 
          className="wbl-bg-img" 
          style={{ backgroundImage: `url(${backgroundImage})` }} 
        />
        
        {/* Navigation Layer - Fixed Back Button */}
        <div className="wbl-nav-overlay">
          <button className="new-back-circle" onClick={handleBackClick}>
            <FiArrowLeft /> <span>Back</span>
          </button>
        </div>

        <div className="wbl-login-content">
          <div className="new-glass-card">
            <div className="glass-card-inner">
              <h1 className="new-welcome-text">Welcome Back</h1>

              <form onSubmit={handleSubmit} className="new-login-form">
                <div className="new-input-box">
                  <FiMail className="new-icon" />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>

                <div className="new-input-box">
                  <FiLock className="new-icon" />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>

                <div className="new-submit-row">
                  <button type="submit" className="new-login-btn">
                    LOGIN <FiArrowRight className="arrow-small" />
                  </button>
                </div>
              </form>

              <div className="new-footer">
                <a href="#" className="new-forgot">Forgot Password?</a>
                <div className="new-social-row">
                  <div className="new-social-pill"><FaGoogle /> Google</div>
                  <div className="new-social-circle"><FiInstagram /></div>
                  <div className="new-social-circle"><FaApple /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}