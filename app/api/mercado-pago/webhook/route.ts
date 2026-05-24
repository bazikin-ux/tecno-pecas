import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentId = body?.data?.id;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
      }
    );

    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar pagamento.", details: payment },
        { status: 500 }
      );
    }

    const orderId = payment.external_reference;

    if (!orderId) {
      return NextResponse.json({ ok: true, warning: "Sem orderId" });
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

    const newStatus = statusMap[payment.status] || payment.status;

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("mercado_pago_response")
      .eq("id", orderId)
      .single();

    const previousResponse =
      existingOrder?.mercado_pago_response &&
      typeof existingOrder.mercado_pago_response === "object"
        ? existingOrder.mercado_pago_response
        : {};

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        mercado_pago_payment_id: String(payment.id),
        mercado_pago_status: payment.status,
        mercado_pago_response: {
          ...previousResponse,
          payment,
        },
        paid_at: payment.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", orderId);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao atualizar pedido.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, orderId, status: newStatus });
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
  return NextResponse.json({ ok: true, route: "Mercado Pago Webhook" });
}
