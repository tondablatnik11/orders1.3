// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export const getSupabase = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Anon Key. Check your .env.local file.');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};