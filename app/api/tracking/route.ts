import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!orderId) {
      return NextResponse.json({ error: "Informe o numero do pedido." }, { status: 400 });
    }

    let query = supabase
      .from("orders")
      .select("id, customer_email, status, shipping, total, items, created_at, mercado_pago_response")
      .eq("id", orderId);

    if (email) {
      query = query.eq("customer_email", email);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
    }

    const checkout = data.mercado_pago_response?.checkout || {};

    return NextResponse.json({
      id: data.id,
      status: data.status,
      shipping: data.shipping,
      total: data.total,
      items: data.items || [],
      created_at: data.created_at,
      tracking_code: checkout.tracking_code || "",
      shipping_quote: checkout.shipping_quote || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao consultar rastreamento.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
