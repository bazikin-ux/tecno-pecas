"use client";

import { useState } from "react";

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  customer_email: string;
  status: string;
  payment_method: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  items: OrderItem[];
  mercado_pago_status?: string;
  mercado_pago_payment_id?: string;
  created_at: string;
};

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default function AdminOrdersPage() {
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadOrders(currentPassword = password) {
    setLoading(true);

    const response = await fetch("/api/admin/orders", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    setLoading(false);

    if (!response.ok) {
      alert("Senha inválida ou erro ao buscar pedidos.");
      setIsLogged(false);
      return;
    }

    const data = await response.json();
    setOrders(Array.isArray(data) ? data : []);
  }

  async function login() {
    if (!password.trim()) {
      alert("Digite a senha do admin.");
      return;
    }

    setIsLogged(true);
    await loadOrders(password);
  }

  async function updateStatus(orderId: number, status: string) {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      alert("Erro ao atualizar status.");
      return;
    }

    await loadOrders();
  }

  if (!isLogged) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#313338] p-6 text-white">
        <div className="w-full max-w-md rounded-2xl bg-[#2b2d31] p-8">
          <h1 className="text-4xl font-black text-[#5865f2]">Pedidos</h1>
          <p className="mt-2 text-[#b5bac1]">Área protegida da Tecno Peças</p>

          <input
            type="password"
            className="mt-6 w-full rounded-lg bg-[#1e1f22] p-4 outline-none"
            placeholder="Senha do admin"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && login()}
          />

          <button onClick={login} className="mt-4 w-full rounded-lg bg-[#5865f2] py-3 font-black">
            Entrar
          </button>

          <a href="/admin" className="mt-4 block text-center text-sm text-[#b5bac1]">
            Voltar ao admin de produtos
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#313338] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl bg-[#2b2d31] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black text-[#5865f2]">Painel de Pedidos</h1>
              <p className="mt-2 text-[#b5bac1]">
                Veja pedidos criados pelo checkout da Tecno Peças.
              </p>
            </div>

            <div className="flex gap-2">
              <a href="/admin" className="rounded-lg bg-[#5865f2] px-4 py-2 font-bold">
                Produtos
              </a>
              <button onClick={() => loadOrders()} className="rounded-lg bg-[#23a559] px-4 py-2 font-bold">
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <p className="mb-4 rounded-xl bg-[#2b2d31] p-4 text-yellow-400">
            Carregando pedidos...
          </p>
        )}

        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-[#2b2d31] p-5">
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">Pedido #{order.id}</h2>
                  <p className="text-sm text-[#b5bac1]">{formatDate(order.created_at)}</p>
                  <p className="text-sm text-[#b5bac1]">Cliente: {order.customer_email || "Sem email"}</p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-2xl font-black text-[#23a559]">{formatPrice(order.total)}</p>
                  <p className="text-sm text-[#b5bac1]">Pagamento: {order.payment_method || "Mercado Pago"}</p>
                  <p className="text-sm text-[#b5bac1]">MP: {order.mercado_pago_status || "sem retorno"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                <div>
                  <h3 className="mb-2 font-black">Produtos</h3>

                  <div className="space-y-2">
                    {(order.items || []).map((item, index) => (
                      <div key={index} className="rounded-xl bg-[#1e1f22] p-3">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-[#b5bac1]">
                          Qtd: {item.quantity} • Valor: {formatPrice(item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#1e1f22] p-4">
                  <p className="mb-2 font-black">Status do pedido</p>

                  <select
                    value={order.status || "pending"}
                    onChange={(event) => updateStatus(order.id, event.target.value)}
                    className="w-full rounded-lg bg-[#313338] p-3 outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="processing">Preparando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="rejected">Rejeitado</option>
                  </select>

                  <div className="mt-4 space-y-1 text-sm text-[#b5bac1]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Desconto</span>
                      <span>{formatPrice(order.discount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete</span>
                      <span>{formatPrice(order.shipping)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && !loading && (
            <p className="rounded-2xl bg-[#2b2d31] p-6 text-[#b5bac1]">
              Nenhum pedido encontrado ainda.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
