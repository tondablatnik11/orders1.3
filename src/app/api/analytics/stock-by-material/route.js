// src/app/api/analytics/stock-by-material/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Získáme kód materiálu z URL query
  const { searchParams } = new URL(request.url);
  const material = searchParams.get('material');

  if (!material) {
    return NextResponse.json({ error: 'Chybí parametr materiálu' }, { status: 400 });
  }

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
    // Zavoláme novou databázovou funkci (Krok 2)
    const { data, error } = await supabaseAdmin.rpc('get_stock_by_material', {
      material_code: material,
    });

    if (error) {
      console.error('Chyba při volání Supabase RPC (get_stock_by_material):', error);
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