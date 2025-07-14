'use client';
import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Sphere, Graticule } from 'react-simple-maps';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const GeoChart = ({ data }) => {
    const { t } = useUI();
    const [tooltipContent, setTooltipContent] = useState('');

    if (!data || Object.keys(data).length === 0) {
        return (
            <Card>
                <CardContent>
                    <h2 className="text-xl font-semibold mb-4">Geografické rozložení</h2>
                    <div className="flex items-center justify-center h-[350px]">
                        <p>{t.noDataAvailable}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const maxOrders = Math.max(...Object.values(data));

    const getColor = (count) => {
        if (!count) return "#4B5563"; // Tmavě šedá pro země bez dat
        const intensity = Math.min(count / (maxOrders * 0.7), 1);
        const r = Math.round(13 + (107 - 13) * intensity);
        const g = Math.round(138 + (227 - 138) * intensity);
        const b = Math.round(188 + (255 - 188) * intensity);
        return `rgb(${r},${g},${b})`;
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">Geografické rozložení zakázek</h2>
                <div className="relative" style={{ width: "100%", height: "400px" }}>
                    {tooltipContent && (
                        <div className="absolute top-0 left-0 bg-gray-900 text-white p-2 rounded-md shadow-lg pointer-events-none text-sm">
                            {tooltipContent}
                        </div>
                    )}
                    <ComposableMap projectionConfig={{ scale: 120 }} style={{ width: "100%", height: "100%" }}>
                        <ZoomableGroup center={[20, 52]} zoom={4.5}>
                            <Sphere stroke="#E4E5E6" strokeWidth={0.2} fill="transparent" />
                            <Graticule stroke="#E4E5E6" strokeWidth={0.2} />
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map(geo => {
                                        const countryCode = geo.properties["Alpha-2"];
                                        const orderCount = data[countryCode] || 0;
                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={getColor(orderCount)}
                                                stroke="#1F2937"
                                                strokeWidth={0.3}
                                                onMouseEnter={() => {
                                                    const { name } = geo.properties;
                                                    setTooltipContent(`${name}: ${orderCount} zakázek`);
                                                }}
                                                onMouseLeave={() => setTooltipContent('')}
                                                style={{
                                                    default: { outline: 'none' },
                                                    hover: { fill: "#F53", outline: 'none', cursor: 'pointer' },
                                                    pressed: { outline: 'none' },
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>
                </div>
            </CardContent>
        </Card>
    );
};

export default GeoChart;