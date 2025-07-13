"use client";
import React, { useState, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { CHART_COLORS } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const renderActiveShape = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(- (Math.PI / 180) * midAngle);
    const cos = Math.cos(- (Math.PI / 180) * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-sm">{payload.name}</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff">{`${value}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">{`(Rate ${(percent * 100).toFixed(2)}%)`}</text>
        </g>
    );
};

export default function StatusDistributionChart() {
    const { summary } = useData();
    const { t } = useUI();
    const [chartType, setChartType] = useState('stackedBar');
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = useCallback((_, index) => setActiveIndex(index), []);

    const pieData = Object.entries(summary?.statusCounts || {}).map(([status, count]) => ({ name: `Status ${status}`, value: count })).filter(item => item.value > 0);
    
    // OPRAVA: Správné řazení dat pro graf podle skutečného data
    const parseChartDate = (dateStr) => { // formát "dd/MM"
      const [day, month] = dateStr.split('/');
      // Vytvoříme plné datum pro správné porovnání (rok není důležitý, pokud je stejný pro všechna data)
      return new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day));
    };
    const stackedData = Object.values(summary?.statusByLoadingDate || {}).sort((a, b) => parseChartDate(a.date) - parseChartDate(b.date));

    const uniqueStatuses = Array.from(new Set(summary?.allOrdersData?.map(row => Number(row.Status)).filter(s => !isNaN(s)))).sort((a, b) => a - b);

    if (pieData.length === 0) {
        return <Card><CardContent><h2 className="text-xl font-semibold mb-2">{t.statusDistribution}</h2><p className="text-center p-8">{t.noDataAvailable}</p></CardContent></Card>
    }

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t.statusDistribution}</h2>
                    <div className="flex gap-2">
                         <button onClick={() => setChartType('stackedBar')} className={`p-2 rounded-full ${chartType === 'stackedBar' ? 'bg-blue-600' : 'bg-gray-700'}`} title={t.stackedBarChart}><BarChart3 className="w-5 h-5" /></button>
                         <button onClick={() => setChartType('pie')} className={`p-2 rounded-full ${chartType === 'pie' ? 'bg-blue-600' : 'bg-gray-700'}`} title={t.pieChart}><PieChartIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                    {chartType === 'pie' ? (
                        <PieChart>
                            <Pie activeIndex={activeIndex} activeShape={renderActiveShape} data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" dataKey="value" onMouseEnter={onPieEnter}>
                                {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                            </Pie>
                        </PieChart>
                    ) : (
                        <BarChart data={stackedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} />
                            <YAxis stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} itemStyle={{ color: '#E5E7EB' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }}/>
                            <Legend wrapperStyle={{ color: '#D1D5DB', paddingTop: '10px' }} />
                            {uniqueStatuses.map((status, index) => (
                                <Bar key={`status-bar-${status}`} dataKey={`status${status}`} name={`Status ${status}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stackId="statusStack" radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}