// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, ChevronDown, Zap } from 'lucide-react';

const colorClasses = {
  blue: { text: 'text-blue-400' },
  green: { text: 'text-green-400' },
  yellow: { text: 'text-yellow-400' },
  orange: { text: 'text-orange-400' },
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

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', onStatusClick, breakdown }) => {
  const styles = colorClasses[color] || colorClasses.blue;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;

  return (
    <div className={`col-span-1 rounded-xl p-3 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <Icon className={`w-4 h-4 ${styles.text}`} />
      </div>
      <div className="flex items-baseline gap-2 mt-2">
          <AnimatedValue end={value} />
      </div>
      {hasBreakdown && (
        <div className="mt-1">
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
                {Object.entries(breakdown).sort(([a], [b]) => Number(a) - Number(b)).map(([status, count]) => (
                  <div key={status} onClick={() => onStatusClick([Number(status)], `Status ${status}`)} className="flex justify-between text-slate-300 hover:bg-slate-700/50 -mx-1 px-1 rounded cursor-pointer">
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

export const FeaturedKPICard = ({ title, value, icon: Icon, onClick, breakdown, onStatusClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasBreakdown = breakdown && Object.keys(breakdown).length > 0;
    
    return (
        <div className="col-span-2 md:col-span-1 group rounded-xl p-3 transition-all duration-300">
            <div onClick={onClick} className="cursor-pointer">
              <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-red-300 uppercase tracking-wider">{title}</p>
                  <Icon className="w-4 h-4 text-red-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                  <AnimatedValue end={value} />
              </div>
            </div>
             {hasBreakdown && (
                <div className="mt-1">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-red-400/70 hover:text-white flex items-center gap-1">
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
                          <div className="mt-2 pt-2 border-t border-red-500/30 space-y-1 text-xs">
                            {Object.entries(breakdown).sort(([a], [b]) => Number(a) - Number(b)).map(([status, count]) => (
                              <div key={status} onClick={(e) => { e.stopPropagation(); onStatusClick([Number(status)], `Zpožděné - Status ${status}`); }} className="flex justify-between text-red-200 hover:bg-red-900/50 -mx-1 px-1 rounded cursor-pointer">
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

export const PickingKPICard = ({ title, shifts, todayPicks, icon: Icon, onDayClick }) => (
    <div className="col-span-1 rounded-xl p-3 transition-all duration-300">
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
              <div onClick={() => onDayClick('yesterday')} className="flex justify-between text-slate-400 hover:bg-slate-700/50 -mx-1 px-1 rounded cursor-pointer">
                  <span>Včera A:</span>
                  <span className="font-semibold">{shifts.shiftA}</span>
              </div>
              <div onClick={() => onDayClick('yesterday')} className="flex justify-between text-slate-400 hover:bg-slate-700/50 -mx-1 px-1 rounded cursor-pointer">
                  <span>Včera B:</span>
                  <span className="font-semibold">{shifts.shiftB}</span>
              </div>
          </div>
      </div>
    </div>
);