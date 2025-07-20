// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';

const colorClasses = {
  blue: { text: 'text-blue-400' },
  green: { text: 'text-green-400' },
  yellow: { text: 'text-yellow-400' },
  orange: { text: 'text-orange-400' },
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

    return <p className="text-2xl font-bold text-white">{current ?? 0}</p>;
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const styles = colorClasses[color] || colorClasses.blue;
  return (
    <div 
      className="col-span-1 bg-slate-800/50 rounded-lg border border-slate-700 p-3 transition-all duration-300 hover:shadow-lg hover:border-slate-600 hover:-translate-y-0.5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <Icon className={`w-5 h-5 ${styles.text}`} />
      </div>
      <AnimatedValue end={value} />
    </div>
  );
};

// NOVÉ: Zvýrazněná karta pro klíčové metriky
export const FeaturedKPICard = ({ title, value, icon: Icon, onClick }) => (
    <div
        onClick={onClick}
        className="col-span-2 md:col-span-1 group rounded-lg border border-red-500/50 bg-red-900/30 p-3 transition-all duration-300 hover:shadow-lg hover:border-red-500/70 hover:-translate-y-0.5 backdrop-blur-sm cursor-pointer"
    >
        <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-red-300 uppercase tracking-wider">{title}</p>
            <Icon className="w-5 h-5 text-red-300" />
        </div>
        <AnimatedValue end={value} />
    </div>
);