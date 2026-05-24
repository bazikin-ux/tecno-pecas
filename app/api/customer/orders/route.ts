import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Informe um email valido." }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase nao configurado." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id, status, payment_method, subtotal, discount, shipping, total, items, created_at, mercado_pago_response")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar pedidos.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro interno ao buscar historico.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
