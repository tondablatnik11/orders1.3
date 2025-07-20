// src/components/charts/D3OrdersOverTimeChart.jsx
"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { parseISO } from 'date-fns';

const ChartSkeleton = () => (
    <Card>
        <CardContent className="pt-6">
            <div className="skeleton h-8 w-48 mb-4"></div>
            <div className="skeleton h-[320px] w-full"></div>
        </CardContent>
    </Card>
);

const D3OrdersOverTimeChart = ({ summary }) => {
    const { t } = useUI();
    const [timeRange, setTimeRange] = useState(30); // Dny
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const dimensions = { width: 600, height: 320, margin: { top: 20, right: 30, bottom: 30, left: 40 } };

    const chartData = useMemo(() => {
        if (!summary || !summary.dailySummaries || summary.dailySummaries.length === 0) {
            return [];
        }
        
        const sortedData = summary.dailySummaries
            .map(day => ({ ...day, dateObj: parseISO(day.date) }))
            .sort((a, b) => a.dateObj - b.dateObj);
        
        const dataWithMovingAverage = sortedData.map((day, index, arr) => {
            const start = Math.max(0, index - 6);
            const slice = arr.slice(start, index + 1);
            const sum = slice.reduce((acc, curr) => acc + curr.total, 0);
            return {
                date: day.dateObj,
                total: day.total,
                completed: day.done,
                movingAverage: sum / slice.length
            };
        });

        if (timeRange === 0) return dataWithMovingAverage;
        return dataWithMovingAverage.slice(-timeRange);
    }, [summary, timeRange]);

    useEffect(() => {
        if (chartData.length === 0 || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const { width, height, margin } = dimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const x = d3.scaleTime()
            .domain(d3.extent(chartData, d => d.date))
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.total) * 1.1])
            .range([innerHeight, 0]);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%d/%m")))
            .selectAll("text")
            .style("fill", "#9CA3AF");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .selectAll("text")
            .style("fill", "#9CA3AF");

        const areaTotal = d3.area()
            .x(d => x(d.date))
            .y0(innerHeight)
            .y1(d => y(d.total));

        const areaCompleted = d3.area()
            .x(d => x(d.date))
            .y0(innerHeight)
            .y1(d => y(d.completed));
            
        const lineMovingAverage = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.movingAverage));

        g.append("path")
            .datum(chartData)
            .attr("fill", "rgba(136, 132, 216, 0.2)")
            .attr("stroke", "#8884d8")
            .attr("stroke-width", 2)
            .attr("d", areaTotal);
            
        g.append("path")
            .datum(chartData)
            .attr("fill", "rgba(16, 185, 129, 0.2)")
            .attr("stroke", "#10B981")
            .attr("stroke-width", 2)
            .attr("d", areaCompleted);
            
        g.append("path")
            .datum(chartData)
            .attr("fill", "none")
            .attr("stroke", "#FBBF24")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4 4")
            .attr("d", lineMovingAverage);

        // Tooltip logic
        const tooltip = d3.select(tooltipRef.current);
        const bisectDate = d3.bisector(d => d.date).left;

        const focus = g.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("line").attr("class", "lineY").attr("y1", 0).attr("y2", innerHeight).style("stroke", "#4A5568").style("stroke-width", 1);
        
        svg.append("rect")
            .attr("width", innerWidth)
            .attr("height", innerHeight)
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltip.style("opacity", 1); })
            .on("mouseout", () => { focus.style("display", "none"); tooltip.style("opacity", 0); })
            .on("mousemove", (event) => {
                const x0 = x.invert(d3.pointer(event)[0] - margin.left);
                const i = bisectDate(chartData, x0, 1);
                const d0 = chartData[i - 1];
                const d1 = chartData[i];
                const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                
                focus.select(".lineY").attr("transform", `translate(${x(d.date)}, 0)`);
                
                tooltip.html(`
                    <div class="text-white font-semibold">${d3.timeFormat("%d.%m.%Y")(d.date)}</div>
                    <div style="color: #8884d8;">${t.total}: ${d.total}</div>
                    <div style="color: #10B981;">${t.done}: ${d.completed}</div>
                    <div style="color: #FBBF24;">7-denní průměr: ${d.movingAverage.toFixed(1)}</div>
                `)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 28}px`);
            });

    }, [chartData, dimensions, t]);

    if (!summary || chartData.length === 0) {
       return <ChartSkeleton />;
    }

    return (
        <Card>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t.ordersOverTime}</h2>
                    <div className="flex items-center gap-1 bg-gray-700 p-1 rounded-md">
                        {[7, 30, 90, 0].map(range => (
                            <button 
                                key={range} 
                                onClick={() => setTimeRange(range)}
                                className={`px-2 py-1 text-xs rounded ${timeRange === range ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                            >
                                {range === 0 ? 'Vše' : `${range}D`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <svg ref={svgRef} width="100%" height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}></svg>
                    <div ref={tooltipRef} className="absolute bg-gray-800 p-2 border border-gray-700 rounded-md text-sm pointer-events-none" style={{ opacity: 0, transition: 'opacity 0.2s' }}></div>
                </div>
            </CardContent>
        </Card>
    );
}

export default D3OrdersOverTimeChart;