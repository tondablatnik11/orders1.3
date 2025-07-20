// src/components/charts/D3OrdersOverTimeChart.jsx
"use client";
import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import { parseISO, getDay, format } from 'date-fns';

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
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const dimensions = { width: 800, height: 150, margin: { top: 20, right: 30, bottom: 20, left: 30 } };

    const { yearData, colorScale } = useMemo(() => {
        if (!summary || !summary.dailySummaries) return { yearData: [], colorScale: () => '#2d3748' };
        
        const dataMap = new Map(summary.dailySummaries.map(d => [format(parseISO(d.date), 'yyyy-MM-dd'), d.total]));
        const maxVal = d3.max(summary.dailySummaries, d => d.total) || 1;
        const scale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);
        
        const year = new Date().getFullYear();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        const allDays = d3.timeDays(startDate, endDate);

        return {
            yearData: allDays.map(date => ({
                date,
                value: dataMap.get(format(date, 'yyyy-MM-dd')) || 0,
            })),
            colorScale: scale
        };
    }, [summary]);

    useEffect(() => {
        if (yearData.length === 0 || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const { width, height, margin } = dimensions;
        const cellSize = 12;
        const year = yearData[0].date.getFullYear();
        const weekDays = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        
        g.append("text")
            .attr("x", -15)
            .attr("y", -5)
            .attr("font-size", 10)
            .attr("fill", "#9CA3AF")
            .selectAll("tspan")
            .data(weekDays)
            .join("tspan")
            .attr("x", -15)
            .attr("y", (d, i) => i * (cellSize + 2) + cellSize / 1.5)
            .text(d => d);

        const yearGroup = g.selectAll("g")
            .data([year])
            .join("g")
            .attr("transform", `translate(10, 0)`);
            
        const tooltip = d3.select(tooltipRef.current);

        yearGroup.selectAll("rect")
            .data(yearData)
            .join("rect")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", d => d3.timeWeek.count(d3.timeYear(d.date), d.date) * (cellSize + 2))
            .attr("y", d => getDay(d.date) * (cellSize + 2))
            .attr("fill", d => d.value > 0 ? colorScale(d.value) : '#2d3748')
            .attr("rx", 2).attr("ry", 2)
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1);
                d3.select(event.target).style("stroke", "#38BDF8").style("stroke-width", 1.5);
            })
            .on("mousemove", (event, d) => {
                tooltip.html(`
                    <div class="font-semibold">${format(d.date, 'dd.MM.yyyy')}</div>
                    <div>${t.total}: <strong>${d.value}</strong></div>
                `)
                .style("left", `${event.pageX - 60}px`)
                .style("top", `${event.pageY - 50}px`);
            })
            .on("mouseout", (event) => {
                tooltip.style("opacity", 0);
                d3.select(event.target).style("stroke", "none");
            });

    }, [yearData, colorScale, dimensions, t]);

    if (!summary || yearData.length === 0) {
       return <ChartSkeleton />;
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">{t.ordersOverTime}</h2>
                <div className="relative">
                    <svg ref={svgRef} width="100%" height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}></svg>
                    <div ref={tooltipRef} className="absolute bg-gray-800 p-2 border border-gray-700 rounded-md text-sm pointer-events-none" style={{ opacity: 0, transition: 'opacity 0.2s' }}></div>
                </div>
            </CardContent>
        </Card>
    );
}

export default D3OrdersOverTimeChart;