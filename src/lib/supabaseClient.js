import { createClient } from '@supabase/supabase-js';

// Vytvoříme klienta pouze jednou a uložíme ho do této proměnné.
let supabaseClient = null;

export const getSupabase = () => {
  // Pokud klient ještě neexistuje, vytvoříme ho.
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Tato kontrola je klíčová. Pokud se sem dostane, znamená to,
    // že se .env.local nenačetl správně.
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Chybí Supabase URL nebo Anon Key. Zkontrolujte .env.local soubor a restartujte server.');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
  }

  // Vrátíme vždy tu samou instanci.
  return supabaseClient;
};