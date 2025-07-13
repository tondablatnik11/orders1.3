"use client";
import React from 'react';

export const SummaryCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/10 flex items-center gap-4 h-full">
        <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
            <p className="text-base text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-white">{value || 0}</p>
        </div>
    </div>
);