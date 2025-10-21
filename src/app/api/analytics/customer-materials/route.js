// src/app/api/analytics/customer-materials/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) { /* ... error handling ... */ }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ===================================================================
    // FINÁLNÍ OPRAVA: Voláme NOVOU funkci v5 z Kroku 1
    // ===================================================================
    const { data, error } = await supabaseAdmin.rpc('get_analysis_with_positions_v5'); // <-- Změna názvu funkce

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_analysis_with_positions_v5):', error);
      throw error;
    }

    // Hlavičky pro zákaz cachování
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // API stále vrací { zakaznik, material, celkove_mnozstvi, pozice_data }
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    // Táto časť by sa už nemala spustiť
    return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
  }
}