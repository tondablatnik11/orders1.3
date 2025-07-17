// src/components/shared/DailyOverviewCard.jsx
"use client";
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const ChangeIndicator = ({ change }) => {
    if (change === undefined) return null;
    
    const isPositive = change > 0;
    const isNegative = change < 0;

    return (
        <span className={`flex items-center text-xs font-bold ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-500' : 'text-gray-400'
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
      className="flex justify-between items-center py-1.5 px-2 rounded-md transition-colors hover:bg-slate-700/50 cursor-pointer"
      onClick={onClick}
    >
        <span className="text-sm text-slate-300">{label}:</span>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg ${colorClass}`}>{value}</span>
          <div className="w-8 text-right">
              <ChangeIndicator change={change} />
          </div>
        </div>
    </div>
);

export const DailyOverviewCard = React.forwardRef(({ title, stats, t, onStatClick, date, changes }, ref) => (
    <div ref={ref} className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 min-w-64 flex-shrink-0">
        <p className="text-slate-300 text-center font-bold mb-3 text-md">{title}</p>
        {stats ? (
            <div className="space-y-1">
                <StatRow label={t.total} value={stats.total} colorClass="text-blue-400" change={changes?.total} onClick={() => onStatClick(date, 'total', t.total)} />
                <StatRow label={t.done} value={stats.done} colorClass="text-green-400" change={changes?.done} onClick={() => onStatClick(date, 'done', t.done)} />
                <StatRow label={t.remaining} value={stats.remaining} colorClass="text-yellow-400" change={changes?.remaining} onClick={() => onStatClick(date, 'remaining', t.remaining)} />
                <StatRow label={t.inProgress} value={stats.inProgress} colorClass="text-orange-400" change={changes?.inProgress} onClick={() => onStatClick(date, 'inProgress', t.inProgress)} />
                <StatRow label={t.newOrders} value={stats.new} colorClass="text-purple-400" change={changes?.new} onClick={() => onStatClick(date, 'new', t.newOrders)} />
            </div>
        ) : <div className="text-center text-slate-500 text-sm flex items-center justify-center h-40">{t.noDataAvailable}</div>}
    </div>
));
DailyOverviewCard.displayName = 'DailyOverviewCard';