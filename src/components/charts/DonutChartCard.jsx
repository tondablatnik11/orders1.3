'use client';
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '../ui/Card';

const COLORS = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#f59e0b", "#64748b"];

const DonutChartCard = ({ title, data }) => {
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

    return (
        <Card>
            <CardContent>
                <h3 className="text-xl font-semibold mb-4 text-center">{title}</h3>
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default DonutChartCard;