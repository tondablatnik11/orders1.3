"use client";
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const ChangeIndicator = ({ change }) => {
    if (change === undefined || change === 0) return null;
    const isPositive = change > 0;
    return (
        <span className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-500'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(change)}
        </span>
    );
};

export const DailyOverviewCard = React.forwardRef(({ title, stats, t, onStatClick, date, changes }, ref) => (
    <div ref={ref} className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 min-w-48 flex-shrink-0">
        <p className="text-gray-400 text-center font-semibold mb-3">{title}</p>
        {stats ? (
            <div className="text-sm space-y-2">
                <p className="cursor-pointer hover:text-blue-400 transition-colors flex justify-between items-center" onClick={() => onStatClick(date, 'total', t.total)}>
                    <span>{t.total}: <strong>{stats.total}</strong></span>
                    <ChangeIndicator change={changes?.total} />
                </p>
                <p className="cursor-pointer hover:text-green-400 transition-colors flex justify-between items-center" onClick={() => onStatClick(date, 'done', t.done)}>
                    <span>{t.done}: <strong className="text-green-300">{stats.done}</strong></span>
                    <ChangeIndicator change={changes?.done} />
                </p>
                <p className="cursor-pointer hover:text-yellow-400 transition-colors flex justify-between items-center" onClick={() => onStatClick(date, 'remaining', t.remaining)}>
                    <span>{t.remaining}: <strong className="text-yellow-300">{stats.remaining}</strong></span>
                    <ChangeIndicator change={changes?.remaining} />
                </p>
                <p className="cursor-pointer hover:text-orange-400 transition-colors flex justify-between items-center" onClick={() => onStatClick(date, 'inProgress', t.inProgress)}>
                    <span>{t.inProgress}: <strong className="text-orange-300">{stats.inProgress}</strong></span>
                    <ChangeIndicator change={changes?.inProgress} />
                </p>
                <p className="cursor-pointer hover:text-purple-400 transition-colors flex justify-between items-center" onClick={() => onStatClick(date, 'new', t.newOrders)}>
                    <span>{t.newOrders}: <strong className="text-purple-300">{stats.new}</strong></span>
                    <ChangeIndicator change={changes?.new} />
                </p>
            </div>
        ) : <div className="text-center text-gray-500 text-sm flex items-center justify-center h-24">{t.noDataAvailable}</div>}
    </div>
));
DailyOverviewCard.displayName = 'DailyOverviewCard';