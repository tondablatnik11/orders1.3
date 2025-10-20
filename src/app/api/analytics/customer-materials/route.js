// src/app/api/analytics/customer-materials/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // Zajistí, že se data nebudou cachovat

export async function GET() {
  // Vytvoříme admin klienta POUZE na serveru.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Chybí konfigurace Supabase (URL nebo Service Key)');
    return NextResponse.json(
      { error: 'Chybí konfigurace Supabase (URL nebo Service Key)' },
      { status: 500 }
    );
  }

  // Tento klient má plná administrátorská práva a obchází RLS.
  // NIKDY jej nepoužívejte na frontendu.
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Zavoláme databázovou funkci, kterou jsme vytvořili v Kroku 1
    const { data, error } = await supabaseAdmin.rpc('get_customer_material_summary');

    if (error) {
      console.error('Chyba při volání Supabase RPC:', error);
      throw error;
    }

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
  }
}