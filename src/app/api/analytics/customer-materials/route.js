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
  // MIERNE UPRAVENÝ SQL DOTAZ (iný prístup k subquery)
  // ===================================================================
  const sqlQuery = `
    SELECT
      cmq.zakaznik,
      cmq.material,
      cmq.celkove_mnozstvi,
      COALESCE(mp.pozice_info, 'Nenalezeno ve skladu') AS pozice_info
    FROM (
      -- Subquery A: Agregácia zákazníkov a materiálov
      SELECT
        CASE
          WHEN d."Name of ship-to party" ILIKE '%VOLVO%' THEN 'VOLVO (Group)'
          WHEN d."Name of ship-to party" ILIKE '%DAIMLER%' THEN 'DAIMLER (Group)'
          ELSE d."Name of ship-to party"
        END AS zakaznik,
        p.material,
        SUM(p."source_actual_qty") AS celkove_mnozstvi
      FROM public.deliveries AS d
      JOIN public.picking_operations AS p ON d."Delivery No" = p.delivery_no
      WHERE d.is_archived = false AND p.material IS NOT NULL
      GROUP BY zakaznik, p.material
    ) AS cmq
    LEFT JOIN (
      -- Subquery B: Agregácia pozícií pre materiál
      SELECT
        material,
        string_agg(
          storage_bin || ' (' || available_stock::TEXT || 'ks)',
          ', ' ORDER BY storage_bin
        ) AS pozice_info
      FROM public.warehouse_stock
      WHERE available_stock > 0
      GROUP BY material
    ) AS mp ON cmq.material = mp.material
    ORDER BY
      cmq.zakaznik ASC,
      cmq.celkove_mnozstvi DESC;
  `;
  // ===================================================================

  try {
    const { data, error } = await supabaseAdmin.sql(sqlQuery);

    if (error) {
      console.error('Chyba při volání Supabase SQL:', error);
      throw error;
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
    return NextResponse.json(
      { error: `Interní chyba serveru: ${error.message}` },
      { status: 500 }
    );
  }
}