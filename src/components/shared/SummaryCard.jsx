// src/components/shared/SummaryCard.jsx
"use client";
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const colorClasses = {
  blue: { border: 'border-blue-500/50', text: 'text-blue-400' },
  green: { border: 'border-green-500/50', text: 'text-green-400' },
  yellow: { border: 'border-yellow-500/50', text: 'text-yellow-400' },
  orange: { border: 'border-orange-500/50', text: 'text-orange-400' },
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, onClick }) => {
  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      className={`col-span-1 bg-slate-800/50 rounded-lg border border-slate-700 p-3 transition-all duration-300 hover:shadow-lg hover:border-slate-600 hover:-translate-y-0.5 backdrop-blur-sm ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <Icon className={`w-5 h-5 ${styles.text}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-white">{value ?? 0}</p>
        {change !== undefined && (
          <span className={`flex items-center text-xs font-semibold ${
              change > 0 ? 'text-green-400' : change < 0 ? 'text-red-500' : 'text-slate-500'
          }`}>
              {change > 0 && <ArrowUp className="w-3 h-3" />}
              {change < 0 && <ArrowDown className="w-3 h-3" />}
              {change === 0 && <Minus className="w-3 h-3" />}
              {Math.abs(change)}
          </span>
        )}
      </div>
    </div>
  );
};