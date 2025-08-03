// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, ChevronDown } from 'lucide-react';

const colorClasses = {
  blue: { text: 'text-blue-400', bg: 'bg-blue-900/20' },
  green: { text: 'text-green-400', bg: 'bg-green-900/20' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-900/20' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-900/20' },
};

const ChangeIndicator = ({ change }) => {
    if (change === undefined || change === null) return null;
    const isPositive = change > 0;
    const isNegative = change < 0;
    return (
        <span className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-400' : isNegative ? 'text-red-500' : 'text-slate-500'}`}>
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
    return <p className="text-3xl font-bold text-white">{current ?? 0}</p>;
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, breakdown }) => {
  const styles = colorClasses[color] || colorClasses.blue;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

  return (
    <div className={`col-span-1 rounded-xl p-4 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <Icon className={`w-5 h-5 ${styles.text}`} />
      </div>
      <div className="flex items-baseline gap-2 mt-2">
          <AnimatedValue end={value} />
          <ChangeIndicator change={change} />
      </div>
      {hasBreakdown && (
        <div className="mt-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-slate-500 hover:text-white flex items-center gap-1">
            <span>Detaily</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1 text-xs">
                {Object.entries(breakdown).sort(([a], [b]) => a - b).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-slate-300">
                    <span>Status {status}:</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export const FeaturedKPICard = ({ title, value, icon: Icon, onClick, change }) => (
    <div
        onClick={onClick}
        className="col-span-2 md:col-span-1 group rounded-xl p-4 transition-all duration-300 cursor-pointer"
    >
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-300 uppercase tracking-wider">{title}</p>
            <Icon className="w-5 h-5 text-red-300" />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
            <AnimatedValue end={value} />
            <ChangeIndicator change={change} />
        </div>
    </div>
);