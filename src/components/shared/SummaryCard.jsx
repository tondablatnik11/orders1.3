// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, ChevronDown, Package, Zap } from 'lucide-react';

const colorClasses = {
  blue: { text: 'text-blue-400', bg: 'bg-gradient-to-br from-slate-800 to-slate-900', border: 'border-slate-700', shadow: 'hover:shadow-blue-500/10' },
  green: { text: 'text-green-400', bg: 'bg-gradient-to-br from-slate-800 to-slate-900', border: 'border-slate-700', shadow: 'hover:shadow-green-500/10' },
  yellow: { text: 'text-yellow-400', bg: 'bg-gradient-to-br from-slate-800 to-slate-900', border: 'border-slate-700', shadow: 'hover:shadow-yellow-500/10' },
  orange: { text: 'text-orange-400', bg: 'bg-gradient-to-br from-slate-800 to-slate-900', border: 'border-slate-700', shadow: 'hover:shadow-orange-500/10' },
  cyan: { text: 'text-cyan-400', bg: 'bg-gradient-to-br from-slate-800 to-slate-900', border: 'border-slate-700', shadow: 'hover:shadow-cyan-500/10' },
};

const ChangeIndicator = ({ change }) => {
    if (change === undefined || change === null) return null;
    const isPositive = change > 0;
    const isNegative = change < 0;
    return (
        <span className={`flex items-center text-xs font-bold ${ isPositive ? 'text-green-400' : isNegative ? 'text-red-500' : 'text-slate-500' }`}>
            {isPositive && <ArrowUp className="w-3 h-3" />}
            {isNegative && <ArrowDown className="w-3 h-3" />}
            {change === 0 && <Minus className="w-3 h-3" />}
            {Math.abs(change)}
        </span>
    );
};

const AnimatedValue = ({ end }) => {
    const [current, setCurrent] = useState(0);
    useEffect(() => {
        if (typeof end !== 'number') { setCurrent(end); return; }
        let startValue = current;
        if (startValue === end) return;
        const duration = 800;
        let startTime = null;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const nextValue = Math.floor(progress * (end - startValue) + startValue);
            setCurrent(nextValue);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [end]);
    return <p className="text-2xl font-bold text-white">{current ?? 0}</p>;
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, breakdown, onStatusClick }) => {
  const styles = colorClasses[color] || colorClasses.blue;
  const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

  return (
    <div className={`col-span-1 flex flex-col justify-between ${styles.bg} rounded-lg border ${styles.border} p-3 transition-all duration-300 hover:shadow-xl ${styles.shadow} hover:-translate-y-1`}>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <Icon className={`w-4 h-4 ${styles.text}`} />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
            <AnimatedValue end={value} />
            <ChangeIndicator change={change} />
        </div>
      </div>
      {hasBreakdown && (
        <div className="mt-1">
            <div className="pt-2 border-t border-slate-700/50 space-y-1 text-xs">
                {Object.entries(breakdown).sort(([a], [b]) => Number(a) - Number(b)).map(([status, count]) => (
                <div key={status} onClick={() => onStatusClick(Number(status))} className="flex justify-between text-slate-300 hover:bg-slate-700/50 -mx-1 px-1 rounded cursor-pointer">
                    <span>Status {status}:</span>
                    <span className="font-semibold">{count}</span>
                </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export const FeaturedKPICard = ({ title, value, icon: Icon, onClick, change, breakdown, onStatusClick }) => {
    const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;
    
    return (
        <div className="col-span-2 md:col-span-1 group flex flex-col justify-between rounded-lg border border-red-500/50 bg-gradient-to-br from-slate-800 to-slate-900 p-3 transition-all duration-300 hover:shadow-2xl hover:border-red-500/80 hover:-translate-y-1 backdrop-blur-sm hover:shadow-red-500/20">
            <div onClick={onClick} className="cursor-pointer">
              <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-red-300 uppercase tracking-wider">{title}</p>
                  <Icon className="w-4 h-4 text-red-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                  <AnimatedValue end={value} />
                  <ChangeIndicator change={change} />
              </div>
            </div>
             {hasBreakdown && (
                <div className="mt-1">
                    <div className="pt-2 border-t border-red-500/30 space-y-1 text-xs">
                        {Object.entries(breakdown).sort(([a], [b]) => Number(a) - Number(b)).map(([status, count]) => (
                        <div key={status} onClick={(e) => { e.stopPropagation(); onStatusClick(Number(status)); }} className="flex justify-between text-red-200 hover:bg-red-900/50 -mx-1 px-1 rounded cursor-pointer">
                            <span>Status {status}:</span>
                            <span className="font-semibold">{count}</span>
                        </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const PickingKPICard = ({ title, shifts, todayPicks, icon: Icon, onDayClick }) => (
    <div className="col-span-1 flex flex-col justify-between bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-3 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
      </div>
      <div className="mt-2 space-y-1 text-sm">
          <div onClick={() => onDayClick('today')} className="flex justify-between items-baseline text-slate-300 hover:bg-slate-700/50 -mx-1 px-1 rounded cursor-pointer">
            <span>Dnes:</span>
            <span className="font-semibold text-lg text-white">{todayPicks}</span>
          </div>
          <div className="pt-1 border-t border-slate-700/50 text-xs">
              <div className="flex justify-between text-slate-400">
                  <span>Včera A:</span>
                  <span className="font-semibold">{shifts.shiftA}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                  <span>Včera B:</span>
                  <span className="font-semibold">{shifts.shiftB}</span>
              </div>
          </div>
      </div>
    </div>
);