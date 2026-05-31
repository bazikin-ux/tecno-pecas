"use client";

import { useState } from "react";
import { formatCurrency } from "@/app/lib/commerce";

export default function ProductShippingSimulator({ productPrice }: { productPrice: number }) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    const cleanCep = cep.replace(/\D/g, "");
    if (!cleanCep) {
      setError("Por favor, digite um CEP.");
      setQuote(null);
      return;
    }
    if (cleanCep.length !== 8) {
      setError("CEP inválido. Digite um CEP com 8 números.");
      setQuote(null);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cleanCep, subtotal: productPrice }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Erro ao calcular frete.");
        setQuote(null);
      } else {
        setQuote(data);
      }
    } catch {
      setError("Erro ao conectar ao servidor de frete.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-[#1e1f22] p-4 flex flex-col justify-between">
      <div>
        <p className="text-sm text-[#b5bac1]">Simulação de Frete</p>
        <div className="mt-2 flex gap-2">
          <input
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="Digite o CEP"
            maxLength={9}
            className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none text-white text-sm"
          />
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="rounded-lg bg-[#5865f2] px-4 text-sm font-bold hover:bg-[#4752c4] disabled:opacity-50"
          >
            {loading ? "..." : "Calcular"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
      {quote && (
        <div className="mt-3">
          <p className="text-xl font-black text-[#23a559]">
            {quote.price === 0 ? "Grátis" : formatCurrency(quote.price)}
          </p>
          <p className="text-xs text-[#b5bac1]">
            {quote.carrier} - {quote.service} • {quote.deliveryDays}
          </p>
        </div>
      )}
    </div>
  );
}
