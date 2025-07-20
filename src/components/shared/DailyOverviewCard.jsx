// src/components/shared/DailyOverviewCard.jsx
"use client";
import React from 'react';

const StatRow = ({ label, value, colorClass, onClick }) => (
    <div 
      className="flex justify-between items-baseline py-1 px-2 rounded-md transition-colors hover:bg-slate-700/50 cursor-pointer"
      onClick={onClick}
    >
        <span className="text-sm text-slate-400">{label}:</span>
        <span className={`font-semibold text-base ${colorClass}`}>{value}</span>
    </div>
);

export const DailyOverviewCard = React.forwardRef(({ title, stats, t, onStatClick, date, isToday }, ref) => {
    const cardClasses = `bg-slate-800 p-4 rounded-xl shadow-lg border min-w-[220px] flex-shrink-0 transition-all duration-300 ${isToday ? 'border-blue-500' : 'border-slate-700'}`;

    return (
        <div ref={ref} className={cardClasses}>
            <p className="text-slate-300 text-center font-bold mb-3 text-md">{title}</p>
            {stats ? (
                <div className="space-y-1">
                    <div 
                        className="text-center mb-2 p-2 rounded-md transition-colors hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => onStatClick(date, 'all', t.total)}
                    >
                        <p className="text-xs text-slate-400">{t.total}</p>
                        <p className="text-4xl font-bold text-blue-400">{stats.total}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                        <StatRow label={t.done} value={stats.done} colorClass="text-green-400" onClick={() => onStatClick(date, [50, 60, 70, 80, 90], t.done)} />
                        <StatRow label={t.remaining} value={stats.remaining} colorClass="text-yellow-400" onClick={() => onStatClick(date, [10, 30, 31, 35, 40], t.remaining)} />
                        <StatRow label={t.inProgress} value={stats.inProgress} colorClass="text-orange-400" onClick={() => onStatClick(date, [31, 35, 40], t.inProgress)} />
                        <StatRow label={t.newOrders} value={stats.new} colorClass="text-purple-400" onClick={() => onStatClick(date, [10], t.newOrders)} />
                    </div>
                </div>
            ) : <div className="text-center text-slate-500 text-sm flex items-center justify-center h-full min-h-[140px]">{t.noDataAvailable}</div>}
        </div>
    );
});
DailyOverviewCard.displayName = 'DailyOverviewCard';