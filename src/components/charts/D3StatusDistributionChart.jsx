// src/components/charts/D3StatusDistributionChart.jsx
"use client";
import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { parseISO } from 'date-fns';

const D3StatusDistributionChart = () => {
    const { summary } = useData();
    const { t } = useUI();
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const legendRef = useRef(null);
    const [hiddenStatuses, setHiddenStatuses] = useState({});

    const { data, keys, colors } = useMemo(() => {
        if (!summary || !summary.statusByLoadingDate) return { data: [], keys: [], colors: {} };
        
        const totalCounts = {};
        Object.values(summary.statusByLoadingDate).forEach(day => {
            Object.keys(day).forEach(key => {
                if (key.startsWith('status')) {
                    totalCounts[key] = (totalCounts[key] || 0) + day[key];
                }
            });
        });

        const totalOrders = Object.values(totalCounts).reduce((sum, count) => sum + count, 0);
        const frequentStatuses = new Set(Object.entries(totalCounts)
            .filter(([, count]) => (count / totalOrders) > 0.02)
            .map(([key]) => key));
        
        const rawData = Object.values(summary.statusByLoadingDate || {})
            .filter(d => d.date && !isNaN(new Date(d.date).getTime()))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-30); // Zobrazit jen posledních 30 dní pro přehlednost

        const processedData = rawData.map(day => {
            const newDay = { date: parseISO(day.date), Ostatní: 0 };
            Object.keys(day).forEach(key => {
                if (key.startsWith('status')) {
                    if (frequentStatuses.has(key)) {
                        newDay[key] = day[key];
                    } else {
                        newDay['Ostatní'] += day[key];
                    }
                }
            });
            return newDay;
        });

        const statusKeys = Array.from(frequentStatuses);
        if (processedData.some(d => d.Ostatní > 0)) {
            statusKeys.push('Ostatní');
        }

        const colorMap = {};
        statusKeys.forEach(key => {
            const status = key.replace('status', '');
            colorMap[key] = status === 'Ostatní' ? '#64748B' : getStatusColor(status);
        });

        return { data: processedData, keys: statusKeys, colors: colorMap };
    }, [summary]);

    useEffect(() => {
        if (data.length === 0 || !svgRef.current) return;

        const activeKeys = keys.filter(key => !hiddenStatuses[key]);
        const stack = d3.stack().keys(activeKeys);
        const series = stack(data);

        const dimensions = { width: 600, height: 400, margin: { top: 10, right: 10, bottom: 20, left: 30 } };
        const { width, height, margin } = dimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(data.map(d => d.date))
            .range([0, innerWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1])) || 100])
            .range([innerHeight, 0]);

        g.selectAll(".bar-group")
            .data(series)
            .join("g")
            .attr("fill", d => colors[d.key])
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.date))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());
        
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%d/%m")).tickValues(x.domain().filter((d,i) => !(i%3))))
            .selectAll("text").style("fill", "#9CA3AF");

        g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text").style("fill", "#9CA3AF");
        
    }, [data, keys, colors, hiddenStatuses]);
    
    const toggleStatus = (key) => {
        setHiddenStatuses(prev => ({...prev, [key]: !prev[key]}));
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">{t.statusDistribution}</h2>
                <svg ref={svgRef} width="100%" height="400" viewBox="0 0 600 400"></svg>
                <div ref={legendRef} className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 text-xs">
                    {keys.map(key => (
                        <div key={key} onClick={() => toggleStatus(key)} className="flex items-center gap-1.5 cursor-pointer">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[key], opacity: hiddenStatuses[key] ? 0.3 : 1 }}></div>
                            <span className={hiddenStatuses[key] ? 'text-gray-500 line-through' : 'text-gray-300'}>
                                {key === 'Ostatní' ? 'Ostatní' : `Status ${key.replace('status', '')}`}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default D3StatusDistributionChart;