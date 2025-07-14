'use client';
import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Sphere, Graticule } from 'react-simple-maps';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';

// Odkaz na topologická data světa
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
    
    // Najdeme maximální hodnotu pro škálování barev
    const maxOrders = Math.max(...Object.values(data));

    // Funkce pro určení barvy na základě počtu objednávek
    const getColor = (count) => {
        if (!count) return "#556677"; // Barva pro země bez dat
        const intensity = Math.min(count / (maxOrders * 0.7), 1); // Normalizujeme hodnotu
        const startColor = { r: 13, g: 138, b: 188 }; // Tmavě modrá
        const endColor = { r: 107, g: 227, b: 255 }; // Světle modrá
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * intensity);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * intensity);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * intensity);
        return `rgb(${r},${g},${b})`;
    };

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">Geografické rozložení zakázek</h2>
                <div className="relative" style={{ width: "100%", height: "400px" }}>
                    {tooltipContent && (
                        <div className="absolute top-0 left-0 bg-gray-900 text-white p-2 rounded-md shadow-lg pointer-events-none">
                            {tooltipContent}
                        </div>
                    )}
                    <ComposableMap projectionConfig={{ scale: 120 }} style={{ width: "100%", height: "100%" }}>
                        <ZoomableGroup center={[15, 50]} zoom={4}>
                            <Sphere stroke="#E4E5E6" strokeWidth={0.5} fill="transparent" />
                            <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
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
                                                stroke="#D6D6DA"
                                                onMouseEnter={() => {
                                                    const { name } = geo.properties;
                                                    setTooltipContent(`${name}: ${orderCount} zakázek`);
                                                }}
                                                onMouseLeave={() => {
                                                    setTooltipContent('');
                                                }}
                                                style={{
                                                    default: { outline: 'none' },
                                                    hover: { fill: "#F53", outline: 'none' },
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