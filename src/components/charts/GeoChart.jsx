'use client';
import React from 'react';
import { ResponsiveChoropleth } from '@nivo/geo';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '../ui/Card';
import worldCountries from './world_countries.json'; // Tento soubor si stáhneme

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

    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-semibold mb-4">Geografické rozložení zakázek</h2>
                <div style={{ height: '450px' }}>
                    <ResponsiveChoropleth
                        data={data}
                        features={worldCountries.features}
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        colors="blues"
                        domain={[0, Math.max(...data.map(d => d.value))]}
                        unknownColor="#4B5563"
                        label="properties.name"
                        valueFormat=".2s"
                        projectionTranslation={[0.5, 0.5]}
                        projectionRotation={[0, 0, 0]}
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
                                translateY: -100,
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
            </CardContent>
        </Card>
    );
};

export default GeoChart;