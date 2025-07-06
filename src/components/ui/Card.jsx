import React from 'react';

export const Card = ({ children, className = "", onClick }) => (
  <div
    className={`border border-gray-700 rounded-xl bg-gray-800 shadow-xl ${className} ${onClick ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 space-y-2 ${className}`}>{children}</div>
);