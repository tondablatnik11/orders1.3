'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { format, isBefore, startOfDay, differenceInDays, parseISO, addDays, subDays, startOfMonth, endOfMonth, isAfter } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { FileDown, UploadCloud, Lock, History, Search, ClipboardList, Sun, Moon, Globe, Mail, UserPlus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { translations } from '../lib/translations';

// --- KONFIGURACE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- INICIALIZACE KLIENTŮ ---
const supabase = createClient(supabaseUrl, supabaseKey);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- POMOCNÉ FUNKCE ---
const parseDataDate = (dateInput) => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string') {
        const date = parseISO(dateInput);
        if (!isNaN(date.getTime())) return date;
    }
    if (typeof dateInput === 'number') {
        const date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return null;

    const summary = {
        total: 0, doneTotal: 0, remainingTotal: 0, inProgressTotal: 0, newOrdersTotal: 0,
        palletsTotal: 0, cartonsTotal: 0, delayed: 0,
        statusCounts: {}, deliveryTypes: {}, delayedOrdersList: [],
        dailySummaries: {},
    };

    const doneStatuses = [50, 60, 70];
    const today = startOfDay(new Date());

    rawData.forEach(row => {
        const status = Number(row.Status);
        if (isNaN(status)) return;
        
        summary.total++;
        if (doneStatuses.includes(status)) summary.doneTotal++;
        if (status === 10) summary.newOrdersTotal++;
        if (status >= 30 && status < 50) summary.inProgressTotal++;
        if (row["del.type"] === 'P') summary.palletsTotal++;
        if (row["del.type"] === 'K') summary.cartonsTotal++;

        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        if(row["del.type"]) summary.deliveryTypes[row["del.type"]] = (summary.deliveryTypes[row["del.type"]] || 0) + 1;
        
        const loadingDate = parseDataDate(row["Loading Date"]);
        if (loadingDate) {
            const dateKey = format(loadingDate, 'yyyy-MM-dd');
            if (!summary.dailySummaries[dateKey]) {
                summary.dailySummaries[dateKey] = { date: dateKey, total: 0 };
            }
            summary.dailySummaries[dateKey].total++;

            if (isBefore(loadingDate, today) && !doneStatuses.includes(status)) {
                summary.delayed++;
                summary.delayedOrdersList.push({ ...row, delayDays: differenceInDays(today, loadingDate) });
            }
        }
    });

    summary.remainingTotal = summary.total - summary.doneTotal;
    return summary;
};


// --- UI KOMPONENTY ---
const Card = ({ children }) => <div className="border border-gray-700 rounded-xl bg-gray-800 shadow-xl p-4">{children}</div>;
const CardContent = ({ children }) => <div className="p-2">{children}</div>;

