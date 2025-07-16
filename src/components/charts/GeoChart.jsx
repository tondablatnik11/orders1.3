'use client';
import React from 'react';
import { ResponsiveChoropleth } from '@nivo/geo';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import worldCountries from './world_countries.json';

const GeoChart = ({ data = [] }) => {
    const { t } = useUI();
    
    if (!data || data.length === 0) {
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
    
    const topCountries = [...data].sort((a, b) => b.value - a.value).slice(0, 5);

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">Geografické rozložení zakázek</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2" style={{ height: '400px' }}>
                        <ResponsiveChoropleth
                            data={data}
                            features={worldCountries.features}
                            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                            colors="blues"
                            domain={[0, Math.max(...data.map(d => d.value), 1)]}
                            unknownColor="#4B5563"
                            label="properties.name"
                            valueFormat=".2s"
                            projectionType="mercator"
                            projectionScale={150} // Oddálení mapy
                            projectionTranslation={[0.5, 0.7]} // Vycentrování
                            enableGraticule={true}
                            graticuleLineColor="#666666"
                            borderWidth={0.5}
                            borderColor="#1F2937"
                            theme={{
                                tooltip: { container: { background: '#1F2937', color: '#FFF' } },
                                labels: { text: { fill: '#FFF' } },
                                legends: { text: { fill: '#FFF' } },
                            }}
                            legends={[
                                {
                                    anchor: 'bottom-left',
                                    direction: 'column',
                                    justify: true,
                                    translateX: 20,
                                    translateY: -60,
                                    itemsSpacing: 0,
                                    itemWidth: 94,
                                    itemHeight: 18,
                                    itemDirection: 'left-to-right',
                                    itemTextColor: '#DDD',
                                    itemOpacity: 0.85,
                                    symbolSize: 18,
                                },
                            ]}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-semibold mb-2 text-gray-300">TOP 5 Zemí</h3>
                        <ul className="space-y-2">
                            {topCountries.map(country => (
                                <li key={country.id} className="flex justify-between items-center bg-gray-800 p-2 rounded-md">
                                    <span className="font-medium text-gray-200">{country.id}</span>
                                    <span className="font-bold text-blue-400">{country.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GeoChart;