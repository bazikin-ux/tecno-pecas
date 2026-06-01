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

function normalizeCategory(cat: string): string {
  if (!cat) return "";
  let val = cat.toLowerCase();
  val = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  val = val.replace(/mãe|ma[e\u00e3]/gi, "mae");
  val = val.replace(/memoria/gi, "memoria");
  val = val.replace(/video/gi, "video");
  val = val.replace(/[^a-z0-9\s]/g, "");
  val = val.trim();
  
  if (val === "processadores" || val === "processador") return "processador";
  if (val === "placas mae" || val === "placa mae" || val === "placamae" || val === "placasmae") return "placa mae";
  if (val === "memorias ram" || val === "memoria ram" || val === "ram") return "memoria ram";
  if (val === "armazenamentos" || val === "armazenamento") return "armazenamento";
  if (val === "placas de video" || val === "placa de video" || val === "placas de video" || val === "placa de video") return "placa de video";
  if (val === "coolers" || val === "cooler" || val === "fans rgb" || val === "fan rgb" || val === "fans" || val === "fan") return "cooler";
  if (val === "fontes" || val === "fonte") return "fonte";
  if (val === "gabinetes" || val === "gabinete") return "gabinete";
  
  return val;
}

const slotMap: Record<string, string> = {
  cpu: "processador",
  motherboard: "placa mae",
  ram: "memoria ram",
  storage: "armazenamento",
  gpu: "placa de video",
  cooler: "cooler",
  psu: "fonte",
  case: "gabinete",
};

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
  const [filters, setFilters] = useState<Record<string, { search: string; brand: string; sort: string }>>({});

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
      slots.map((slot) => {
        const targetNormalized = slotMap[slot.id];
        const filtered = products.filter(
          (product) => normalizeCategory(product.category) === targetNormalized
        );
        return [slot.id, filtered];
      })
    ) as Record<string, Product[]>;
  }, [products]);

  const getSlotFilter = (slotId: string) => {
    return filters[slotId] || { search: "", brand: "", sort: "" };
  };

  const setSlotFilter = (slotId: string, key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [slotId]: {
        ...getSlotFilter(slotId),
        [key]: value,
      },
    }));
  };

  const brandsBySlot = useMemo(() => {
    const map: Record<string, string[]> = {};
    slots.forEach((slot) => {
      const prods = productsBySlot[slot.id] || [];
      const brands = Array.from(new Set(prods.map((p) => p.brand).filter(Boolean))) as string[];
      map[slot.id] = brands;
    });
    return map;
  }, [productsBySlot]);

  const getFilteredProducts = (slotId: string) => {
    const rawList = productsBySlot[slotId] || [];
    const { search, brand, sort } = getSlotFilter(slotId);

    let filtered = rawList;

    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.specs || "").toLowerCase().includes(term)
      );
    }

    if (brand) {
      filtered = filtered.filter((p) => p.brand === brand);
    }

    if (sort === "price-asc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  };

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

              {/* Search & Filter Bar */}
              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Buscar peça..."
                  value={getSlotFilter(slot.id).search}
                  onChange={(e) => setSlotFilter(slot.id, "search", e.target.value)}
                  className="rounded-lg bg-[#1e1f22] px-3 py-2 text-xs outline-none border border-[#404249] focus:border-[#5865f2] text-white w-full"
                />

                <select
                  value={getSlotFilter(slot.id).brand}
                  onChange={(e) => setSlotFilter(slot.id, "brand", e.target.value)}
                  className="rounded-lg bg-[#1e1f22] px-2 py-2 text-xs outline-none border border-[#404249] text-white w-full"
                >
                  <option value="">Todas as marcas</option>
                  {(brandsBySlot[slot.id] || []).map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>

                <select
                  value={getSlotFilter(slot.id).sort}
                  onChange={(e) => setSlotFilter(slot.id, "sort", e.target.value)}
                  className="rounded-lg bg-[#1e1f22] px-2 py-2 text-xs outline-none border border-[#404249] text-white w-full"
                >
                  <option value="">Ordenar por</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                </select>
              </div>

              <div className="grid gap-3 max-h-[360px] overflow-y-auto pr-1">
                {getFilteredProducts(slot.id).map((product) => (
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

                {getFilteredProducts(slot.id).length === 0 && (
                  <p className="rounded-xl bg-[#1e1f22] p-4 text-sm text-[#b5bac1]">
                    Nenhum produto atende a estes critérios de filtro.
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
