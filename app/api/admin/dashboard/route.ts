import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function authorized(request: Request) {
  return request.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const marginPercent = Number(process.env.PROFIT_MARGIN_PERCENT || 22);

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total, subtotal, discount, shipping, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao calcular painel.", details: error.message },
      { status: 500 }
    );
  }

  const paidOrders = (data || []).filter((order) =>
    ["paid", "processing", "shipped", "delivered"].includes(order.status)
  );
  const pendingOrders = (data || []).filter((order) =>
    ["pending", "in_process"].includes(order.status)
  );
  const todayPaidOrders = paidOrders.filter((order) => order.created_at >= startOfDay);
  const monthPaidOrders = paidOrders.filter((order) => order.created_at >= startOfMonth);
  const todayRevenue = todayPaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const monthRevenue = monthPaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const shippingCollected = paidOrders.reduce((sum, order) => sum + Number(order.shipping || 0), 0);
  const estimatedProfit = Number(((revenue - shippingCollected) * (marginPercent / 100)).toFixed(2));

  return NextResponse.json({
    month: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    orders: data?.length || 0,
    paidOrders: paidOrders.length,
    pendingOrders: pendingOrders.length,
    todayRevenue,
    monthRevenue,
    totalRevenue: revenue,
    revenue,
    averageTicket: paidOrders.length ? revenue / paidOrders.length : 0,
    estimatedProfit,
    marginPercent,
  });
}
