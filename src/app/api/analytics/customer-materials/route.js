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
    // FINÁLNA OPRAVA: Voláme NOVÚ funkciu z Kroku 1 pomocou .rpc()
    // ===================================================================
    const { data, error } = await supabaseAdmin.rpc('get_analysis_with_positions_v3'); // <-- Voláme novú funkciu

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_analysis_with_positions_v3):', error);
      throw error;
    }

    // Hlavičky pre zákaz cachovania
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // API teraz vracia { zakaznik, material, celkove_mnozstvi, pozice_info }
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