"use client";
import React, { useState, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import DailyStatusChart from '../charts/DailyStatusChart';
import { format } from 'date-fns';

export default function DailySummaryTab() {
    const { t } = useUI();
    const { summary } = useData();
    const [selectedDate, setSelectedDate] = useState('');
    
    const availableDates = summary?.dailySummaries.map(d => d.date) || [];

    useEffect(() => {
        if (availableDates.length > 0 && !selectedDate) {
            setSelectedDate(availableDates[availableDates.length - 1]);
        }
    }, [availableDates, selectedDate]);
    
    const selectedDayData = summary?.dailySummaries.find(d => d.date === selectedDate);
    const chartData = Object.entries(selectedDayData?.statusCounts || {}).map(([status, count]) => ({ name: `Status ${status}`, value: count }));

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">{t.dailySummary}</h2>
                    <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 rounded-md bg-gray-700 border border-gray-600">
                        {availableDates.map(date => (
                            <option key={date} value={date}>{format(new Date(date), 'dd/MM/yyyy')}</option>
                        ))}
                    </select>
                </div>
                {chartData.length > 0 ? (
                    <DailyStatusChart data={chartData} />
                ) : (
                    <div className="flex items-center justify-center h-80 bg-gray-700 text-gray-400 rounded-xl mt-4">
                        <p className="text-lg">{t.noDataAvailable}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}