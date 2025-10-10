// frontend/src/components/PageWrapper.jsx
import React from "react";

const PageWrapper = ({ children }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background:
          "linear-gradient(180deg, #a8d8ff 0%, #6fc3ff 40%, #1e88e5 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "100px 20px",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* soft glowing circles for subtle hue effect */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-120px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.25)",
          filter: "blur(100px)",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.2)",
          filter: "blur(90px)",
        }}
      ></div>

      {/* main white centered container */}
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          background: "#ffffff",
          borderRadius: "22px",
          padding: "45px 50px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
