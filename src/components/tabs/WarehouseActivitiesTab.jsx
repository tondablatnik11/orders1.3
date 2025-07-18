// src/components/tabs/WarehouseActivitiesTab.jsx
"use client";
import React, { useState, useMemo } from 'react';
import { useUI } from '@/hooks/useUI';
import { Card, CardContent } from '@/components/ui/Card';
import { FiArchive, FiUploadCloud, FiBarChart2, FiUser, FiClock, FiPackage, FiZap } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

// --- Komponenta pro KPI karty ---
const KPICard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </div>
);

// --- Hlavní komponenta ---
export default function WarehouseActivitiesTab() {
    const { t } = useUI();
    const [warehouseData, setWarehouseData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const processFileData = (data) => {
        // Zpracování dat pro grafy a statistiky
        const total_activities = data.length;
        const total_quantity_moved = pd.to_numeric(data['Source target qty'], { errors: 'coerce' }).fillna(0).sum();
        const most_active_user = data['User']?.mode()[0] || 'N/A';
        
        data['hour'] = pd.to_datetime(data['Creation time'], { errors: 'coerce' }).dt.hour;
        const busiest_hour = data['hour'].mode()[0] ? `${data['hour'].mode()[0]}:00` : 'N/A';

        const top_users = data['User'].value_counts().head(10).reset_index().rename(columns={ index: 'name', User: 'Přesuny' });
        const hourly_activity = data['hour'].value_counts().sort_index().reset_index().rename(columns={ index: 'hour', hour: 'Přesuny' });
        hourly_activity['hour'] = hourly_activity['hour'].apply(h => `${h}:00`);
        
        const movement_types = data['Movement Type'].value_counts().reset_index().rename(columns={ index: 'name', 'Movement Type': 'value' });
        const top_materials = data['Material'].value_counts().head(10).reset_index().rename(columns={ index: 'name', Material: 'Počet' });

        return {
            kpis: { total_activities, total_quantity_moved, most_active_user, busiest_hour },
            charts: { top_users, hourly_activity, movement_types, top_materials },
            tableData: data,
        };
    };

    const handleFileUpload = async (file) => {
        if (!file) return;
        setIsLoading(true);
        toast.loading('Zpracovávám soubor...');
        
        try {
            const XLSX = await import('xlsx');
            const reader = new FileReader();
            reader.onload = async (evt) => {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws);
                
                // Zde simulujeme pandas pro jednoduchost
                const pd = {
                    to_numeric: (series, options) => series.map(v => {
                        const num = Number(v);
                        return isNaN(num) && options.errors === 'coerce' ? NaN : num;
                    }),
                    to_datetime: (series, options) => series.map(v => {
                       // Jednoduchý parser pro H:M:S nebo H:M
                       if(typeof v !== 'string') return new Date('invalid');
                       const parts = v.split(':');
                       const date = new Date();
                       date.setHours(parseInt(parts[0] || 0), parseInt(parts[1] || 0), parseInt(parts[2] || 0));
                       return date;
                    })
                };
                
                // Převod na "DataFrame-like" strukturu
                let df = {};
                if(jsonData.length > 0) {
                    Object.keys(jsonData[0]).forEach(key => {
                        df[key] = jsonData.map(row => row[key]);
                    });
                    
                    df.length = jsonData.length;
                    df.mode = (col) => {
                        if(!col || col.length === 0) return [undefined];
                        const counts = col.reduce((acc, val) => {
                           acc[val] = (acc[val] || 0) + 1;
                           return acc;
                        }, {});
                        const maxCount = Math.max(...Object.values(counts));
                        return Object.keys(counts).filter(key => counts[key] === maxCount);
                    };
                    df.value_counts = (col) => {
                         if(!col) return new Map();
                         const counts = new Map();
                         col.forEach(item => {
                            counts.set(item, (counts.get(item) || 0) + 1);
                         });
                         return counts;
                    };
                }

                setWarehouseData(processDataForDisplay(df));
                toast.dismiss();
                toast.success('Data byla úspěšně analyzována!');
            };
            reader.readAsBinaryString(file);
        } catch (e) {
            toast.dismiss();
            toast.error('Chyba při zpracování souboru.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Tato funkce musí být upravena, aby pracovala s JS datovými strukturami
    const processDataForDisplay = (data) => {
        const topUsersData = Array.from(data.value_counts(data['User']).entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, 'Přesuny': count }));

        const hourlyData = Array.from(data.value_counts(data['hour']).entries())
            .sort(([a], [b]) => a - b)
            .map(([hour, count]) => ({ hour: `${hour}:00`, 'Přesuny': count }));

        const movementTypesData = Array.from(data.value_counts(data['Movement Type']).entries())
            .map(([name, value]) => ({ name: `Typ ${name}`, value }));
            
        const topMaterialsData = Array.from(data.value_counts(data['Material']).entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, 'Počet': count }));


        return {
            kpis: {
                total_activities: data.length,
                total_quantity_moved: data['Source target qty'].reduce((a, b) => a + (Number(b) || 0), 0),
                most_active_user: data.mode(data['User'])[0],
                busiest_hour: `${data.mode(data['hour'])[0]}:00`,
            },
            charts: {
                top_users: topUsersData,
                hourly_activity: hourlyData,
                movement_types: movementTypesData,
                top_materials: topMaterialsData,
            },
            tableData: [], // Zde by byla logika pro tabulku
        };
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="flex flex-col sm:flex-row justify-between items-center p-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2 text-lime-400">
                        <FiArchive className="w-6 h-6" /> Skladové aktivity
                    </h2>
                    <label className="cursor-pointer mt-4 sm:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                        <FiUploadCloud className="w-5 h-5" />
                        <span>Nahrát denní report</span>
                        <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                    </label>
                </CardContent>
            </Card>

            {!warehouseData && !isLoading && (
                 <div className="text-center py-16 text-slate-500 bg-slate-800/50 rounded-xl">
                    <FiUploadCloud className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300">Žádná data nejsou načtena</h3>
                    <p>Nahrajte denní report skladových aktivit pro zobrazení analýzy.</p>
                </div>
            )}

            {isLoading && <p>Načítám a analyzuji data...</p>}
            
            {warehouseData && (
                <div className="space-y-6 animate-fadeInUp">
                    {/* KPI Karty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard title="Celkem přesunů" value={warehouseData.kpis.total_activities} icon={FiZap} colorClass="bg-blue-500/30" />
                        <KPICard title="Celkem kusů přesunuto" value={warehouseData.kpis.total_quantity_moved.toLocaleString('cs-CZ')} icon={FiPackage} colorClass="bg-green-500/30" />
                        <KPICard title="Nejaktivnější uživatel" value={warehouseData.kpis.most_active_user} icon={FiUser} colorClass="bg-purple-500/30" />
                        <KPICard title="Nejrušnější hodina" value={warehouseData.kpis.busiest_hour} icon={FiClock} colorClass="bg-orange-500/30" />
                    </div>

                    {/* Grafy */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-xl font-semibold mb-4">Aktivita podle hodiny</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={warehouseData.charts.hourly_activity}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis dataKey="hour" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                                        <Bar dataKey="Přesuny" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="pt-6">
                                <h3 className="text-xl font-semibold mb-4">Rozdělení typů přesunů</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={warehouseData.charts.movement_types} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                             {warehouseData.charts.movement_types.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f97316', '#8b5cf6'][index % 4]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-2">
                             <CardContent className="pt-6">
                                <h3 className="text-xl font-semibold mb-4">TOP 10 Uživatelů podle aktivity</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                     <BarChart data={warehouseData.charts.top_users} layout="vertical" margin={{ left: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                        <XAxis type="number" stroke="#9CA3AF" />
                                        <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                                        <Bar dataKey="Přesuny" fill="#818cf8" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}