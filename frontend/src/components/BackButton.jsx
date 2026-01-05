import React from "react";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ onClick, label = "Back", style = {}, variant = "default" }) {
  // Different styles for different contexts
  const baseStyle = variant === "light" 
    ? {
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
        color: "#3b82f6",
        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)"
      }
    : {
        background: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        color: "#ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
      };

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 16px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.3s ease",
        ...baseStyle,
        ...style
      }}
      onMouseEnter={(e) => {
        if (variant === "light") {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)";
          e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
        } else {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
        }
        e.currentTarget.style.transform = "translateX(-4px)";
      }}
      onMouseLeave={(e) => {
        if (variant === "light") {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)";
          e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)";
        } else {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        }
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </button>
  );
}
