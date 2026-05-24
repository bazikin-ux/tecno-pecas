"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/app/lib/commerce";

type CustomerOrder = {
  id: number;
  status: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  created_at: string;
  items: { name: string; quantity: number; price: number }[];
  mercado_pago_response?: {
    checkout?: {
      tracking_code?: string;
      shipping_quote?: {
        carrier?: string;
        deliveryDays?: string;
      };
    };
  };
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  rejected: "Rejeitado",
};

export default function CustomerPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedEmail, setLoggedEmail] = useState("");

  async function login() {
    if (!email.trim()) return alert("Informe seu email.");

    setLoading(true);
    const response = await fetch("/api/customer/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      alert(data.error || "Erro ao entrar.");
      return;
    }

    setOrders(Array.isArray(data) ? data : []);
    setLoggedEmail(email);
  }

  return (
    <main className="min-h-screen bg-[#313338] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-[#2b2d31] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-[#b5bac1]">Tecno Pecas</p>
              <h1 className="mt-1 text-4xl font-black text-[#5865f2]">Minha conta</h1>
              <p className="mt-2 text-[#b5bac1]">Entre com o email usado na compra para ver seu historico.</p>
            </div>
            <Link href="/" className="rounded-lg bg-[#5865f2] px-4 py-2 text-center font-bold">
              Loja
            </Link>
          </div>
        </div>

        <section className="rounded-2xl bg-[#2b2d31] p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && login()}
              placeholder="email@email.com"
              className="rounded-lg bg-[#1e1f22] p-4 outline-none"
            />
            <button onClick={login} className="rounded-lg bg-[#23a559] px-6 py-4 font-black">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </section>

        {loggedEmail && (
          <section className="mt-6">
            <h2 className="mb-4 text-2xl font-black">Pedidos de {loggedEmail}</h2>

            <div className="grid gap-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-[#2b2d31] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-2xl font-black">Pedido #{order.id}</h3>
                      <p className="text-sm text-[#b5bac1]">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
                      <p className="text-sm text-[#b5bac1]">Pagamento: {order.payment_method}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-2xl font-black text-[#23a559]">{formatCurrency(order.total)}</p>
                      <p className="text-sm font-bold text-[#b5bac1]">{statusLabel[order.status] || order.status}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_240px]">
                    <div className="space-y-2">
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="rounded-xl bg-[#1e1f22] p-3">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-sm text-[#b5bac1]">
                            {item.quantity}x {formatCurrency(item.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-[#1e1f22] p-4 text-sm text-[#b5bac1]">
                      <p className="font-black text-white">Entrega</p>
                      <p>{order.mercado_pago_response?.checkout?.shipping_quote?.carrier || "Transportadora a definir"}</p>
                      <p>{order.mercado_pago_response?.checkout?.shipping_quote?.deliveryDays || "Prazo em calculo"}</p>
                      <p>Rastreio: {order.mercado_pago_response?.checkout?.tracking_code || "Em breve"}</p>
                      <Link href={`/rastreamento?pedido=${order.id}`} className="mt-3 block rounded-lg bg-[#5865f2] py-2 text-center font-bold text-white">
                        Rastrear
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <p className="rounded-2xl bg-[#2b2d31] p-6 text-[#b5bac1]">
                  Nenhum pedido encontrado para este email.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
