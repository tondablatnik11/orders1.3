"use client";
import React from 'react';

export const DailyOverviewCard = React.forwardRef(({ title, stats, t, onStatClick, date }, ref) => (
    <div ref={ref} className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 min-w-48 flex-shrink-0">
        <p className="text-gray-400 text-center font-semibold mb-3">{title}</p>
        {stats ? (
            <div className="text-sm space-y-2">
                <p className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => onStatClick(date, 'total', t.total)}>{t.total}: <strong className="float-right">{stats.total}</strong></p>
                <p className="cursor-pointer hover:text-green-400 transition-colors" onClick={() => onStatClick(date, 'done', t.done)}>{t.done}: <strong className="text-green-300 float-right">{stats.done}</strong></p>
                <p className="cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => onStatClick(date, 'remaining', t.remaining)}>{t.remaining}: <strong className="text-yellow-300 float-right">{stats.remaining}</strong></p>
                <p className="cursor-pointer hover:text-orange-400 transition-colors" onClick={() => onStatClick(date, 'inProgress', t.inProgress)}>{t.inProgress}: <strong className="text-orange-300 float-right">{stats.inProgress}</strong></p>
                <p className="cursor-pointer hover:text-purple-400 transition-colors" onClick={() => onStatClick(date, 'new', t.newOrders)}>{t.newOrders}: <strong className="text-purple-300 float-right">{stats.new}</strong></p>
            </div>
        ) : <div className="text-center text-gray-500 text-sm flex items-center justify-center h-24">{t.noDataAvailable}</div>}
    </div>
));
DailyOverviewCard.displayName = 'DailyOverviewCard';