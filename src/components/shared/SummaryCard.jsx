"use client";
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const SummaryCard = ({ title, value, icon: Icon, colorClass, change }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 flex items-center gap-4 transition-all duration-300 hover:bg-gray-700/80 hover:shadow-cyan-500/10 hover:-translate-y-1">
        <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">{title}</p>
                {change !== undefined && change !== 0 && (
                    <span className={`flex items-center text-xs font-bold ${change > 0 ? 'text-green-400' : 'text-red-500'}`}>
                        {change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(change)}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-white">{value ?? 0}</p>
        </div>
    </div>
);