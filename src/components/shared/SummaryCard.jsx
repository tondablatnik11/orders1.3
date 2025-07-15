"use client";
import React from 'react';

export const SummaryCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 flex items-center gap-4 transition-all duration-300 hover:bg-gray-700/80 hover:shadow-cyan-500/10 hover:-translate-y-1">
        <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value || 0}</p>
        </div>
    </div>
);