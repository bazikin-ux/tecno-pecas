import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function authorized(request: Request) {
  return request.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const { data: currentOrder } = await supabase
    .from("orders")
    .select("mercado_pago_response")
    .eq("id", id)
    .single();

  const previousResponse =
    currentOrder?.mercado_pago_response &&
    typeof currentOrder.mercado_pago_response === "object"
      ? currentOrder.mercado_pago_response
      : {};
  const previousCheckout =
    "checkout" in previousResponse && typeof previousResponse.checkout === "object"
      ? previousResponse.checkout
      : {};

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: body.status,
      mercado_pago_response: {
        ...previousResponse,
        checkout: {
          ...previousCheckout,
          tracking_code: body.trackingCode ?? previousCheckout.tracking_code ?? "",
        },
      },
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar pedido.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
