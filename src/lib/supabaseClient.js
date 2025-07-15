// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Přímo vytvoříme a exportujeme klienta.
// Toto je standardní a doporučený způsob.
export const supabase = createClient(supabaseUrl, supabaseKey);