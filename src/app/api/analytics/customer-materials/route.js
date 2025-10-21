// src/app/api/analytics/customer-materials/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
     return NextResponse.json( { error: 'Chybí konfigurace Supabase' }, { status: 500 });
   }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // === UJISTĚTE SE, ŽE VOLÁTE TUTO FUNKCI ===
    const { data, error } = await supabaseAdmin.rpc('get_analysis_with_positions_v5');
    // ===========================================

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_analysis_with_positions_v5):', error);
      // Pokud funkce neexistuje, tato chyba se objeví zde
      throw new Error(`Chyba databáze: ${error.message}`);
    }

    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: headers,
    });

  } catch (error) {
     // Chyba se zachytí zde a pošle jako odpověď
     console.error("API Error:", error); // Logování chyby na serveru Vercelu
     return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
   }
}