// src/components/shared/SummaryCard.jsx
"use client";
import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// ... (barevné třídy zůstávají stejné)

// Nová komponenta pro animované číslo
const AnimatedValue = ({ end }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (typeof end !== 'number') {
            setCurrent(end); // Pokud to není číslo, zobrazíme rovnou
            return;
        }
        
        let start = 0;
        const duration = 1000; // 1 sekunda
        const frameRate = 60;
        const totalFrames = duration / (1000 / frameRate);
        const increment = (end - start) / totalFrames;

        let currentFrame = 0;
        const timer = setInterval(() => {
            currentFrame++;
            const newValue = Math.round(start + (increment * currentFrame));
            if (currentFrame === totalFrames) {
                setCurrent(end);
                clearInterval(timer);
            } else {
                setCurrent(newValue);
            }
        }, 1000 / frameRate);

        return () => clearInterval(timer);
    }, [end]);

    return <p className="text-2xl font-bold text-white">{current ?? 0}</p>;
};


export const SummaryCard = ({ title, value, icon: Icon, color = 'blue', change, onClick }) => {
    // ... (styly zůstávají stejné) ...

    return (
        <div 
          className={`col-span-1 bg-slate-800/50 rounded-lg border border-slate-700 p-3 transition-all duration-300 hover:shadow-lg hover:border-slate-600 hover:-translate-y-0.5 backdrop-blur-sm ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            <Icon className={`w-5 h-5 ${colorClasses[color].text}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedValue end={value} />
            {/* Indikátor změny zůstává stejný */}
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