import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateCoupon, estimateShipping, onlyNumbers } from "@/app/lib/commerce";

type CartItem = {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  category?: string;
};

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const whatsappGraphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v24.0";
const storeContactEmail = process.env.STORE_CONTACT_EMAIL || "tecnopecaspc@gmail.com";
const orderNotificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || storeContactEmail;
const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "Tecno Pecas <onboarding@resend.dev>";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

async function sendWhatsAppMessage(phone: string, message: string) {
  const to = onlyNumbers(phone);

  if (!whatsappToken || !whatsappPhoneNumberId || to.length < 10) {
    return { skipped: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/${whatsappGraphVersion}/${whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.startsWith("55") ? to : `55${to}`,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    }
  );

  const data = await response.json();
  return { ok: response.ok, data };
}

async function sendStoreOrderEmail({
  orderId,
  cart,
  customerEmail,
  customerPhone,
  payment,
  cep,
  total,
}: {
  orderId: number;
  cart: CartItem[];
  customerEmail: string;
  customerPhone: string;
  payment: string;
  cep: string;
  total: number;
}) {
  if (!resendApiKey || !orderNotificationEmail) {
    return { skipped: true };
  }

  const formattedTotal = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const itemsText = cart
    .map((item) => `${item.quantity || 1}x ${item.name} - ${Number(item.price || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`)
    .join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [orderNotificationEmail],
        subject: `Nova compra Tecno Pecas #${orderId}`,
        text: [
          `Nova compra criada na Tecno Pecas.`,
          `Pedido: #${orderId}`,
          `Cliente: ${customerEmail}`,
          `WhatsApp: ${customerPhone || "Nao informado"}`,
          `Pagamento: ${payment}`,
          `CEP: ${cep || "Nao informado"}`,
          `Total: ${formattedTotal}`,
          "",
          "Produtos:",
          itemsText,
          "",
          `Painel: ${siteUrl}/admin/orders`,
        ].join("\n"),
      }),
    });

    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function POST(request: Request) {
  try {
    if (!mercadoPagoToken) {
      return NextResponse.json(
        { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado no .env.local" },
        { status: 500 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const cart: CartItem[] = body.cart || [];

    if (!cart.length) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
    }

    const isPix = body.payment === "Pix";
    const cartWithPrices = cart.map((item) => {
      const originalPrice = Number(item.price);
      const activePrice = isPix ? Number((originalPrice * 0.95).toFixed(2)) : originalPrice;
      return {
        ...item,
        price: activePrice,
      };
    });

    const subtotal = cartWithPrices.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity || 1),
      0
    );

    const coupon = calculateCoupon(body.coupon || "", subtotal);
    const discount = coupon.valid ? coupon.discount : 0;
    const shippingQuote = body.shippingQuote?.cep
      ? body.shippingQuote
      : estimateShipping(body.cep || "", subtotal);
    const shipping = Number(shippingQuote.price || 0);
    const total = Number((subtotal - discount + shipping).toFixed(2));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_email: body.customerEmail || "cliente@teste.com",
        status: "pending",
        payment_method: body.payment || "Mercado Pago",
        subtotal,
        discount,
        shipping,
        total,
        items: cartWithPrices,
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json(
        { error: "Erro ao salvar pedido no Supabase.", details: orderError },
        { status: 500 }
      );
    }

    const preference = {
      items: cartWithPrices.map((item) => ({
        title: item.name,
        quantity: Number(item.quantity || 1),
        currency_id: "BRL",
        unit_price: Number(item.price),
      })),
      back_urls: {
        success: `${siteUrl}/sucesso?order_id=${order.id}`,
        failure: `${siteUrl}/falha?order_id=${order.id}`,
        pending: `${siteUrl}/pendente?order_id=${order.id}`,
      },
      notification_url: `${siteUrl}/api/mercado-pago/webhook`,
      payer: {
        email: body.customerEmail || "comprador@teste.com",
      },
      external_reference: String(order.id),
      metadata: {
        order_id: order.id,
        loja: "Tecno Peças",
        cupom: coupon.valid ? coupon.code : "",
        cep: body.cep || "",
      },
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mercadoPagoToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      await supabase
        .from("orders")
        .update({ status: "checkout_error", mercado_pago_response: data })
        .eq("id", order.id);

      return NextResponse.json(
        { error: "Erro do Mercado Pago ao criar preferência.", details: data },
        { status: 500 }
      );
    }

    await supabase
      .from("orders")
      .update({
        mercado_pago_preference_id: data.id,
        mercado_pago_response: {
          preference: data,
          checkout: {
            coupon: coupon.valid ? coupon.code : "",
            coupon_percent: coupon.valid ? coupon.percent : 0,
            customer_phone: body.customerPhone || "",
            cep: body.cep || "",
            shipping_quote: shippingQuote,
            tracking_code: "",
          },
        },
      })
      .eq("id", order.id);

    await sendWhatsAppMessage(
      body.customerPhone || "",
      `Tecno Pecas: recebemos seu pedido #${order.id}. Total ${total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}. Acompanhe em ${siteUrl}/rastreamento?pedido=${order.id}`
    );

    await sendStoreOrderEmail({
      orderId: order.id,
      cart,
      customerEmail: body.customerEmail || "cliente@teste.com",
      customerPhone: body.customerPhone || "",
      payment: body.payment || "Mercado Pago",
      cep: body.cep || "",
      total,
    });

    return NextResponse.json({
      order_id: order.id,
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro interno ao criar pagamento.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
