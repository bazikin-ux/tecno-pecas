"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency, slugify } from "@/app/lib/commerce";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  old_price?: number;
  oldPrice?: number;
  stock: number;
  specs: string;
  tag: string;
  image: string;
  brand?: string;
};

const slots = [
  { id: "cpu", label: "Processador", categories: ["Processadores"] },
  { id: "motherboard", label: "Placa-mae", categories: ["Placas-mãe", "Placas-mÃ£e"] },
  { id: "ram", label: "Memoria RAM", categories: ["Memórias RAM", "MemÃ³rias RAM"] },
  { id: "storage", label: "SSD / HD", categories: ["Armazenamento"] },
  { id: "gpu", label: "Placa de Video", categories: ["Placas de Vídeo", "Placas de VÃ­deo"] },
  { id: "cooler", label: "Cooler", categories: ["Cooler"] },
  { id: "psu", label: "Fonte", categories: ["Fontes"] },
  { id: "case", label: "Gabinete", categories: ["Gabinetes"] },
];

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
  };
}

function socketFrom(text: string) {
  const upper = text.toUpperCase();
  if (upper.includes("AM5")) return "AM5";
  if (upper.includes("AM4")) return "AM4";
  if (upper.includes("LGA1700")) return "LGA1700";
  return "";
}

export default function PcBuilderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Record<string, Product | null>>({});

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(Array.isArray(data) ? data.map(normalizeProduct) : []);
      } catch {
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  const total = Object.values(selected).reduce((sum, product) => sum + Number(product?.price || 0), 0);
  const cpuSocket = socketFrom(`${selected.cpu?.name || ""} ${selected.cpu?.specs || ""}`);
  const motherboardSocket = socketFrom(`${selected.motherboard?.name || ""} ${selected.motherboard?.specs || ""}`);
  const compatible = !cpuSocket || !motherboardSocket || cpuSocket === motherboardSocket;
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const productsBySlot = useMemo(() => {
    return Object.fromEntries(
      slots.map((slot) => [
        slot.id,
        products.filter((product) => slot.categories.includes(product.category)),
      ])
    ) as Record<string, Product[]>;
  }, [products]);

  return (
    <main className="min-h-screen bg-[#313338] p-5 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#b5bac1]">Tecno Pecas</p>
            <h1 className="text-4xl font-black text-[#5865f2]">Monte seu PC</h1>
          </div>
          <Link href="/" className="rounded-lg bg-[#5865f2] px-4 py-3 text-center font-bold">
            Voltar para loja
          </Link>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-[#2b2d31] p-4">
            <p className="text-sm text-[#b5bac1]">Pecas escolhidas</p>
            <p className="mt-1 text-3xl font-black">{selectedCount}/{slots.length}</p>
          </div>
          <div className="rounded-xl bg-[#2b2d31] p-4">
            <p className="text-sm text-[#b5bac1]">Total estimado</p>
            <p className="mt-1 text-3xl font-black text-[#23a559]">{formatCurrency(total)}</p>
          </div>
          <div className="rounded-xl bg-[#2b2d31] p-4 md:col-span-2">
            <p className="text-sm text-[#b5bac1]">Compatibilidade</p>
            <p className={`mt-1 text-xl font-black ${compatible ? "text-[#23a559]" : "text-[#da373c]"}`}>
              {compatible ? "Configuracao compativel ate aqui" : "Processador e placa-mae parecem incompatíveis"}
            </p>
            <p className="mt-1 text-xs text-[#b5bac1]">A checagem considera AM4, AM5 e LGA1700 nas especificacoes.</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {slots.map((slot) => (
            <div key={slot.id} className="rounded-2xl bg-[#2b2d31] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{slot.label}</h2>
                  <p className="text-sm text-[#b5bac1]">{selected[slot.id]?.name || "Escolha uma peca"}</p>
                </div>
                {selected[slot.id] && (
                  <button
                    onClick={() => setSelected({ ...selected, [slot.id]: null })}
                    className="rounded-lg bg-[#404249] px-3 py-2 text-sm font-bold hover:bg-[#da373c]"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="grid gap-3">
                {(productsBySlot[slot.id] || []).slice(0, 4).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelected({ ...selected, [slot.id]: product })}
                    className={`grid gap-3 rounded-xl p-3 text-left md:grid-cols-[72px_1fr_auto] md:items-center ${
                      selected[slot.id]?.id === product.id ? "bg-[#5865f2]" : "bg-[#1e1f22] hover:bg-[#404249]"
                    }`}
                  >
                    <Image
                      src={product.image || "https://via.placeholder.com/200"}
                      alt={product.name}
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] rounded-lg bg-white object-contain p-1"
                    />
                    <span>
                      <span className="block font-bold">{product.name}</span>
                      <span className="block text-sm text-[#b5bac1]">{product.specs}</span>
                    </span>
                    <span className="font-black text-[#23a559]">{formatCurrency(product.price)}</span>
                  </button>
                ))}

                {(productsBySlot[slot.id] || []).length === 0 && (
                  <p className="rounded-xl bg-[#1e1f22] p-4 text-sm text-[#b5bac1]">
                    Nenhum produto desta categoria foi cadastrado ainda.
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl bg-[#2b2d31] p-5">
          <h2 className="text-2xl font-black">Resumo</h2>
          <div className="mt-4 grid gap-2">
            {slots.map((slot) => (
              <div key={slot.id} className="flex flex-col justify-between gap-1 rounded-lg bg-[#1e1f22] p-3 sm:flex-row">
                <span className="font-bold">{slot.label}</span>
                {selected[slot.id] ? (
                  <Link href={`/produto/${slugify(selected[slot.id]!.name)}`} className="text-[#23a559] hover:underline">
                    {selected[slot.id]!.name} - {formatCurrency(selected[slot.id]!.price)}
                  </Link>
                ) : (
                  <span className="text-[#b5bac1]">Nao escolhido</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
