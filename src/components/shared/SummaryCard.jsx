// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const colorClasses = {
  blue: { text: 'text-blue-400', bg: 'bg-blue-900/20' },
  green: { text: 'text-green-400', bg: 'bg-green-900/20' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-900/20' },
};

// NOVÉ: Indikátor změny s vylepšeným stylem
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

// Komponenta pro animované číslo
const AnimatedValue = ({ end }) => {
    const [current, setCurrent] = useState(0);
    useEffect(() => {
        if (typeof end !== 'number') {
            setCurrent(end);
            return;
        }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [end]);
    return <p className="text-3xl font-bold text-white">{current ?? 0}</p>;
};

// UPRAVENO: Přepracovaná hlavní KPI karta
export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change }) => {
  const styles = colorClasses[color] || colorClasses.blue;
  return (
    <div className={`col-span-1 ${styles.bg} rounded-xl border border-slate-700 p-4 transition-all duration-300 hover:shadow-lg hover:border-slate-600 hover:-translate-y-0.5`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${styles.bg}`}>
            <Icon className={`w-6 h-6 ${styles.text}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <div className="flex items-baseline gap-2">
                <AnimatedValue end={value} />
                <ChangeIndicator change={change} />
            </div>
        </div>
      </div>
    </div>
  );
};

// Zvýrazněná karta pro klíčové metriky
export const FeaturedKPICard = ({ title, value, icon: Icon, onClick, change }) => (
    <div
        onClick={onClick}
        className="col-span-2 md:col-span-1 group rounded-xl border-2 border-red-500/50 bg-red-900/30 p-4 transition-all duration-300 hover:shadow-xl hover:border-red-500/80 hover:-translate-y-0.5 backdrop-blur-sm cursor-pointer"
    >
        <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-red-900/30">
                <Icon className="w-6 h-6 text-red-300" />
            </div>
            <div>
                <p className="text-sm font-medium text-red-300 uppercase tracking-wider">{title}</p>
                 <div className="flex items-baseline gap-2">
                    <AnimatedValue end={value} />
                    <ChangeIndicator change={change} />
                </div>
            </div>
        </div>
    </div>
);