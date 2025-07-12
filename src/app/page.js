'use client';

import React, { useState, useEffect, useCallback } from "react";
import { format, isBefore, startOfDay, differenceInDays, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { UploadCloud, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// --- Konfigurace ---
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

// --- Inicializace klientů ---
const supabase = createClient(supabaseUrl, supabaseKey);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Pomocné funkce ---
const parseDataDate = (dateInput) => {
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
        return parseISO(dateInput);
    }
    if (typeof dateInput === 'number') {
        // Zpracování Excel data
        const date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
};

const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return null;

    const summary = {
        total: 0,
        doneTotal: 0,
        remainingTotal: 0,
        inProgressTotal: 0,
        newOrdersTotal: 0,
        palletsTotal: 0,
        cartonsTotal: 0,
        delayed: 0,
        statusCounts: {},
        deliveryTypes: {},
        delayedOrdersList: [],
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
        if (loadingDate && isBefore(loadingDate, today) && !doneStatuses.includes(status)) {
            summary.delayed++;
            summary.delayedOrdersList.push({ ...row, delayDays: differenceInDays(today, loadingDate) });
        }
    });

    summary.remainingTotal = summary.total - summary.doneTotal;
    return summary;
};


// --- UI Komponenty ---
const Card = ({ children }) => <div className="border border-gray-700 rounded-xl bg-gray-800 shadow-xl p-4">{children}</div>;
const CardContent = ({ children }) => <div className="p-2">{children}</div>;

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
            <div className="p-8 border border-gray-700 rounded-xl bg-gray-800 shadow-2xl max-w-md w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Přihlášení</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600"/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600"/>
                    <button type="submit" className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700">
                        <Lock className="w-5 h-5" /> Přihlásit se
                    </button>
                </form>
            </div>
        </div>
    );
};

const Dashboard = ({ summary, onFileUpload, onLogout, currentUserProfile }) => {
    const summaryCards = [
        { label: 'Zakázky', value: summary.total, color: 'text-blue-400' },
        { label: 'Hotovo', value: summary.doneTotal, color: 'text-green-400' },
        { label: 'Zbývá', value: summary.remainingTotal, color: 'text-yellow-400' },
        { label: 'V procesu', value: summary.inProgressTotal, color: 'text-orange-400' },
        { label: 'Nové', value: summary.newOrdersTotal, color: 'text-purple-400' },
        { label: 'Palety', value: summary.palletsTotal, color: 'text-pink-400' },
        { label: 'Karton', value: summary.cartonsTotal, color: 'text-cyan-400' },
    ];

    const statusChartData = Object.entries(summary.statusCounts).map(([name, value]) => ({ name: `Status ${name}`, value }));

    return (
        <div className="p-8 space-y-8 bg-gray-950 text-gray-100">
            <header className="flex justify-between items-center">
                <h1 className="text-4xl font-bold">Přehled zakázek</h1>
                <div>
                  <span className="font-semibold mr-4">{currentUserProfile?.displayName}</span>
                  <button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg">Odhlásit se</button>
                </div>
            </header>
            
            <div className="flex justify-center">
               <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>Nahrát soubor</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={onFileUpload} />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                {summaryCards.map(card => (
                    <Card key={card.label}>
                        <CardContent>
                            <p className="text-gray-400">{card.label}</p>
                            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <Card>
                <CardContent>
                    <h2 className="text-xl font-semibold mb-4">Rozložení statusů</h2>
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


// --- Hlavní komponenta ---
export default function Page() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [allData, setAllData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Načtení XLSX skriptu
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.async = true;
        document.body.appendChild(script);

        // Listener na změnu stavu přihlášení
        const unsubscribe = onAuthStateChanged(auth, async user => {
            setLoading(true);
            if (user) {
                setCurrentUser(user);
                const profileDoc = await getDoc(doc(db, "user_profiles", user.uid));
                if (profileDoc.exists()) {
                    setCurrentUserProfile({ uid: user.uid, ...profileDoc.data() });
                }
                
                const { data, error } = await supabase.from('deliveries').select('*');
                if (error) {
                    console.error("Error fetching initial data:", error);
                    setAllData([]);
                } else {
                    setAllData(data || []);
                }
            } else {
                setCurrentUser(null);
                setCurrentUserProfile(null);
                setAllData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Zpracování dat, kdykoliv se změní
    useEffect(() => {
        if (allData) {
            const processed = processData(allData);
            setSummary(processed);
        } else {
            setSummary(null);
        }
    }, [allData]);

    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Přihlášení selhalo.");
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
                  "Status": Number(row["Status"]),
                  "del.type": row["del.type"],
                  "Loading Date": parseDataDate(row["Loading Date"])?.toISOString(),
                }));

                const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
                if (error) throw error;
                
                alert('Data byla úspěšně nahrána!');
                const { data: newData } = await supabase.from('deliveries').select('*');
                setAllData(newData);
            } catch (err) {
                alert('Chyba při nahrávání souboru.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítání...</div>;
    }

    return (
        <>
            {currentUser ? (
                summary ? (
                    <Dashboard 
                        summary={summary} 
                        onFileUpload={handleFileUpload}
                        onLogout={handleLogout}
                        currentUserProfile={currentUserProfile}
                    />
                ) : (
                    <div className="text-center p-8 bg-gray-950 text-white min-h-screen">
                        <h1 className="text-2xl font-bold mb-4">Přehled zakázek</h1>
                        <p className="mb-4">Žádná data k zobrazení. Nahrajte prosím soubor.</p>
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                            <UploadCloud className="w-5 h-5" />
                            <span>Nahrát soubor</span>
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                        </label>
                         <button onClick={handleLogout} className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg">Odhlásit se</button>
                    </div>
                )
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </>
    );
}