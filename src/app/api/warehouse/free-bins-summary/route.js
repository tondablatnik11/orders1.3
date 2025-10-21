// src/app/api/warehouse/free-bins-summary/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) { /* ... error handling ... */ }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Voláme NOVOU funkci z Kroku 1
    const { data, error } = await supabaseAdmin.rpc('get_empty_bin_summary_v2'); // <-- Změna názvu funkce

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_empty_bin_summary_v2):', error);
      throw error;
    }

    // Zpracujeme data pro frontend: seskupíme podle skladu
    const groupedData = data.reduce((acc, item) => {
      // Změna názvu sloupce
      const { sklad, typ_binu, pocet_prazdnych } = item;
      if (!acc[sklad]) {
        acc[sklad] = {
          celkem_prazdnych: 0, // Změna názvu
          typy_binu: []
        };
      }
      acc[sklad].typy_binu.push({ typ: typ_binu, pocet: pocet_prazdnych });
      acc[sklad].celkem_prazdnych += pocet_prazdnych; // Změna názvu
      return acc;
    }, {});

    // Hlavičky pro zákaz cachování
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Vracíme seskupená data
    return new NextResponse(JSON.stringify(groupedData), {
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