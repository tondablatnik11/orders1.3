// src/components/charts/D3GeoChart.jsx
"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import worldCountries from './world_countries.json';
import { MapOff } from 'lucide-react';

const D3GeoChart = ({ data = [], onCountryClick }) => {
    const { t } = useUI();
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const [hoveredCountry, setHoveredCountry] = useState(null);

    const dimensions = { width: 800, height: 450 };

    useEffect(() => {
        if (!data || data.length === 0 || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Vyčistit SVG při překreslení

        const dataMap = new Map(data.map(d => [d.id, d.value]));
        const maxVal = d3.max(data, d => d.value) || 1;
        const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);

        const projection = d3.geoMercator()
            .scale(130)
            .center([0, 50])
            .translate([dimensions.width / 2, dimensions.height / 2]);

        const pathGenerator = d3.geoPath().projection(projection);

        const zoom = d3.zoom()
            .scaleExtent([1, 8]) // Omezení zoomu
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        const g = svg.append("g");

        // Vykreslení zemí
        g.selectAll("path")
            .data(worldCountries.features)
            .enter()
            .append("path")
            .attr("d", pathGenerator)
            .attr("fill", d => dataMap.has(d.id) ? colorScale(dataMap.get(d.id)) : "#4B5563")
            .style("stroke", d => hoveredCountry === d.id ? '#38BDF8' : '#1F2937')
            .style("stroke-width", d => hoveredCountry === d.id ? 1.5 : 0.5)
            .on("mouseover", function (event, d) {
                setHoveredCountry(d.id);
                tooltipRef.current.style.opacity = 1;
            })
            .on("mousemove", function (event, d) {
                const countryData = data.find(item => item.id === d.id);
                tooltipRef.current.innerHTML = `${d.properties.name}<br/><strong>${countryData ? countryData.value : 'N/A'}</strong> ${t.orders || 'zakázek'}`;
                tooltipRef.current.style.left = `${event.pageX + 15}px`;
                tooltipRef.current.style.top = `${event.pageY - 28}px`;
            })
            .on("mouseout", function () {
                setHoveredCountry(null);
                tooltipRef.current.style.opacity = 0;
            })
            .on("click", (event, d) => {
                if (onCountryClick && dataMap.has(d.id)) {
                    onCountryClick(d.id);
                }
            });

    }, [data, dimensions.width, dimensions.height, onCountryClick, t.orders, hoveredCountry]);

    if (!data || data.length === 0) {
        return (
             <Card>
                <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Geografické rozložení</h2>
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                        <MapOff className="w-16 h-16 mb-4" />
                        <p className="font-semibold">{t.noDataAvailable}</p>
                        <p className="text-sm">Nahrajte data pro zobrazení mapy.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const topCountries = [...data].sort((a, b) => b.value - a.value).slice(0, 20);

    return (
        <Card>
            <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Geografické rozložení zakázek</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 relative">
                        <svg ref={svgRef} width="100%" height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}></svg>
                        <div ref={tooltipRef} className="absolute bg-gray-800 text-white p-2 rounded-md text-sm pointer-events-none" style={{ opacity: 0, transition: 'opacity 0.2s' }}></div>
                    </div>
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-semibold mb-2 text-gray-300">TOP 20 Zemí</h3>
                        <div className="space-y-1 h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                            {topCountries.map(country => (
                                <div 
                                    key={country.id} 
                                    className={`flex justify-between items-center p-2 rounded-md list-none transition-all duration-200 cursor-pointer ${hoveredCountry === country.id ? 'bg-blue-600/30' : 'bg-gray-800 hover:bg-gray-700'}`}
                                    onMouseEnter={() => setHoveredCountry(country.id)}
                                    onMouseLeave={() => setHoveredCountry(null)}
                                    onClick={() => onCountryClick && onCountryClick(country.id)}
                                >
                                    <span className="font-medium text-gray-200">{country.id}</span>
                                    <span className="font-bold text-blue-400">{country.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default D3GeoChart;