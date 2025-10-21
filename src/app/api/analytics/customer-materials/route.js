// src/app/api/analytics/customer-materials/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // Říká Vercelu, aby funkci nespouštěl při sestavení

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Chybí konfigurace Supabase (URL nebo Service Key)');
    return NextResponse.json(
      { error: 'Chybí konfigurace Supabase (URL nebo Service Key)' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabaseAdmin.rpc('get_customer_material_summary');

    if (error) {
      console.error('Chyba při volání Supabase RPC:', error);
      throw error;
    }

    // ===================================================================
    // ZDE JE KLÍČOVÁ ZMĚNA
    // Přidáváme hlavičky, které Vercelu a prohlížeči říkají: "NECACHOVAT!"
    // ===================================================================
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: headers,
    });
    // ===================================================================

  } catch (error) {
    return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
  }
}