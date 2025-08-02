// src/components/shared/DailyOverviewCard.jsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';

const ProgressCircle = ({ percentage }) => {
    const radius = 35; // Zmenšený rádius
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-24 h-24"> {/* Zmenšený kontejner */}
            <svg className="w-full h-full" viewBox="0 0 90 90">
                <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="45" cy="45" />
                <motion.circle
                    className="text-cyan-400"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="45"
                    cy="45"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {/* ZMĚNA: Zmenšený font procent */}
                <span className="text-xl font-bold text-white">{`${percentage}%`}</span>
            </div>
        </div>
    );
};

const StatRow = ({ label, value, colorClass, onClick }) => (
    <div 
      className="flex justify-between items-center py-1 px-2 rounded-md transition-colors hover:bg-slate-700/50 cursor-pointer"
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
    // ZMĚNA: Zmenšená minimální šířka karty
    const cardClasses = `bg-slate-800/80 p-4 rounded-xl shadow-lg border min-w-[260px] flex-shrink-0 transition-all duration-300 ${isToday ? 'border-cyan-500 shadow-cyan-500/10' : 'border-slate-700'}`;

    const donePercentage = stats && stats.total > 0 ? Math.round((stats.status_done_all / stats.total) * 100) : 0;

    return (
        <div ref={ref} className={cardClasses}>
            <p className="text-slate-300 text-center font-bold mb-3 text-md">{title}</p>
            {stats ? (
                <div className="flex flex-col items-center">
                    <ProgressCircle percentage={donePercentage} />
                    <p className="text-xs text-slate-400 mt-2">Hotovo</p>
                    <p 
                        className="text-3xl font-bold text-white cursor-pointer hover:text-cyan-400"
                        onClick={() => onStatClick(date, 'all', `${t.total} (${title})`)}
                    >
                        {stats.total}
                    </p>
                    <p className="text-xs text-slate-500 -mt-1 mb-3">celkem zakázek</p>
                    
                    <div className="w-full space-y-0.5 border-t border-slate-700 pt-2">
                        <StatRow label="Nové" value={stats.status10} colorClass="bg-purple-400" onClick={() => onStatClick(date, [10], "Nové")} />
                        <StatRow label="Připraveno k pickování" value={stats.status31} colorClass="bg-yellow-400" onClick={() => onStatClick(date, [31], "Připraveno k pickování")} />
                        <StatRow label="V Picku" value={stats.status35} colorClass="bg-orange-400" onClick={() => onStatClick(date, [35], "V Picku")} />
                        <StatRow label="Připraveno k zabalení" value={stats.status40} colorClass="bg-amber-500" onClick={() => onStatClick(date, [40], "Připraveno k zabalení")} />
                        <StatRow label="Zabaleno" value={stats.status50_60} colorClass="bg-teal-400" onClick={() => onStatClick(date, [50, 60], "Zabaleno")} />
                        <StatRow label="Hotovo (celkem)" value={stats.status_done_all} colorClass="bg-green-400" onClick={() => onStatClick(date, [50, 60, 70, 80, 90], "Hotovo")} />
                    </div>
                </div>
            ) : <div className="text-center text-slate-500 text-sm flex items-center justify-center h-full min-h-[280px]">{t.noDataAvailable}</div>}
        </div>
    );
});
DailyOverviewCard.displayName = 'DailyOverviewCard';