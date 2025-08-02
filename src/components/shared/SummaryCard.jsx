// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, ChevronDown } from 'lucide-react';

const colorClasses = {
  blue: { text: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-500/50', shadow: 'hover:shadow-blue-500/10' },
  green: { text: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/50', shadow: 'hover:shadow-green-500/10' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', shadow: 'hover:shadow-yellow-500/10' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-500/50', shadow: 'hover:shadow-orange-500/10' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-900/30', border: 'border-cyan-500/50', shadow: 'hover:shadow-cyan-500/10' },
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
    return <p className="text-3xl font-bold text-white">{current ?? 0}</p>;
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, breakdown }) => {
  const styles = colorClasses[color] || colorClasses.blue;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

  return (
    <div className={`col-span-1 ${styles.bg} rounded-xl border ${styles.border} p-4 transition-all duration-300 hover:shadow-xl ${styles.shadow} hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
              <AnimatedValue end={value} />
              <ChangeIndicator change={change} />
          </div>
        </div>
        <Icon className={`w-6 h-6 ${styles.text}`} />
      </div>
      {hasBreakdown && (
        <>
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-1 text-sm">
              {Object.entries(breakdown).map(([status, count]) => (
                <div key={status} className="flex justify-between text-slate-300">
                  <span>Status {status}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="text-center">
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-500 hover:text-white mt-2 transition-transform duration-300">
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const FeaturedKPICard = ({ title, value, icon: Icon, onClick, change, breakdown }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;
    
    return (
        <div onClick={onClick} className="col-span-2 md:col-span-1 group rounded-xl border-2 border-red-500/50 bg-red-900/40 p-4 transition-all duration-300 hover:shadow-2xl hover:border-red-500/80 hover:-translate-y-1 backdrop-blur-sm cursor-pointer hover:shadow-red-500/20">
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <p className="text-sm font-medium text-red-300 uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <AnimatedValue end={value} />
                        <ChangeIndicator change={change} />
                    </div>
                </div>
                <Icon className="w-6 h-6 text-red-300" />
            </div>
             {hasBreakdown && (
                <>
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-3 border-t border-red-500/30 space-y-1 text-sm">
                      {Object.entries(breakdown).map(([status, count]) => (
                        <div key={status} className="flex justify-between text-red-200">
                          <span>Status {status}:</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                  <div className="text-center">
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-red-400/70 hover:text-white mt-2 transition-transform duration-300">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </>
            )}
        </div>
    );
};

// Nová KPI karta pro statistiky z pickování
export const PickingKPICard = ({ title, value, icon: Icon }) => (
    <div className="col-span-1 bg-cyan-900/30 rounded-xl border border-cyan-500/50 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
              <AnimatedValue end={value} />
          </div>
        </div>
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
    </div>
);