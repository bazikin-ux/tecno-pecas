"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/app/lib/commerce";

type TrackingOrder = {
  id: number;
  status: string;
  shipping: number;
  total: number;
  created_at: string;
  tracking_code?: string;
  shipping_quote?: {
    carrier?: string;
    service?: string;
    deliveryDays?: string;
  };
  items: { name: string; quantity: number; price: number }[];
};

const statusLabel: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pagamento aprovado",
  processing: "Preparando pedido",
  shipped: "Pedido enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  rejected: "Pagamento recusado",
};

export default function TrackingPage() {
  const [orderId, setOrderId] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("pedido") || "";
  });
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchOrder() {
    if (!orderId.trim()) return alert("Informe o numero do pedido.");

    setLoading(true);
    setOrder(null);

    const response = await fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, email }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      alert(data.error || "Pedido nao encontrado.");
      return;
    }

    setOrder(data);
  }

  return (
    <main className="min-h-screen bg-[#313338] p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-2xl bg-[#2b2d31] p-6">
          <p className="text-sm font-bold text-[#b5bac1]">Tecno Pecas</p>
          <h1 className="mt-1 text-4xl font-black text-[#5865f2]">Rastreamento do pedido</h1>
          <p className="mt-2 text-[#b5bac1]">Consulte o andamento, frete e codigo de rastreio.</p>
        </div>

        <div className="rounded-2xl bg-[#2b2d31] p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Numero do pedido"
              className="rounded-lg bg-[#1e1f22] p-3 outline-none"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email usado na compra"
              className="rounded-lg bg-[#1e1f22] p-3 outline-none"
            />
            <button onClick={searchOrder} className="rounded-lg bg-[#5865f2] px-5 py-3 font-black">
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {order && (
            <div className="mt-6 rounded-xl bg-[#1e1f22] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">Pedido #{order.id}</h2>
                  <p className="text-sm text-[#b5bac1]">
                    {new Date(order.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-lg bg-[#313338] px-4 py-2 font-black text-[#23a559]">
                  {statusLabel[order.status] || order.status}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-[#313338] p-3">
                  <p className="text-xs text-[#b5bac1]">Transportadora</p>
                  <p className="font-bold">{order.shipping_quote?.carrier || "A definir"}</p>
                </div>
                <div className="rounded-lg bg-[#313338] p-3">
                  <p className="text-xs text-[#b5bac1]">Prazo</p>
                  <p className="font-bold">{order.shipping_quote?.deliveryDays || "Em calculo"}</p>
                </div>
                <div className="rounded-lg bg-[#313338] p-3">
                  <p className="text-xs text-[#b5bac1]">Codigo</p>
                  <p className="font-bold">{order.tracking_code || "Ainda nao enviado"}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between rounded-lg bg-[#313338] p-3">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-between text-xl font-black">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          )}
        </div>

        <Link href="/" className="mt-5 inline-block text-sm font-bold text-[#b5bac1]">
          Voltar para a loja
        </Link>
      </div>
    </main>
  );
}
