"use client";
import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// OPRAVA: Chybějící definice barevných tříd je nyní vrácena zpět
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

        const duration = 800; // Zkrácení animace pro svižnější pocit
        let startTime = null;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const nextValue = Math.floor(progress * (end - startValue) + startValue);
            
            setCurrent(nextValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

        return () => {
            // Cleanup pro jistotu, i když by se animace měla dokončit
        };
    }, [end]);

    return <p className="text-2xl font-bold text-white">{current ?? 0}</p>;
};

export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, onClick }) => {
  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <div 
      className={`col-span-1 bg-slate-800/50 rounded-lg border border-slate-700 p-3 transition-all duration-300 hover:shadow-lg hover:border-slate-600 hover:-translate-y-0.5 backdrop-blur-sm ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <Icon className={`w-5 h-5 ${styles.text}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <AnimatedValue end={value} />
        {change !== undefined && (
          <span className={`flex items-center text-xs font-semibold ${
              change > 0 ? 'text-green-400' : change < 0 ? 'text-red-500' : 'text-slate-500'
          }`}>
              {change > 0 && <ArrowUp className="w-3 h-3" />}
              {change < 0 && <ArrowDown className="w-3 h-3" />}
              {change === 0 && <Minus className="w-3 h-3" />}
              {Math.abs(change)}
          </span>
        )}
      </div>
    </div>
  );
};