// src/components/shared/DailyOverviewCard.jsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';

// Komponenta pro kruhový progress bar
const ProgressCircle = ({ percentage }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Pozadí kruhu */}
                <circle
                    className="text-slate-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50"
                    cy="50"
                />
                {/* Progress kruh */}
                <motion.circle
                    className="text-cyan-400"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50"
                    cy="50"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{`${percentage}%`}</span>
            </div>
        </div>
    );
};

const StatRow = ({ label, value, colorClass, onClick }) => (
    <div 
      className="flex justify-between items-center py-1.5 px-2 rounded-md transition-colors hover:bg-slate-700/50 cursor-pointer"
      onClick={onClick}
    >
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
            <span className="text-sm text-slate-300">{label}:</span>
        </div>
        <span className="font-semibold text-base text-white">{value}</span>
    </div>
);

export const DailyOverviewCard = React.forwardRef(({ title, stats, t, onStatClick, date, isToday }, ref) => {
    const cardClasses = `bg-slate-800/80 p-4 rounded-xl shadow-lg border min-w-[300px] flex-shrink-0 transition-all duration-300 ${isToday ? 'border-cyan-500 shadow-cyan-500/10' : 'border-slate-700'}`;

    const donePercentage = stats && stats.total > 0 ? Math.round((stats.status_done_all / stats.total) * 100) : 0;

    return (
        <div ref={ref} className={cardClasses}>
            <p className="text-slate-300 text-center font-bold mb-4 text-md">{title}</p>
            {stats ? (
                <div className="flex flex-col items-center">
                    <ProgressCircle percentage={donePercentage} />
                    <p className="text-xs text-slate-400 mt-2">Hotovo</p>
                    <p className="text-3xl font-bold text-white mt-1 cursor-pointer hover:text-cyan-400" onClick={() => onStatClick(date, 'all', t.total)}>
                        {stats.total}
                    </p>
                    <p className="text-sm text-slate-500 -mt-1 mb-4">celkem zakázek</p>
                    
                    <div className="w-full space-y-1 border-t border-slate-700 pt-3">
                        <StatRow label="Nové" value={stats.status10} colorClass="bg-purple-400" onClick={() => onStatClick(date, [10], "Nové")} />
                        <StatRow label="Připraveno k pickování" value={stats.status31} colorClass="bg-yellow-400" onClick={() => onStatClick(date, [31], "Připraveno k pickování")} />
                        <StatRow label="V Picku" value={stats.status35} colorClass="bg-orange-400" onClick={() => onStatClick(date, [35], "V Picku")} />
                        <StatRow label="Připraveno k zabalení" value={stats.status40} colorClass="bg-amber-500" onClick={() => onStatClick(date, [40], "Připraveno k zabalení")} />
                        <StatRow label="Zabaleno" value={stats.status50_60} colorClass="bg-teal-400" onClick={() => onStatClick(date, [50, 60], "Zabaleno")} />
                        <StatRow label="Hotovo (celkem)" value={stats.status_done_all} colorClass="bg-green-400" onClick={() => onStatClick(date, [50, 60, 70, 80, 90], "Hotovo")} />
                    </div>
                </div>
            ) : <div className="text-center text-slate-500 text-sm flex items-center justify-center h-full min-h-[300px]">{t.noDataAvailable}</div>}
        </div>
    );
});
DailyOverviewCard.displayName = 'DailyOverviewCard';