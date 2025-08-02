// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, ChevronDown, Package, Zap } from 'lucide-react';

const colorClasses = {
  blue: { text: 'text-blue-400', bg: 'bg-gradient-to-br from-blue-900/40 to-slate-900/50', border: 'border-blue-500/30', shadow: 'hover:shadow-blue-500/10' },
  green: { text: 'text-green-400', bg: 'bg-gradient-to-br from-green-900/40 to-slate-900/50', border: 'border-green-500/30', shadow: 'hover:shadow-green-500/10' },
  yellow: { text: 'text-yellow-400', bg: 'bg-gradient-to-br from-yellow-900/40 to-slate-900/50', border: 'border-yellow-500/30', shadow: 'hover:shadow-yellow-500/10' },
  orange: { text: 'text-orange-400', bg: 'bg-gradient-to-br from-orange-900/40 to-slate-900/50', border: 'border-orange-500/30', shadow: 'hover:shadow-orange-500/10' },
  cyan: { text: 'text-cyan-400', bg: 'bg-gradient-to-br from-cyan-900/40 to-slate-900/50', border: 'border-cyan-500/30', shadow: 'hover:shadow-cyan-500/10' },
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
    // ZMĚNA: Velikost fontu zmenšena na text-3xl
    return <p className="text-3xl font-bold text-white">{current ?? 0}</p>;
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, breakdown }) => {
  const styles = colorClasses[color] || colorClasses.blue;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

  return (
    <div className={`col-span-1 flex flex-col justify-between ${styles.bg} rounded-xl border ${styles.border} p-4 transition-all duration-300 hover:shadow-xl ${styles.shadow} hover:-translate-y-1`}>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
            <AnimatedValue end={value} />
            <ChangeIndicator change={change} />
        </div>
      </div>
      {hasBreakdown && (
        <div className="mt-1">
          <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
          <div className="text-center h-5">
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-500 hover:text-white mt-1 transition-transform duration-300">
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const FeaturedKPICard = ({ title, value, icon: Icon, onClick, change, breakdown }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;
    
    return (
        <div onClick={onClick} className="col-span-2 md:col-span-1 group flex flex-col justify-between rounded-xl border-2 border-red-500/50 bg-gradient-to-br from-red-900/40 to-slate-900/50 p-4 transition-all duration-300 hover:shadow-2xl hover:border-red-500/80 hover:-translate-y-1 backdrop-blur-sm cursor-pointer hover:shadow-red-500/20">
            <div>
              <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-300 uppercase tracking-wider">{title}</p>
                  <Icon className="w-5 h-5 text-red-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                  <AnimatedValue end={value} />
                  <ChangeIndicator change={change} />
              </div>
            </div>
             {hasBreakdown && (
                <div className="mt-1">
                  <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pt-2 border-t border-red-500/30 space-y-1 text-xs">
                        {Object.entries(breakdown).sort(([a], [b]) => a - b).map(([status, count]) => (
                          <div key={status} className="flex justify-between text-red-200">
                            <span>Status {status}:</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                  <div className="text-center h-5">
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-red-400/70 hover:text-white mt-1 transition-transform duration-300">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
            )}
        </div>
    );
};

export const PickingKPICard = ({ title, value, icon: Icon }) => (
    <div className="col-span-1 flex flex-col justify-between bg-cyan-900/30 rounded-xl border border-cyan-500/30 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <div className="flex items-baseline gap-2 mt-2">
          <AnimatedValue end={value} />
      </div>
    </div>
);