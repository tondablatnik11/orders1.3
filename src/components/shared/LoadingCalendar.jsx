// src/components/shared/LoadingCalendar.jsx
"use client";
import React, { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const LoadingCalendar = ({ loadings, onSelectLoading }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const weekStartsOn = 1; // Pondělí

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center p-2 bg-gray-700 rounded-t-lg">
                <button onClick={() => setCurrentDate(prev => addDays(prev, -7))} className="p-2 rounded-full hover:bg-gray-600">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold">
                    {format(startOfWeek(currentDate, { weekStartsOn }), 'dd.MM.yyyy')} - {format(addDays(startOfWeek(currentDate, { weekStartsOn }), 6), 'dd.MM.yyyy')}
                </span>
                <button onClick={() => setCurrentDate(prev => addDays(prev, 7))} className="p-2 rounded-full hover:bg-gray-600">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const startDate = startOfWeek(currentDate, { weekStartsOn });

        for (let i = 0; i < 7; i++) {
            const day = addDays(startDate, i);
            const dayLoadings = loadings.filter(l => isSameDay(parseISO(l.loadingDate), day));
            
            days.push(
                <div key={day.toString()} className="flex-1 border-r border-gray-700 last:border-r-0">
                    <div className="text-center font-semibold p-2 border-b border-gray-700">
                        <p className="text-sm text-gray-400">{format(day, 'EEE', { locale: cs })}</p>
                        <p className="text-lg">{format(day, 'd')}</p>
                    </div>
                    <div className="p-2 h-96 overflow-y-auto space-y-2">
                        {dayLoadings.map(loading => (
                            <div 
                                key={loading.id}
                                onClick={() => onSelectLoading(loading)}
                                className="bg-blue-900/50 p-2 rounded-md cursor-pointer hover:bg-blue-800"
                            >
                                <p className="font-semibold text-sm">{loading.carrierName}</p>
                                <p className="text-xs text-gray-300">{loading.order_numbers.length} objednávek</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return <div className="flex">{days}</div>;
    };


    return (
        <div className="border border-gray-700 rounded-lg">
            {renderHeader()}
            {renderDays()}
        </div>
    );
};

export default LoadingCalendar;