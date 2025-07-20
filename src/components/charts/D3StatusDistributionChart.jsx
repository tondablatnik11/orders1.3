// src/components/charts/D3StatusDistributionChart.jsx
"use client";
import React, { useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { getStatusColor } from '@/lib/utils';
import { Card, CardContent } from '../ui/Card';
import { parseISO, format } from 'date-fns';

const D3StatusDistributionChart = ({ onBarClick }) => {
    const { summary } = useData();
    const { t } = useUI();
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const dimensions = { width: 800, height: 400, margin: { top: 20, right: 20, bottom: 60, left: 50 } };

    const { data, keys, colors, legendData } = useMemo(() => {
        if (!summary || !summary.statusByLoadingDate) return { data: [], keys: [], colors: {}, legendData: [] };

        const allStatusKeys = Array.from(new Set(
            Object.values(summary.statusByLoadingDate).flatMap(day => 
                Object.keys(day).filter(key => key.startsWith('status'))
            )
        )).sort((a, b) => parseInt(a.replace('status', '')) - parseInt(b.replace('status', '')));
        
        const colorMap = {};
        const legendItems = [];
        allStatusKeys.forEach(key => {
            const status = key.replace('status', '');
            colorMap[key] = getStatusColor(status);
            legendItems.push({ key, label: `Status ${status}`, color: colorMap[key] });
        });

        const processedData = Object.values(summary.statusByLoadingDate)
            .filter(d => d.date && !isNaN(new Date(d.date).getTime()))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(d => {
                const dayData = { date: parseISO(d.date), total: 0 };
                allStatusKeys.forEach(key => {
                    dayData[key] = d[key] || 0;
                    dayData.total += dayData[key];
                });
                return dayData;
            });
        
        return { data: processedData, keys: allStatusKeys, colors: colorMap, legendData: legendItems };
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
            .domain([0, d3.max(data, d => d.total)]).nice()
            .range([innerHeight, 0]);

        const xAxis = g => g
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(d3.timeFormat("%d.%m")))
            .call(g => g.selectAll("text").style("fill", "#9CA3AF"))
            .call(g => g.selectAll(".domain, .tick line").remove());

        const yAxis = g => g
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.selectAll("text").style("fill", "#9CA3AF"))
            .call(g => g.selectAll(".domain, .tick line").remove());
        
        const series = d3.stack().keys(keys)(data);
        
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const gx = g.append("g");
        const gy = g.append("g");
        
        const barsContainer = g.append("g")
            .selectAll("g")
            .data(series)
            .join("g")
            .attr("fill", d => colors[d.key]);

        barsContainer.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.date))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

        gx.call(xAxis);
        gy.call(yAxis);
        
        const tooltip = d3.select(tooltipRef.current);
        const bisectDate = d3.bisector(d => d.date).left;

        const focus = g.append("g").style("display", "none");
        focus.append("line").attr("y1", 0).attr("y2", innerHeight).attr("stroke", "#6b7280").attr("stroke-width", 1).attr("stroke-dasharray", "3,3");

        const zoomRect = g.append("rect")
            .attr("width", innerWidth)
            .attr("height", innerHeight)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltip.style("opacity", 1); })
            .on("mouseout", () => { focus.style("display", "none"); tooltip.style("opacity", 0); })
            .on("mousemove", (event) => {
                const pointerX = d3.pointer(event)[0];
                const date = x.domain()[d3.bisectCenter(x.range(), pointerX) - 1];
                if (!date) return;
                
                const i = bisectDate(data, date, 1) - 1;
                const d = data[i];

                focus.attr("transform", `translate(${x(d.date) + x.bandwidth() / 2},0)`);
                
                tooltip.html(`
                    <div class="font-semibold text-white">${format(d.date, 'dd.MM.yyyy')}</div>
                    ${keys.map(key => `<div style="color: ${colors[key]}">Status ${key.replace('status', '')}: <strong>${d[key]}</strong></div>`).join('')}
                `)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY}px`);
            });

        const zoom = d3.zoom()
            .scaleExtent([1, 10]) 
            .translateExtent([[0, 0], [innerWidth, innerHeight]])
            .extent([[0, 0], [innerWidth, innerHeight]])
            .on("zoom", (event) => {
                const newX = event.transform.rescaleX(x);
                gx.call(xAxis.scale(newX));
                barsContainer.selectAll("rect")
                    .attr("x", d => newX(d.data.date))
                    .attr("width", newX.bandwidth());
            });

        zoomRect.call(zoom);

    }, [data, keys, colors, dimensions, t]);

    return (
        <Card>
            <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">{t.statusDistribution}</h2>
                <div className="relative">
                    <svg ref={svgRef}></svg>
                    <div ref={tooltipRef} className="absolute bg-gray-800 p-2 border border-gray-700 rounded-md text-xs pointer-events-none" style={{ opacity: 0, transition: 'opacity 0.2s' }}></div>
                </div>
                 <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
                    {legendData.map(item => (
                        <div key={item.key} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-300">{item.label}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default D3StatusDistributionChart;