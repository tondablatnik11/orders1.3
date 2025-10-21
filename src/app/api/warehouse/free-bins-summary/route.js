// src/app/api/warehouse/empty-bins-list/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Získáme parametry z URL query
  const { searchParams } = new URL(request.url);
  const sklad = searchParams.get('sklad');
  const typBinu = searchParams.get('typBinu');

  if (!sklad || !typBinu) {
    return NextResponse.json({ error: 'Chybí parametry sklad nebo typBinu' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) { /* ... error handling ... */ }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Voláme novou funkci z Kroku 2 s parametry
    const { data, error } = await supabaseAdmin.rpc('get_empty_bin_list_v1', {
      target_sklad: sklad,
      target_typ_binu: typBinu,
    });

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_empty_bin_list_v1):', error);
      throw error;
    }

    // Vracíme přímo pole názvů binů
    return NextResponse.json(data.map(item => item.storage_bin));

  } catch (error) {
    return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
  }
}