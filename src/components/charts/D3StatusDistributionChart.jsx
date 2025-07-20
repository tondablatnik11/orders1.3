// src/components/charts/D3StatusDistributionChart.jsx
"use client";
import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { parseISO } from 'date-fns';

const D3StatusDistributionChart = ({ onBarClick }) => {
    const { summary } = useData();
    const { t } = useUI();
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const dimensions = { width: 800, height: 400, margin: { top: 20, right: 20, bottom: 40, left: 50 } };

    const { data, keys, colors } = useMemo(() => {
        if (!summary || !summary.statusByLoadingDate) return { data: [], keys: [], colors: {} };

        const allStatusKeys = Array.from(new Set(
            Object.values(summary.statusByLoadingDate).flatMap(day => 
                Object.keys(day).filter(key => key.startsWith('status'))
            )
        )).sort((a, b) => parseInt(a.replace('status', '')) - parseInt(b.replace('status', '')));
        
        const colorMap = {};
        allStatusKeys.forEach(key => {
            const status = key.replace('status', '');
            colorMap[key] = getStatusColor(status);
        });

        const processedData = Object.values(summary.statusByLoadingDate)
            .filter(d => d.date && !isNaN(new Date(d.date).getTime()))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(d => {
                const dayData = { date: parseISO(d.date) };
                allStatusKeys.forEach(key => {
                    dayData[key] = d[key] || 0;
                });
                return dayData;
            });
        
        return { data: processedData, keys: allStatusKeys, colors: colorMap };
    }, [summary]);

    useEffect(() => {
        if (data.length === 0 || !svgRef.current) return;

        const { width, height, margin } = dimensions;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height]);
        
        svg.selectAll("*").remove();

        const x = d3.scaleBand()
            .domain(data.map(d => d.date))
            .range([0, innerWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d3.sum(keys, k => d[k]))]).nice()
            .range([innerHeight, 0]);

        const xAxis = g => g
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(d3.timeFormat("%d.%m")))
            .call(g => g.selectAll(".domain").remove());

        const yAxis = g => g
            .attr("transform", `translate(0,0)`)
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.selectAll(".domain").remove());

        const series = d3.stack().keys(keys)(data);
        
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const gx = g.append("g");
        const gy = g.append("g");
        
        const barGroups = g.append("g")
            .selectAll("g")
            .data(series)
            .join("g")
            .attr("fill", d => colors[d.key]);

        barGroups.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.date))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

        // Zoom a Pan logika
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .translateExtent([[0, 0], [innerWidth, innerHeight]])
            .extent([[0, 0], [innerWidth, innerHeight]])
            .on("zoom", (event) => {
                const newX = event.transform.rescaleX(x);
                gx.call(xAxis.scale(newX));
                barGroups.selectAll("rect")
                    .attr("x", d => newX(d.data.date))
                    .attr("width", newX.bandwidth());
            });

        // Overlay pro zachytávání eventů myši
        const zoomRect = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .append("rect")
            .attr("width", innerWidth)
            .attr("height", innerHeight)
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(zoom);

        gx.call(xAxis);
        gy.call(yAxis);
        
    }, [data, keys, colors, dimensions]);

    return (
        <Card>
            <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">{t.statusDistribution}</h2>
                <div className="relative">
                    <svg ref={svgRef}></svg>
                    <div ref={tooltipRef} className="absolute bg-gray-800 p-2 border border-gray-700 rounded-md text-sm pointer-events-none" style={{ opacity: 0, transition: 'opacity 0.2s' }}></div>
                </div>
            </CardContent>
        </Card>
    );
};

export default D3StatusDistributionChart;