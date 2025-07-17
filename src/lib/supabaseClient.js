// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Vytvoříme klienta pouze jednou a uložíme ho do této proměnné.
let supabaseClient = null;

export const getSupabase = () => {
  // Pokud klient ještě neexistuje, vytvoříme ho.
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Chybí Supabase URL nebo Anon Key. Zkontrolujte .env.local soubor.');
    }
    
    // Tím, že to uložíme do `supabaseClient`, se při dalším volání `getSupabase()`
    // vrátí již existující instance a nevytvoří se nová.
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
            // Explicitně řekneme, aby se session ukládala a automaticky obnovovala.
            // I když to prohlížeč blokuje, pomůže to internímu stavu klienta.
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
  }

  // Vrátíme vždy tu samou instanci.
  return supabaseClient;
};