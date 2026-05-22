import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function POST(request: Request) {
  try {
    if (!supabase || !mercadoPagoToken) {
      return NextResponse.json({ error: "Variáveis de ambiente ausentes." }, { status: 500 });
    }

    const body = await request.json();

    const paymentId =
      body?.data?.id ||
      body?.id ||
      new URL(request.url).searchParams.get("data.id");

    const topic =
      body?.type ||
      body?.topic ||
      new URL(request.url).searchParams.get("topic");

    if (!paymentId || (topic && !String(topic).includes("payment"))) {
      return NextResponse.json({ received: true });
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
      }
    );

    const payment = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar pagamento no Mercado Pago.", details: payment },
        { status: 500 }
      );
    }

    const orderId = payment.external_reference || payment.metadata?.order_id;

    if (!orderId) {
      return NextResponse.json({ received: true, warning: "Pagamento sem order_id." });
    }

    const statusMap: Record<string, string> = {
      approved: "paid",
      pending: "pending",
      in_process: "pending",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "charged_back",
    };

    const newStatus = statusMap[payment.status] || payment.status || "unknown";

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        mercado_pago_payment_id: String(payment.id),
        mercado_pago_status: payment.status,
        mercado_pago_response: payment,
        paid_at: payment.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", orderId);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar pedido no Supabase.", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true, order_id: orderId, status: newStatus });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro interno no webhook.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "Mercado Pago webhook Tecno Peças" });
}
