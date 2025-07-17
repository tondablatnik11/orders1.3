// src/components/charts/ErrorMonitorCharts.jsx
"use client";
import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    CartesianGrid,
} from 'recharts';
import { Card, CardContent } from '../ui/Card';
import { ListChecks, MapPin, Package, GitCommitVertical } from 'lucide-react';

const formatErrorTypeForDisplay = (description) => {
    if (!description) return "Neznámý typ";
    const desc = description.toLowerCase();
    if (desc.includes('location empty')) return 'Prázdná lokace';
    if (desc.includes('skip position')) return 'Přeskočená pozice';
    if (desc.includes('serial number')) return 'Chyba sériového čísla';
    if (desc.includes('location short')) return 'Neúplná lokace';
    if (desc.includes('empty skid')) return 'Prázdná paleta';
    return description.charAt(0).toUpperCase() + description.slice(1);
};

const COLORS = ["#3b82f6", "#16a34a", "#facc15", "#f97316", "#ef4444", "#9333ea"];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-2 border border-gray-700 rounded shadow-lg">
                <p className="label text-white">{`${label} : ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const ErrorMonitorCharts = ({ chartsData }) => {
    const errorsByTypeData = chartsData?.errorsByType.map(e => ({
        ...e,
        name: formatErrorTypeForDisplay(e.name),
        value: e['Počet chyb'] // recharts očekává 'value' pro PieChart
    })).slice(0, 6) || [];

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><ListChecks className="w-5 h-5" />TOP 6 Typů Chyb</h3>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={errorsByTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {errorsByTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                                <Legend wrapperStyle={{ color: '#D1D5DB' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                       <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" />TOP 10 Pozic s nejvíce chybami</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={chartsData.errorsByPosition.slice(0, 10)}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis type="number" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} width={120} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                                <Bar dataKey="Počet chyb" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Package className="w-5 h-5" />TOP 10 Materiálů s nejvíce chybami</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={chartsData.errorsByMaterial.slice(0, 10)}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis type="number" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} width={120} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                                <Bar dataKey="Počet chyb" fill="#16a34a" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><GitCommitVertical className="w-5 h-5" />TOP 10 Materiálů s největším rozdílem</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                                data={chartsData.quantityDifferenceByMaterial.slice(0, 10)}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis type="number" stroke="#9CA3AF" tick={{ fill: "#D1D5DB" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 12 }} width={120} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                                <Bar dataKey="Absolutní rozdíl" fill="#f97316" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ErrorMonitorCharts;