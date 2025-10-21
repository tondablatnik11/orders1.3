// src/app/api/analytics/customer-materials/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Tato proměnná donutí Vercel spouštět funkci dynamicky (ne při sestavení)
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
    // Voláme SQL funkci, která MÁ v sobě logiku pro Volvo/Daimler
    const { data, error } = await supabaseAdmin.rpc('get_customer_material_summary');

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_customer_material_summary):', error);
      throw error;
    }

    // ===================================================================
    // ZDE JE FINÁLNÍ ZÁKAZ CACHOVÁNÍ
    // Nastavíme hlavičky odpovědi, které Vercelu explicitně říkají "NECACHOVAT!"
    // ===================================================================
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Vracíme odpověď s daty a novými hlavičkami
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
  }
}