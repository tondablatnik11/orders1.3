// src/components/shared/SummaryCard.jsx
"use client";
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const colorClasses = {
  blue: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-300' },
  green: { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-300' },
  yellow: { bg: 'bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-300' },
  orange: { bg: 'bg-orange-900/50', border: 'border-orange-500', text: 'text-orange-300' },
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, onClick }) => {
  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      className={`col-span-1 ${styles.bg} rounded-xl border ${styles.border} p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/50 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className={`p-2 rounded-lg bg-slate-900/50`}>
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-white">{value ?? 0}</p>
        {change !== undefined && change !== 0 && (
          <span className={`flex items-center text-sm font-semibold ${
              change > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
              {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(change)}
          </span>
        )}
      </div>
    </div>
  );
};