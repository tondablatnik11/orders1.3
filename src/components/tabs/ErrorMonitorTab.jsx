"use client";
import React from 'react';
import { useData } from '@/hooks/useData';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const KPICard = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 flex items-center gap-4">
        <div className="p-3 bg-gray-700 rounded-lg">
            <Icon className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
            <p className="text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default function ErrorMonitorTab() {
    const { t } = useUI();
    const { errorSummary, isLoadingErrorData } = useData();

    if (isLoadingErrorData && !errorSummary) {
        return <div className="text-center p-8 text-lg">Nahrjte soubor s monitoringem chyb...</div>;
    }
    
    if (!errorSummary) {
        return (
             <Card>
                <CardContent className="text-center py-16">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold">Žádná data k zobrazení</h3>
                    <p className="text-gray-400 mt-2">
                        Pro zobrazení analýzy prosím nahrajte soubor s logem chyb pomocí tlačítka v záhlaví.
                    </p>
                </CardContent>
            </Card>
        );
    }
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Celkový počet událostí" value={errorSummary.totalEvents} icon={BarChart2} />
                <KPICard title="Nevyřešené případy" value={errorSummary.unresolvedEvents} icon={AlertCircle} />
                <KPICard title="Události za dnešek" value={errorSummary.eventsToday} icon={Clock} />
                <KPICard title="Vyřešené případy" value={errorSummary.resolvedStatusCounts.find(s => s.name === 'Vyřešeno')?.value || 0} icon={CheckCircle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent>
                        <h3 className="font-semibold mb-4">Vývoj chyb v čase</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={errorSummary.eventsOverTime}>
                                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9CA3AF" allowDecimals={false}/>
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                                <Bar dataKey="value" fill="#EF4444" name="Počet chyb" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent>
                        <h3 className="font-semibold mb-4">Stav řešení</h3>
                        <ResponsiveContainer width="100%" height={300}>
                             <PieChart>
                                <Pie data={errorSummary.resolvedStatusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {errorSummary.resolvedStatusCounts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent>
                    <h3 className="font-semibold mb-4">Detailní výpis chyb</h3>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full bg-gray-700">
                            <thead className="bg-gray-600 sticky top-0">
                                <tr>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Datum a čas</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Uživatel</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Text chyby</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Materiál</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Skladová pozice</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Množství rozdílu</th>
                                    <th className="py-2 px-3 text-left text-xs font-semibold">Stav</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-600">
                                {errorSummary.errorLog.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-600">
                                        <td className="py-2 px-3 text-sm whitespace-nowrap">{`${row['Created On']} ${row['Time']}`}</td>
                                        <td className="py-2 px-3 text-sm">{row['Created By']}</td>
                                        <td className="py-2 px-3 text-sm">{row.Text}</td>
                                        <td className="py-2 px-3 text-sm">{row.Material || '-'}</td>
                                        <td className="py-2 px-3 text-sm">{row['Storage Bin'] || '-'}</td>
                                        <td className="py-2 px-3 text-sm font-mono text-center">{row['Source bin differ.'] || '0'}</td>
                                        <td className="py-2 px-3 text-sm">
                                            <span className={`px-2 py-1 text-xs rounded-full ${row.Done ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}>
                                                {row.Done ? 'Vyřešeno' : 'Nevyřešeno'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}