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

  // ===================================================================
  // ZDE JE KLÍČOVÁ ZMĚNA:
  // Přesunuli jsme celou SQL logiku přímo sem, abychom obešli
  // problematickou databázovou funkci.
  // ===================================================================
  const sqlQuery = `
    SELECT
      -- Agregační logika
      CASE
        WHEN d."Name of ship-to party" ILIKE '%VOLVO%' THEN 'VOLVO (Group)'
        WHEN d."Name of ship-to party" ILIKE '%DAIMLER%' THEN 'DAIMLER (Group)'
        ELSE d."Name of ship-to party"
      END AS zakaznik,
      
      p.material AS material,
      SUM(p."source_actual_qty") AS celkove_mnozstvi
    FROM
      public.deliveries AS d
    JOIN
      public.picking_operations AS p ON d."Delivery No" = p.delivery_no
    WHERE
      d.is_archived = false
      AND p.material IS NOT NULL
    GROUP BY
      -- Agregační logika musí být i zde
      CASE
        WHEN d."Name of ship-to party" ILIKE '%VOLVO%' THEN 'VOLVO (Group)'
        WHEN d."Name of ship-to party" ILIKE '%DAIMLER%' THEN 'DAIMLER (Group)'
        ELSE d."Name of ship-to party"
      END,
      p.material
    ORDER BY
      zakaznik ASC,
      celkove_mnozstvi DESC;
  `;
  // ===================================================================

  try {
    // ZMĚNA: Voláme .sql() místo .rpc()
    const { data, error } = await supabaseAdmin.sql(sqlQuery);

    if (error) {
      console.error('Chyba při volání Supabase SQL:', error);
      throw error;
    }

    // Hlavičky pro zákaz cachování (necháme je pro jistotu)
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

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