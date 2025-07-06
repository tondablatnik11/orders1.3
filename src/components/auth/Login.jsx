"use client";
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';
import { Card } from '@/components/ui/Card';
import { Lock, UserPlus, Mail } from 'lucide-react';

export default function Login() {
    const { login, register, googleSignIn } = useAuth();
    const { t, darkMode } = useUI();

    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleAuthAction = async (action) => {
        setError("");
        setMessage("");
        try {
            await action(email, password);
            if (isRegistering) {
                setMessage(t.registerSuccess);
                setIsRegistering(false);
            }
        } catch (err) {
            console.error("Auth error:", err.message);
            setError(isRegistering ? `${t.registerError} ${err.message}` : t.loginError);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setError("");
        setMessage("");
        try {
            await googleSignIn();
        } catch (err) {
            console.error("Google Sign-in error:", err.message);
            setError(`Google Sign-in error: ${err.message}`);
        }
    };

    return (
        <div className={`flex items-center justify-center min-h-screen ${darkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900"} transition-colors duration-300`}>
            <Card className="p-8 max-w-md w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
                    {isRegistering ? t.registerTitle : t.loginTitle}
                </h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t.username}</label>
                        <input
                            type="email" id="email" value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">{t.password}</label>
                        <input
                            type="password" id="password" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="********"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-500 text-sm text-center">{message}</p>}

                    {isRegistering ? (
                        <button onClick={() => handleAuthAction(register)} className="w-full bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-700 flex items-center justify-center gap-2">
                            <UserPlus className="w-5 h-5" /> {t.register}
                        </button>
                    ) : (
                        <>
                            <button onClick={() => handleAuthAction(login)} className="w-full bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Lock className="w-5 h-5" /> {t.loginButton}
                            </button>
                            <button onClick={handleGoogleSignIn} className="w-full bg-red-600 text-white py-2 rounded-lg shadow hover:bg-red-700 flex items-center justify-center gap-2 mt-2">
                                <Mail className="w-5 h-5" /> {t.googleSignIn}
                            </button>
                        </>
                    )}
                    
                    <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-blue-400 hover:underline mt-2 text-sm">
                        {isRegistering ? t.loginButton : t.register}
                    </button>
                </div>
            </Card>
        </div>
    );
}