const Login = ({ onLogin, onGoogleSignIn, onRegister, t }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) {
            onRegister(email, password);
        } else {
            onLogin(email, password);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
            <div className="p-8 border border-gray-700 rounded-xl bg-gray-800 shadow-2xl max-w-md w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
                    {isRegistering ? t.registerTitle : t.loginTitle}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600"/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600"/>
                    <button type="submit" className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700">
                        <Lock className="w-5 h-5" /> {isRegistering ? t.register : t.loginButton}
                    </button>
                </form>
                <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div><div className="relative flex justify-center text-sm"><span className="bg-gray-800 px-2 text-gray-400">nebo</span></div></div>
                <button onClick={onGoogleSignIn} className="w-full flex justify-center items-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-red-700">
                    <Mail className="w-5 h-5" /> {t.googleSignIn}
                </button>
                <div className="text-center mt-6">
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-400 hover:underline">
                        {isRegistering ? 'Máte již účet? Přihlaste se' : 'Nemáte účet? Registrovat se'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Komponenty pro záložky ---
const DashboardTab = ({ summary, t }) => {
    const summaryCards = [
        { labelKey: 'total', value: summary.total, color: 'text-blue-400' },
        { labelKey: 'done', value: summary.doneTotal, color: 'text-green-400' },
        { labelKey: 'remaining', value: summary.remainingTotal, color: 'text-yellow-400' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, color: 'text-orange-400' },
        { labelKey: 'newOrders', value: summary.newOrdersTotal, color: 'text-purple-400' },
        { labelKey: 'pallets', value: summary.palletsTotal, color: 'text-pink-400' },
        { labelKey: 'carton', value: summary.cartonsTotal, color: 'text-cyan-400' },
    ];
    const statusChartData = Object.entries(summary.statusCounts).map(([name, value]) => ({ name: `Status ${name}`, value })).sort((a,b) => Number(a.name.split(' ')[1]) - Number(b.name.split(' ')[1]));
    
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                {summaryCards.map(card => (
                    <Card key={card.labelKey}><CardContent>
                        <p className="text-gray-400">{t[card.labelKey]}</p>
                        <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </CardContent></Card>
                ))}
            </div>
            <Card>
                <CardContent>
                    <h2 className="text-xl font-semibold mb-4">{t.statusDistribution}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusChartData}>
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} cursor={{ fill: 'rgba(107, 114, 128, 0.2)' }} />
                            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

const DelayedOrdersTab = ({ summary, t }) => {
    return <Card><CardContent><h2 className="text-xl font-semibold">{t.delayedOrdersTab}</h2><p>{t.totalDelayed}: {summary.delayedOrdersList.length}</p></CardContent></Card>;
};

// --- Hlavní komponenta, která vše řídí ---
export default function Page() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [allData, setAllData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState("cz");
    const [darkMode, setDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const t = translations[lang];

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.async = true;
        document.body.appendChild(script);

        const unsubscribe = onAuthStateChanged(auth, async user => {
            setLoading(true);
            if (user) {
                setCurrentUser(user);
                const profileDoc = await getDoc(doc(db, "user_profiles", user.uid));
                if (profileDoc.exists()) {
                    setCurrentUserProfile({ uid: user.uid, ...profileDoc.data() });
                } else {
                    const newProfile = { email: user.email, displayName: user.displayName || user.email.split('@')[0] };
                    await setDoc(doc(db, "user_profiles", user.uid), newProfile);
                    setCurrentUserProfile({ uid: user.uid, ...newProfile });
                }
                const { data, error } = await supabase.from('deliveries').select('*');
                setAllData(error ? [] : data || []);
            } else {
                setCurrentUser(null);
                setAllData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setSummary(processData(allData));
    }, [allData]);

    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert(t.loginError);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            alert("Přihlášení přes Google selhalo.");
        }
    };
    
    const handleRegister = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert(t.registerSuccess);
        } catch(error){
            alert(t.registerError);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !window.XLSX) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = window.XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = window.XLSX.utils.sheet_to_json(ws);
                const transformedData = jsonData.map(row => ({
                  "Delivery No": String(row["Delivery No"] || row["Delivery"]).trim(),
                  Status: Number(row.Status),
                  "del.type": row["del.type"],
                  "Loading Date": parseDataDate(row["Loading Date"])?.toISOString(),
                }));
                const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                if (error) throw error;
                alert('Data byla úspěšně nahrána!');
                const { data: newData } = await supabase.from('deliveries').select('*');
                setAllData(newData || []);
            } catch (err) {
                alert('Chyba při nahrávání souboru.');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const renderActiveTab = () => {
        if (!summary) return <p className="text-center p-8">{t.noDataAvailable}</p>;
        switch (activeTab) {
            case 0: return <DashboardTab summary={summary} t={t} />;
            case 1: return <DelayedOrdersTab summary={summary} t={t} />;
            default: return <DashboardTab summary={summary} t={t} />;
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítání...</div>;
    }

    if (!currentUser) {
        return <Login onLogin={handleLogin} onGoogleSignIn={handleGoogleSignIn} onRegister={handleRegister} t={t} />;
    }

    return (
        <div className={`p-8 space-y-8 min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"}`}>
             <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">{t.title}</h1>
                <div className="flex items-center gap-6">
                    {currentUserProfile && <span className="font-semibold">{currentUserProfile.displayName}</span>}
                    <button onClick={() => setLang(l => l === 'cz' ? 'en' : 'cz')} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg">
                        <Globe className="w-4 h-4" /> {t.langCode}
                    </button>
                     <button onClick={() => setDarkMode(!darkMode)} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg">
                        {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg">
                        <Lock className="w-5 h-5" /> {t.logout}
                    </button>
                </div>
            </header>
            
            <div className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-8 max-w-full mx-auto overflow-x-auto">
                <button onClick={() => setActiveTab(0)} className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 0 ? 'bg-blue-600 text-white' : 'text-blue-100'}`}>{t.dashboardTab}</button>
                <button onClick={() => setActiveTab(1)} className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === 1 ? 'bg-blue-600 text-white' : 'text-blue-100'}`}>{t.delayedOrdersTab}</button>
            </div>
            
             <div className="flex justify-center">
               <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>Nahrát soubor</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
            
            <main>
                {renderActiveTab()}
            </main>
        </div>
    );
}