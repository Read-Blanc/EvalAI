import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Set timer to fade out splash screen after 3 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Call onFinish callback after fade animation completes
      setTimeout(onFinish, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-container">
          <div className="splash-logo">
            <div className="logo-circle"></div>
          </div>
        </div>
        <h1 className="splash-title">EvalAI</h1>
        <p className="splash-subtitle">Evaluation Platform</p>
        <div className="splash-loader">
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
          <div className="loader-dot"></div>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
