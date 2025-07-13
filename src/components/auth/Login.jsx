'use client';
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; 
import { useUI } from '@/hooks/useUI'; 
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast'; // <-- PŘIDÁN IMPORT

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
        toast.success(t.registerSuccess || 'Registrace byla úspěšná! Nyní se můžete přihlásit.'); // <-- ZMĚNA
        setIsRegistering(false); 
      } else {
        await login(email, password);
      }
    } catch (err) {
        const errorMessage = err.code === 'auth/invalid-credential' 
            ? (t.loginError || 'Nesprávné uživatelské jméno nebo heslo.')
            : (t.operationFailed || 'Operace se nezdařila.');
        setError(errorMessage);
        console.error(err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await googleSignIn();
    } catch (err) {
      setError(t.googleSignInFailed || 'Přihlášení přes Google se nezdařilo.'); // Zůstává jako error v UI
      console.error('Google Sign-in error:', err);
    }
  };

  // ... zbytek JSX (beze změny)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="p-8 border border-gray-700 rounded-xl bg-gray-800 shadow-2xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
          {isRegistering ? t.registerTitle : t.loginTitle}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t.username}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 block w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200">
            <Lock className="w-5 h-5" />
            {isRegistering ? (t.register || 'Vytvořit účet') : t.loginButton}
          </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800 px-2 text-gray-400">{t.or || 'nebo'}</span>
            </div>
        </div>

        <button onClick={handleGoogleSignIn} className="w-full flex justify-center items-center gap-2 bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-red-700 transition-colors duration-200">
            <Mail className="w-5 h-5" />
            {t.googleSignIn}
        </button>

        <div className="text-center mt-6">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-400 hover:underline">
            {isRegistering ? (t.alreadyHaveAccount || 'Už máte účet? Přihlaste se') : (t.noAccountYet || 'Nemáte účet? Zaregistrujte se')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;