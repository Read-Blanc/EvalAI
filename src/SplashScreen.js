import { useEffect, useState } from "react";
import "./SplashScreen.css";

function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState("enter"); // enter → hold → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100); // trigger fade-in
    const t2 = setTimeout(() => setPhase("exit"), 3200); // start fade-out at 3.2s
    const t3 = setTimeout(() => onFinish(), 3800); // hand off at 3.8s
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className="splash-overlay"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.6s ease" : "none",
        pointerEvents: phase === "exit" ? "none" : "all",
      }}
    >
      <div
        className="splash-content"
        style={{
          opacity: phase === "enter" ? 0 : 1,
          transform: phase === "enter" ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Spinning ring with EvalAI checkmark logo */}
        <div className="splash-ring-wrap">
          <svg className="splash-ring-svg" viewBox="0 0 64 64" fill="none">
            {/* Track */}
            <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="3" />
            {/* Spinning arc */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#111111"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="175"
              strokeDashoffset="44"
              className="splash-ring-arc"
            />
          </svg>
          {/* Checkmark icon inside ring */}
          <div className="splash-ring-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div className="splash-wordmark">
          <div className="splash-title">EvalAI</div>
          <div className="splash-subtitle">Assessment Platform</div>
        </div>

        {/* Progress bar — 3s fill matching the hold window */}
        <div className="splash-bar-track">
          <div className="splash-bar-fill" />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
