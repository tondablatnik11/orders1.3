// src/components/charts/D3OrdersOverTimeChart.jsx
"use client";
import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { parseISO, format } from 'date-fns';

const D3OrdersOverTimeChart = ({ summary }) => {
    const { t } = useUI();
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const dimensions = { width: 800, height: 400, margin: { top: 20, right: 30, bottom: 30, left: 50 } };

    const chartData = useMemo(() => {
        if (!summary || !summary.dailySummaries) return [];
        
        const sortedData = summary.dailySummaries
            .map(day => ({ ...day, dateObj: parseISO(day.date) }))
            .sort((a, b) => a.dateObj - b.dateObj);
        
        return sortedData.map((day, index, arr) => {
            const start = Math.max(0, index - 6);
            const slice = arr.slice(start, index + 1);
            const sum = slice.reduce((acc, curr) => acc + curr.total, 0);
            return {
                date: day.dateObj,
                total: day.total,
                completed: day.status_done_all,
                movingAverage: sum / slice.length
            };
        });
    }, [summary]);

    useEffect(() => {
        if (chartData.length === 0 || !svgRef.current) return;

        const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, dimensions.width, dimensions.height]);
        svg.selectAll("*").remove();

        const { width, height, margin } = dimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const x = d3.scaleTime().domain(d3.extent(chartData, d => d.date)).range([0, innerWidth]);
        const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d.total) * 1.1]).nice().range([innerHeight, 0]);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0).tickFormat(d3.timeFormat("%d.%m")))
            .call(g => g.selectAll(".domain, .tick line").attr("stroke", "#374151"))
            .call(g => g.selectAll("text").attr("fill", "#9ca3af"));

        g.append("g")
            .call(d3.axisLeft(y).ticks(height / 40))
            .call(g => g.selectAll(".domain").remove())
            .call(g => g.selectAll(".tick line").clone().attr("x2", innerWidth).attr("stroke", "#374151").attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll("text").attr("fill", "#9ca3af"));

        const defs = svg.append("defs");
        const createGradient = (id, color) => {
            const gradient = defs.append("linearGradient").attr("id", id).attr("gradientTransform", "rotate(90)");
            gradient.append("stop").attr("offset", "5%").attr("stop-color", color).attr("stop-opacity", 0.6);
            gradient.append("stop").attr("offset", "95%").attr("stop-color", color).attr("stop-opacity", 0);
        };
        createGradient("gradient-total", "#3b82f6");
        createGradient("gradient-completed", "#10b981");

        const area = (yValue) => d3.area().x(d => x(d.date)).y0(innerHeight).y1(d => y(d[yValue]));
        const line = (yValue) => d3.line().x(d => x(d.date)).y(d => y(d[yValue]));

        g.append("path").datum(chartData).attr("fill", "url(#gradient-total)").attr("d", area("total"));
        g.append("path").datum(chartData).attr("fill", "url(#gradient-completed)").attr("d", area("completed"));
        g.append("path").datum(chartData).attr("fill", "none").attr("stroke", "#3b82f6").attr("stroke-width", 2).attr("d", line("total"));
        g.append("path").datum(chartData).attr("fill", "none").attr("stroke", "#10b981").attr("stroke-width", 2).attr("d", line("completed"));
        g.append("path").datum(chartData).attr("fill", "none").attr("stroke", "#FBBF24").attr("stroke-width", 2).attr("stroke-dasharray", "3,3").attr("d", line("movingAverage"));

        const tooltip = d3.select(tooltipRef.current);
        const bisectDate = d3.bisector(d => d.date).left;
        const focus = g.append("g").style("display", "none");
        focus.append("line").attr("y1", 0).attr("y2", innerHeight).attr("stroke", "#6b7280").attr("stroke-width", 1);
        focus.append("circle").attr("r", 4).attr("class", "circle-total").attr("fill", "#3b82f6").attr("stroke", "#0f172a").attr("stroke-width", 2);
        focus.append("circle").attr("r", 4).attr("class", "circle-completed").attr("fill", "#10b981").attr("stroke", "#0f172a").attr("stroke-width", 2);
        
        svg.append("rect")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .attr("width", innerWidth)
            .attr("height", innerHeight)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltip.style("opacity", 1); })
            .on("mouseout", () => { focus.style("display", "none"); tooltip.style("opacity", 0); })
            .on("mousemove", (event) => {
                const pointer = d3.pointer(event, this);
                const x0 = x.invert(pointer[0] - margin.left);
                const i = bisectDate(chartData, x0, 1);
                const d0 = chartData[i - 1];
                const d1 = chartData[i];
                if (!d0 || !d1) return;
                const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                
                focus.attr("transform", `translate(${x(d.date)},0)`);
                focus.select(".circle-total").attr("cy", y(d.total));
                focus.select(".circle-completed").attr("cy", y(d.completed));
                
                tooltip.html(`
                    <div class="font-semibold text-white">${format(d.date, 'dd.MM.yyyy')}</div>
                    <div style="color: #3b82f6;">${t.total}: <strong>${d.total}</strong></div>
                    <div style="color: #10b981;">${t.done}: <strong>${d.completed}</strong></div>
                    <div style="color: #FBBF24;">7-denní průměr: <strong>${d.movingAverage.toFixed(1)}</strong></div>
                `)
                .style("left", `${event.pageX + 20}px`)
                .style("top", `${event.pageY}px`);
            });

    }, [chartData, dimensions, t]);

    if (!summary) return null;

    return (
        <Card>
            <CardContent>
                <h2 className="text-lg font-semibold mb-4">{t.ordersOverTime}</h2>
                <div className="relative">
                    <svg ref={svgRef}></svg>
                    <div ref={tooltipRef} className="absolute bg-slate-800/80 backdrop-blur-sm p-2 border border-slate-700 rounded-md text-xs pointer-events-none shadow-lg" style={{ opacity: 0, transition: 'opacity 0.2s' }}></div>
                </div>
            </CardContent>
        </Card>
    );
};

export default D3OrdersOverTimeChart;