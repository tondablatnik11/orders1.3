// src/components/layout/GlobalStyles.jsx
'use client';

import React from 'react';

const GlobalStyles = () => {
  return (
    <style jsx global>{`
      body {
        background-color: #0d1117;
        background-image: 
          radial-gradient(at 20% 20%, hsla(210, 80%, 40%, 0.2) 0px, transparent 50%),
          radial-gradient(at 80% 20%, hsla(180, 70%, 50%, 0.15) 0px, transparent 50%),
          radial-gradient(at 50% 80%, hsla(240, 60%, 40%, 0.2) 0px, transparent 50%),
          radial-gradient(at 90% 90%, hsla(340, 70%, 50%, 0.1) 0px, transparent 50%);
        background-attachment: fixed;
      }

      .glass-card {
        background-color: rgba(22, 34, 51, 0.25) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
    `}</style>
  );
};

export default GlobalStyles;