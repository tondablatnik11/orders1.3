'use client';

import React, { useState, useEffect, useCallback, useRef } from "react";
import { format, isBefore, startOfDay, differenceInDays, parseISO, addDays, subDays, startOfMonth, endOfMonth, isAfter } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Sector } from "recharts";
import { FileDown, UploadCloud, Lock, History, Search, ClipboardList, Sun, Moon, Globe, Ticket, User, MessageSquare, Save, Bell, XCircle, Ship } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { translations } from '../lib/translations'; // Předpokládáme, že tento soubor existuje

// --- KONFIGURACE ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- INICIALIZACE KLIENTŮ ---
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- POMOCNÉ FUNKCE ---
const parseExcelDate = (dateInput) => {
    if (typeof dateInput === "number") {
      const date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? null : date;
    }
    if (typeof dateInput === "string") {
      const date = parseISO(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
};

const processData = (rawData) => {
    if (!rawData || rawData.length === 0) return null;

    const summary = {
        total: 0, doneTotal: 0, remainingTotal: 0, inProgressTotal: 0, newOrdersTotal: 0,
        palletsTotal: 0, cartonsTotal: 0, delayed: 0,
        statusCounts: {}, deliveryTypes: {}, delayedOrdersList: [],
    };

    const doneStatuses = [50, 60, 70];
    const inProgressStatuses = [31, 35, 40];
    const newOrderStatuses = [10];
    const today = startOfDay(new Date());

    rawData.forEach(row => {
        const status = Number(row.Status);
        if (isNaN(status)) return;
        
        summary.total++;
        if (doneStatuses.includes(status)) summary.doneTotal++;
        if (newOrderStatuses.includes(status)) summary.newOrdersTotal++;
        if (inProgressStatuses.includes(status)) summary.inProgressTotal++;
        if (row["del.type"] === 'P') summary.palletsTotal++;
        if (row["del.type"] === 'K') summary.cartonsTotal++;

        summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
        if(row["del.type"]) summary.deliveryTypes[row["del.type"]] = (summary.deliveryTypes[row["del.type"]] || 0) + 1;
        
        const loadingDate = parseExcelDate(row["Loading Date"]);
        if (loadingDate && isBefore(loadingDate, today) && !doneStatuses.includes(status)) {
            summary.delayed++;
            summary.delayedOrdersList.push({ ...row, delayDays: differenceInDays(today, loadingDate) });
        }
    });

    summary.remainingTotal = summary.total - summary.doneTotal;
    return summary;
};


// --- UI KOMPONENTY ---
const Card = ({ children, className = "" }) => <div className={`border border-gray-700 rounded-xl bg-gray-800 shadow-xl ${className}`}>{children}</div>;
const CardContent = ({ children, className = "" }) => <div className={`p-6 space-y-2 ${className}`}>{children}</div>;

const Login = ({ onLogin, onGoogleSignIn, t }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950">
            <div className="p-8 border border-gray-700 rounded-xl bg-gray-800 shadow-2xl max-w-md w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">{t.loginTitle}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600"/>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600"/>
                    <button type="submit" className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700">
                        <Lock className="w-5 h-5" /> {t.loginButton}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Dashboard = ({ summary, t, onFileUpload, onLogout, currentUserProfile }) => {
    if (!summary) {
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
                <p className="mb-4">{t.uploadFilePrompt}</p>
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={onFileUpload} />
                </label>
                <button onClick={onLogout} className="ml-4 bg-red-600 text-white px-3 py-1 rounded-lg">Odhlásit se</button>
            </div>
        );
    }
    
    const summaryCards = [
        { labelKey: 'total', value: summary.total, color: 'text-blue-400' },
        { labelKey: 'done', value: summary.doneTotal, color: 'text-green-400' },
        { labelKey: 'remaining', value: summary.remainingTotal, color: 'text-yellow-400' },
        { labelKey: 'inProgress', value: summary.inProgressTotal, color: 'text-orange-400' },
        { labelKey: 'newOrders', value: summary.newOrdersTotal, color: 'text-purple-400' },
        { labelKey: 'pallets', value: summary.palletsTotal, color: 'text-pink-400' },
        { labelKey: 'carton', value: summary.cartonsTotal, color: 'text-cyan-400' },
    ];

    const statusChartData = Object.entries(summary.statusCounts).map(([name, value]) => ({ name: `Status ${name}`, value }));

    return (
        <div className="p-8 space-y-8 bg-gray-950 text-gray-100">
            <header className="flex justify-between items-center">
                <h1 className="text-4xl font-bold">{t.title}</h1>
                <div>
                  <span>{currentUserProfile?.displayName}</span>
                  <button onClick={onLogout} className="ml-4 bg-red-600 text-white px-3 py-1 rounded-lg">Odhlásit se</button>
                </div>
            </header>
            
            <div className="flex justify-center">
               <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow">
                    <UploadCloud className="w-5 h-5" />
                    <span>{t.upload}</span>
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={onFileUpload} />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                {summaryCards.map(card => (
                    <Card key={card.labelKey}>
                        <CardContent>
                            <p className="text-gray-400">{t[card.labelKey]}</p>
                            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                        </CardContent>
                    </Card>
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


// --- HLAVNÍ KOMPONENTA APLIKACE ---
export default function Page() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allData, setAllData] = useState(null);
    const [summary, setSummary] = useState(null);
    const [lang] = useState("cz");

    const t = translations[lang];
    
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.async = true;
        document.body.appendChild(script);

        const unsubscribe = onAuthStateChanged(auth, async user => {
            if (user) {
                const profileDoc = await getDoc(doc(db, "user_profiles", user.uid));
                if (profileDoc.exists()) {
                    setCurrentUserProfile({ uid: user.uid, ...profileDoc.data() });
                }
                setCurrentUser(user);
                
                const { data, error } = await supabase.from('deliveries').select('*');
                if(error) console.error("Error fetching initial data:", error);
                else {
                    setAllData(data);
                    const processed = processData(data);
                    setSummary(processed);
                }
            } else {
                setCurrentUser(null);
                setAllData(null);
                setSummary(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login failed:", error);
            alert("Přihlášení selhalo.");
        }
    };
    
    const handleGoogleSignIn = async () => {
       // Tuto funkci si ponech pro případné budoucí rozšíření
    };
    
    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = window.XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = window.XLSX.utils.sheet_to_json(ws);

            const transformedData = jsonData.map(row => ({
              "Delivery No": String(row["Delivery No"] || row["Delivery"]).trim(),
              "Status": Number(row["Status"]),
              "del.type": row["del.type"],
              "Loading Date": parseExcelDate(row["Loading Date"])?.toISOString(),
              "Note": row["Note"],
              "Forwarding agent name": row["Forwarding agent name"],
              "Name of ship-to party": row["Name of ship-to party"],
              "Total Weight": row["Total Weight"],
              "Bill of lading": row["Bill of lading"],
            }));

            const { error } = await supabase.from('deliveries').upsert(transformedData, { onConflict: 'Delivery No' });
            if (error) {
                alert('Chyba při nahrávání dat.');
            } else {
                alert('Data byla úspěšně nahrána!');
                const { data: newData } = await supabase.from('deliveries').select('*');
                setAllData(newData);
                setSummary(processData(newData));
            }
        };
        reader.readAsBinaryString(file);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">Načítání...</div>;
    }

    return (
        <div>
            {currentUser ? (
                <Dashboard 
                    summary={summary} 
                    t={t} 
                    onFileUpload={handleFileUpload}
                    onLogout={handleLogout}
                    currentUserProfile={currentUserProfile}
                />
            ) : (
                <Login 
                    onLogin={handleLogin} 
                    onGoogleSignIn={handleGoogleSignIn} 
                    t={t} 
                />
            )}
        </div>
    );
}