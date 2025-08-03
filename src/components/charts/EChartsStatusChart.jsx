// src/components/charts/EChartsStatusChart.jsx
"use client";
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { BarChart2 } from 'lucide-react';

const EChartsStatusChart = () => {
    const { summary } = useData();
    const { t } = useUI();

    if (!summary || !summary.statusCounts) {
        return <Card><CardContent><p>{t.noDataAvailable}</p></CardContent></Card>;
    }

    const chartData = Object.entries(summary.statusCounts)
        .map(([status, count]) => ({
            value: count,
            name: `Status ${status}`,
            itemStyle: { color: getStatusColor(status) },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}', // Zobrazí hodnotu
                color: '#e5e7eb' // Světlá barva pro text
            }
        }))
        .sort((a,b) => Number(a.name.replace('Status ', '')) - Number(b.name.replace('Status ', '')));

    const option = {
        grid: {
            top: '15%',
            left: '3%',
            right: '4%',
            bottom: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: chartData.map(d => d.name),
            axisLabel: {
                color: '#9ca3af'
            },
            axisTick: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: '#4b5563'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#9ca3af'
            },
            splitLine: {
                lineStyle: {
                    color: '#374151'
                }
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            borderColor: '#4b5563',
            textStyle: {
                color: '#e5e7eb'
            }
        },
        series: [{
            data: chartData,
            type: 'pictorialBar',
            barCategoryGap: '0%',
            symbol: 'path://M0,10 L10,10 C5,10 5,5 0,0 C-5,5 -5,10 0,10 z',
        }]
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-sky-400" />
                    {t.statusDistribution}
                </h2>
                <ReactECharts option={option} style={{ height: '350px' }} notMerge={true} lazyUpdate={true} />
            </CardContent>
        </Card>
    );
};

export default EChartsStatusChart;