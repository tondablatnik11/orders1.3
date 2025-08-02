// src/components/shared/DailyOverviewCard.jsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';

const ProgressCircle = ({ percentage }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 80 80">
                <circle className="text-slate-700" strokeWidth="7" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                <motion.circle
                    className="text-cyan-400"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{`${percentage}%`}</span>
            </div>
        </div>
    );
};

const StatRow = ({ label, value, oemValue, colorClass, onClick }) => (
    <div 
      className="grid grid-cols-12 items-center gap-1 py-1 px-1.5 rounded-md transition-colors hover:bg-slate-700/50 cursor-pointer"
      onClick={onClick}
    >
        <div className="flex items-center gap-2 col-span-8">
            <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`}></div>
            <span className="text-xs text-slate-300 truncate">{label}:</span>
        </div>
        <div className="col-span-4 grid grid-cols-2 text-right gap-1">
            <span className="font-medium text-xs text-slate-400">{oemValue}</span>
            <span className="font-semibold text-sm text-white">{value}</span>
        </div>
    </div>
);

export const DailyOverviewCard = React.forwardRef(({ title, stats, t, onStatClick, date, isToday }, ref) => {
    const cardClasses = `bg-slate-800/80 p-3 rounded-xl shadow-lg border min-w-[220px] flex-shrink-0 transition-all duration-300 ${isToday ? 'border-cyan-500 shadow-cyan-500/10' : 'border-slate-700'}`;

    const donePercentage = stats && stats.total > 0 ? Math.round((stats.status_done_all / stats.total) * 100) : 0;

    return (
        <div ref={ref} className={cardClasses}>
            <p className="text-slate-300 text-center font-semibold mb-2 text-sm">{title}</p>
            {stats ? (
                <div className="flex flex-col items-center">
                    <ProgressCircle percentage={donePercentage} />
                    <p className="text-xs font-medium text-slate-300 mt-1">Hotovo</p>
                    <p 
                        className="text-2xl font-bold text-white cursor-pointer hover:text-cyan-400"
                        onClick={() => onStatClick(date, 'all', `${t.total} (${title})`)}
                    >
                        {stats.total}
                    </p>
                    <p className="text-xs text-slate-500 -mt-1 mb-2">celkem zakázek</p>
                    
                    <div className="w-full border-t border-slate-700 pt-1.5">
                         <div className="grid grid-cols-12 items-center gap-1 px-1.5">
                            <div className="col-span-8"></div>
                            <div className="col-span-4 grid grid-cols-2 text-right gap-1">
                                <span className="font-semibold text-[10px] text-slate-500">OEM</span>
                                <span className="font-semibold text-[10px] text-slate-500">Celkem</span>
                            </div>
                        </div>
                        <StatRow label="Nové" value={stats.status10} oemValue={stats.status10_oem} colorClass="bg-purple-400" onClick={() => onStatClick(date, [10], "Nové")} />
                        <StatRow label="K pickování" value={stats.status31} oemValue={stats.status31_oem} colorClass="bg-yellow-400" onClick={() => onStatClick(date, [31], "Připraveno k pickování")} />
                        <StatRow label="V Picku" value={stats.status35} oemValue={stats.status35_oem} colorClass="bg-orange-400" onClick={() => onStatClick(date, [35], "V Picku")} />
                        <StatRow label="K zabalení" value={stats.status40} oemValue={stats.status40_oem} colorClass="bg-amber-500" onClick={() => onStatClick(date, [40], "Připraveno k zabalení")} />
                        <StatRow label="Zabaleno" value={stats.status50_60} oemValue={stats.status50_60_oem} colorClass="bg-teal-400" onClick={() => onStatClick(date, [50, 60], "Zabaleno")} />
                        <StatRow label="Hotovo" value={stats.status_done_all} oemValue={stats.status_done_all_oem} colorClass="bg-green-400" onClick={() => onStatClick(date, [50, 60, 70, 80, 90], "Hotovo")} />
                    </div>
                </div>
            ) : <div className="text-center text-slate-500 text-sm flex items-center justify-center h-full min-h-[280px]">{t.noDataAvailable}</div>}
        </div>
    );
});
DailyOverviewCard.displayName = 'DailyOverviewCard';