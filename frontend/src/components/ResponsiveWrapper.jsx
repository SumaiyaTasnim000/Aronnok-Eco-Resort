// frontend/src/components/ResponsiveWrapper.jsx
import React from "react";

function ResponsiveWrapper({ children }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        margin: 0,
        padding: "10px",
        boxSizing: "border-box",
        backgroundColor: "#f8f9fa",
        overflowX: "hidden",
        display: "block",
      }}
    >
      {children}
    </div>
  );
}

export default ResponsiveWrapper;
