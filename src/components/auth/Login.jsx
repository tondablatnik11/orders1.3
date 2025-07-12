'use client';
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUI } from '../../hooks/useUI';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, register, googleSignIn } = useAuth();
  const { t } = useUI();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await register(email, password);
        alert(t.registerSuccess);
        setIsRegistering(false); 
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(t.loginError);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await googleSignIn();
    } catch (err) {
      setError('Přihlášení přes Google selhalo.');
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
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700">
            <Lock className="w-5 h-5" /> {isRegistering ? t.register : t.loginButton}
          </button>
        </form>
        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-600"></div></div><div className="relative flex justify-center text-sm"><span className="bg-gray-800 px-2 text-gray-400">nebo</span></div></div>
        <button onClick={handleGoogleSignIn} className="w-full flex justify-center items-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-red-700">
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

export default Login;