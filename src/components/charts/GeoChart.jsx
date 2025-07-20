// src/components/charts/GeoChart.jsx
'use client';
import React, { useState } from 'react';
import { ResponsiveChoropleth } from '@nivo/geo';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import worldCountries from './world_countries.json';
import { MapOff } from 'lucide-react';

const GeoChart = ({ data = [], onCountryClick }) => {
    const { t } = useUI();
    const [hoveredCountry, setHoveredCountry] = useState(null);

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
                    <div className="md:col-span-2 h-[300px] md:h-[400px]">
                        <ResponsiveChoropleth
                            data={data}
                            features={worldCountries.features}
                            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                            colors="blues"
                            domain={[0, Math.max(...data.map(d => d.value), 1)]}
                            unknownColor="#374151" // Tmavší pro lepší kontrast
                            label="properties.name"
                            valueFormat=".2s"
                            projectionType="mercator"
                            projectionScale={150}
                            projectionRotation={[-10, -52, 0]}
                            projectionTranslation={[0.5, 0.7]}
                            enableGraticule={true}
                            graticuleLineColor="rgba(255, 255, 255, 0.1)"
                            borderWidth={0.5}
                            borderColor="#1F2937"
                            // UPRAVENO: Dynamický border pro zvýraznění
                            borderColor={(feature) => 
                                hoveredCountry === feature.id ? '#38BDF8' : '#1F2937'
                            }
                            borderWidth={(feature) =>
                                hoveredCountry === feature.id ? 2 : 0.5
                            }
                            theme={{
                                tooltip: { container: { background: '#1F2937', color: '#FFF' } },
                                labels: { text: { fill: '#FFF' } },
                                legends: { text: { fill: '#DDD' } },
                            }}
                            legends={[]}
                            onClick={(feature) => {
                                if (onCountryClick && feature.data) {
                                    onCountryClick(feature.data.id);
                                }
                            }}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-semibold mb-2 text-gray-300">TOP 20 Zemí</h3>
                        <div className="space-y-2 h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                            <ul className="space-y-1">
                                {topCountries.map(country => (
                                    <li 
                                        key={country.id} 
                                        className="flex justify-between items-center bg-gray-800 p-2 rounded-md list-none transition-all duration-200 hover:bg-gray-700"
                                        onMouseEnter={() => setHoveredCountry(country.id)}
                                        onMouseLeave={() => setHoveredCountry(null)}
                                        onClick={() => onCountryClick && onCountryClick(country.id)}
                                    >
                                        <span className="font-medium text-gray-200">{country.id}</span>
                                        <span className="font-bold text-blue-400">{country.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GeoChart;