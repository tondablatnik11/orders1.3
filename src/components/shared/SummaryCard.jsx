"use client";
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'; // Přidán import ikony Minus

export const SummaryCard = ({ title, value, icon: Icon, colorClass, change, onClick }) => (
    <div 
      className={`bg-gray-800/50 backdrop-blur-sm p-2.5 rounded-lg shadow-md border border-white/10 flex items-center gap-2 transition-all duration-300 hover:bg-gray-700/80 hover:shadow-cyan-500/10 hover:-translate-y-px ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
        <div className={`p-2 rounded-md ${colorClass}`}>
            <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
            <div className="flex items-center gap-1.5">
                <p className="text-xs text-gray-400">{title}</p>
                {change !== undefined && (
                    <span className={`flex items-center text-xs font-semibold ${
                        change > 0 ? 'text-green-400' : change < 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                        {change > 0 && <ArrowUp className="w-3 h-3" />}
                        {change < 0 && <ArrowDown className="w-3 h-3" />}
                        {change === 0 && <Minus className="w-3 h-3" />}
                        {Math.abs(change)}
                    </span>
                )}
            </div>
            <p className="text-lg font-bold text-white">{value ?? 0}</p>
        </div>
    </div>
);