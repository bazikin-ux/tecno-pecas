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
  oldPrice: number;
  stock: number;
  specs: string;
  tag: string;
  rating: number;
  sold: number;
  image: string;
  slug?: string;
  brand?: string;
};

type CartItem = Product & { quantity: number };

const storeProfileImage = "/tecno-pecas-profile.png";
const favoritesKey = "tecno-pecas-favorites";

export default function PromotionsPage() {
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [category, setCategory] = useState("Todos");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch products
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setStoreProducts(data);
        }
      } catch (e) {
        console.error("Erro ao carregar produtos:", e);
      }
    }
    loadProducts();
  }, []);

  // Sync favorites
  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(favoritesKey) || "[]") as number[];
      setFavoriteIds(Array.isArray(savedFavorites) ? savedFavorites : []);
    } catch {
      localStorage.removeItem(favoritesKey);
    }
  }, []);

  // Sync cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("tecnopecas_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Erro ao carregar o carrinho:", e);
    }
    setIsCartLoaded(true);
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem("tecnopecas_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Erro ao salvar o carrinho:", e);
    }
  }, [cart, isCartLoaded]);

  const categories = useMemo(() => {
    const list = storeProducts.map((p) => p.category);
    return ["Todos", ...Array.from(new Set(list))];
  }, [storeProducts]);

  const brands = useMemo(() => {
    const list = storeProducts.map((p) => p.brand).filter(Boolean) as string[];
    return ["Todas", ...Array.from(new Set(list))];
  }, [storeProducts]);

  // Filter for products that are on promotion (oldPrice > price) and match criteria
  const promotionalProducts = useMemo(() => {
    return storeProducts
      .filter((p) => p.oldPrice > p.price)
      .map((p) => {
        const discountPercent = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
        return { ...p, discountPercent };
      })
      .sort((a, b) => b.discountPercent - a.discountPercent);
  }, [storeProducts]);

  const filtered = useMemo(() => {
    return promotionalProducts.filter((p) => {
      const text = `${p.name} ${p.brand || ""} ${p.category} ${p.specs} ${p.tag}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory = category === "Todos" || p.category === category;
      const matchesBrand = selectedBrand === "Todas" || p.brand === selectedBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [promotionalProducts, search, category, selectedBrand]);

  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  function addToCart(product: Product) {
    const found = cart.find((item) => item.id === product.id);
    if (found) {
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    alert(`${product.name} adicionado ao carrinho!`);
  }

  function toggleFavorite(productId: number) {
    const nextFavorites = favoriteIds.includes(productId)
      ? favoriteIds.filter((id) => id !== productId)
      : [...favoriteIds, productId];
    setFavoriteIds(nextFavorites);
    localStorage.setItem(favoritesKey, JSON.stringify(nextFavorites));
  }

  return (
    <main className="min-h-screen bg-[#313338] text-[#f2f3f5]">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#1e1f22] bg-[#2b2d31] px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg bg-[#1e1f22] px-4 py-2 font-black hover:bg-[#404249]"
        >
          ☰ Menu
        </button>
        <span className="flex items-center gap-2 font-black text-white">
          <Image src={storeProfileImage} alt="Tecno Pecas" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
          Tecno Pecas
        </span>
        <Link href="/carrinho" className="rounded-lg bg-[#1e1f22] px-3 py-2 text-sm font-bold text-white transition">
          🛒 {totalItems}
        </Link>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative h-full w-80 max-w-[86vw] overflow-y-auto bg-[#2b2d31] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <Image src={storeProfileImage} alt="Tecno Pecas" width={64} height={64} className="mb-3 h-16 w-16 rounded-full object-cover" />
                <h2 className="text-2xl font-black">Menu</h2>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#1e1f22] px-3 py-2 font-black">
                X
              </button>
            </div>
            <section className="space-y-4">
              <Link href="/" className="block rounded-lg bg-[#1e1f22] px-4 py-3 font-bold hover:bg-[#5865f2]">
                Home
              </Link>
              <Link href="/carrinho" className="block rounded-lg bg-[#e18728] px-4 py-3 font-bold text-white">
                Meu Carrinho 🛒
              </Link>
              <Link href="/promocoes" className="block rounded-lg bg-[#da373c] px-4 py-3 font-bold text-white">
                🔥 Promoções
              </Link>
              <Link href="/mais-vendidos" className="block rounded-lg bg-[#23a559] px-4 py-3 font-bold text-white">
                ⭐ Mais Vendidos
              </Link>
              <Link href="/monte-seu-pc" className="block rounded-lg bg-[#1e1f22] px-4 py-3 font-bold hover:bg-[#404249]">
                Monte seu PC
              </Link>
            </section>
          </aside>
        </div>
      )}

      <div className="grid min-h-screen md:grid-cols-[78px_250px_1fr]">
        {/* Left Side Icon Sidebar */}
        <aside className="hidden bg-[#1e1f22] p-3 md:block">
          <Link href="/">
            <Image src={storeProfileImage} alt="Tecno Pecas" width={48} height={48} className="mb-4 h-12 w-12 rounded-2xl object-cover" />
          </Link>
        </aside>

        {/* Desktop Sidebar */}
        <aside className="hidden bg-[#2b2d31] p-4 md:block">
          <h1 className="text-2xl font-black text-white">Tecno Peças</h1>
          <p className="mb-5 text-sm text-[#b5bac1]">Loja de hardware</p>
          
          <Link href="/" className="mb-3 block rounded-lg bg-[#404249] px-3 py-2 text-center font-bold text-white hover:bg-[#5865f2]">
            Voltar para a Home
          </Link>
          <Link href="/carrinho" className="mb-3 block rounded-lg bg-[#e18728] px-3 py-2 text-center font-bold text-white transition hover:bg-[#c7731d]">
            Meu Carrinho
          </Link>
          <Link href="/promocoes" className="mb-3 block rounded-lg bg-[#da373c] px-3 py-2 text-center font-bold text-white transition">
            🔥 Promoções
          </Link>
          <Link href="/mais-vendidos" className="mb-3 block rounded-lg bg-[#23a559] px-3 py-2 text-center font-bold text-white transition hover:bg-[#1f8f4d]">
            ⭐ Mais Vendidos
          </Link>
          <Link href="/monte-seu-pc" className="mb-3 block rounded-lg bg-[#5865f2] px-3 py-2 text-center font-bold text-white hover:bg-[#4752c4]">
            Monte seu PC
          </Link>

          <div className="mt-6">
            <p className="text-xs font-black text-[#b5bac1] uppercase tracking-wider mb-2">Filtrar Categoria</p>
            <button onClick={() => setCategory("Todos")} className={`mb-2 w-full rounded-lg px-3 py-2 text-left font-bold transition ${category === "Todos" ? "bg-[#5865f2] text-white" : "text-[#dbdee1] hover:bg-[#404249]"}`}>
              # todas-ofertas
            </button>
            {categories.filter((c) => c !== "Todos").map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} className={`mb-2 w-full rounded-lg px-3 py-2 text-left transition ${category === cat ? "bg-[#5865f2] text-white" : "text-[#dbdee1] hover:bg-[#404249]"}`}>
                # {cat.toLowerCase()}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="bg-[#313338]">
          <header className="sticky top-0 z-20 border-b border-[#1e1f22] bg-[#313338] px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">🔥 Ofertas Imperdíveis</h2>
                <p className="text-sm text-[#b5bac1]">Os melhores descontos da loja ordenados pela maior porcentagem de desconto.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="rounded-lg bg-[#1e1f22] px-3 py-3 outline-none text-white text-sm"
                >
                  <option value="Todas">Todas as marcas</option>
                  {brands.filter((b) => b !== "Todas").map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar oferta..."
                  className="rounded-lg bg-[#1e1f22] px-4 py-3 outline-none lg:w-80 text-sm text-white"
                />
              </div>
            </div>
          </header>

          <div className="p-5">
            {/* Trust Badges */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 w-full mb-6">
              <div className="flex items-center gap-3 rounded-xl bg-[#2b2d31] border border-[#1e1f22] p-4 hover:border-[#5865f2] transition duration-300">
                <span className="text-3xl">🚚</span>
                <div>
                  <p className="font-bold text-sm text-white">Frete Grátis</p>
                  <p className="text-xs text-[#b5bac1]">Acima de R$ 499,00</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[#2b2d31] border border-[#1e1f22] p-4 hover:border-[#5865f2] transition duration-300">
                <span className="text-3xl">💳</span>
                <div>
                  <p className="font-bold text-sm text-white">Até 12x sem juros</p>
                  <p className="text-xs text-[#b5bac1]">No cartão de crédito</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-[#2b2d31] border border-[#1e1f22] p-4 hover:border-[#5865f2] transition duration-300">
                <span className="text-3xl">🔒</span>
                <div>
                  <p className="font-bold text-sm text-white">Compra Segura</p>
                  <p className="text-xs text-[#b5bac1]">Ambiente 100% seguro</p>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-[#2b2d31] p-12 text-center">
                <p className="text-lg font-bold text-[#b5bac1]">Nenhuma promoção encontrada para os critérios selecionados.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((product) => (
                  <div key={product.id} className="relative overflow-hidden rounded-2xl bg-[#2b2d31] shadow-lg flex flex-col justify-between">
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute right-3 top-3 z-10 rounded-full bg-[#1e1f22]/90 px-3 py-2 text-sm font-black hover:bg-[#5865f2] text-white"
                    >
                      {favoriteIds.includes(product.id) ? "Favorito" : "Salvar"}
                    </button>
                    <div>
                      <div className="relative h-48 w-full bg-white p-3">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain"
                        />
                        <div className="absolute left-3 bottom-3 rounded-md bg-[#da373c] px-2 py-1 text-xs font-black text-white">
                          {product.discountPercent}% OFF
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-[#5865f2] px-2 py-1 text-xs font-bold">{product.tag}</span>
                          <span className="text-xs text-[#b5bac1]">⭐ {product.rating}</span>
                        </div>
                        <h4 className="min-h-14 text-lg font-black text-white leading-tight">{product.name}</h4>
                        <p className="min-h-10 text-xs text-[#b5bac1] mt-1">{product.specs}</p>
                        <p className="mt-3 text-sm text-[#8e9297] line-through">{formatCurrency(product.oldPrice)}</p>
                        <p className="text-2xl font-black text-[#23a559]">{formatCurrency(product.price)}</p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 grid gap-2 sm:grid-cols-2">
                      <Link
                        href={`/produto/${product.slug || slugify(product.name)}`}
                        className="rounded-lg bg-[#404249] py-3 text-center font-black text-sm text-white hover:bg-[#5865f2] transition"
                      >
                        Ver produto
                      </Link>
                      <button
                        onClick={() => addToCart(product)}
                        className="rounded-lg bg-[#5865f2] py-3 font-black text-sm text-white hover:bg-[#4752c4] transition"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
