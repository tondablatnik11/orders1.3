// src/app/api/analytics/customer-materials/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Chybí konfigurace Supabase' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ===================================================================
    // VRACÍME SE K FUNKČNÍ METODĚ .rpc()
    // A voláme NOVOU funkci z Kroku 1
    // ===================================================================
    const { data, error } = await supabaseAdmin.rpc('get_customer_material_analysis_v2'); // <-- Změna názvu funkce

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_customer_material_analysis_v2):', error);
      throw error;
    }

    // Hlavičky pro zákaz cachování (pro jistotu)
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    // Tato sekce by se již neměla spustit, pokud Krok 1 proběhl
    return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
  }
}