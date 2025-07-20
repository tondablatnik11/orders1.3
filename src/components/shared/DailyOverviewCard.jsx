// src/components/shared/DailyOverviewCard.jsx
"use client";
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// NOVÉ: Samostatná komponenta pro indikátor změny
const ChangeIndicator = ({ change }) => {
    if (change === undefined || change === null) return null;
    
    const isPositive = change > 0;
    const isNegative = change < 0;

    return (
        <span className={`flex items-center text-xs font-bold ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-500' : 'text-slate-500'
        }`}>
            {isPositive && <ArrowUp className="w-3 h-3" />}
            {isNegative && <ArrowDown className="w-3 h-3" />}
            {change === 0 && <Minus className="w-3 h-3" />}
            {Math.abs(change)}
        </span>
    );
};

const StatRow = ({ label, value, colorClass, change, onClick }) => (
    <div 
      className="flex justify-between items-baseline py-1 px-2 rounded-md transition-colors hover:bg-slate-700/50 cursor-pointer"
      onClick={onClick}
    >
        <span className="text-sm text-slate-400">{label}:</span>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-base ${colorClass}`}>{value}</span>
          <div className="w-8 text-right">
              {/* UPRAVENO: Použití nové komponenty */}
              <ChangeIndicator change={change} />
          </div>
        </div>
    </div>
);

export const DailyOverviewCard = React.forwardRef(({ title, stats, t, onStatClick, date, isToday, changes }, ref) => {
    const cardClasses = `bg-slate-800 p-4 rounded-xl shadow-lg border min-w-[240px] flex-shrink-0 transition-all duration-300 ${isToday ? 'border-blue-500' : 'border-slate-700'}`;

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
                        <div className="flex items-baseline justify-center gap-2">
                           <p className="text-4xl font-bold text-blue-400">{stats.total}</p>
                           <ChangeIndicator change={changes?.total} />
                        </div>
                    </div>
                    <StatRow label={t.done} value={stats.done} colorClass="text-green-400" change={changes?.done} onClick={() => onStatClick(date, [50, 60, 70, 80, 90], t.done)} />
                    <StatRow label={t.remaining} value={stats.remaining} colorClass="text-yellow-400" change={changes?.remaining} onClick={() => onStatClick(date, [10, 30, 31, 35, 40], t.remaining)} />
                    <StatRow label={t.inProgress} value={stats.inProgress} colorClass="text-orange-400" change={changes?.inProgress} onClick={() => onStatClick(date, [31, 35, 40], t.inProgress)} />
                    <StatRow label={t.newOrders} value={stats.new} colorClass="text-purple-400" change={changes?.new} onClick={() => onStatClick(date, [10], t.newOrders)} />
                </div>
            ) : <div className="text-center text-slate-500 text-sm flex items-center justify-center h-full min-h-[140px]">{t.noDataAvailable}</div>}
        </div>
    );
});
DailyOverviewCard.displayName = 'DailyOverviewCard';