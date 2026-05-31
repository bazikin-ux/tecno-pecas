"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/app/lib/commerce";

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
  created_at?: string;
};

type CartItem = Product & { quantity: number };

const storeProfileImage = "/tecno-pecas-profile.png";
const favoritesKey = "tecno-pecas-favorites";

export default function CategoryPageClient({
  categorySlug,
  categoryTitle,
  initialProducts,
}: {
  categorySlug: string;
  categoryTitle: string;
  initialProducts: Product[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [sortOption, setSortOption] = useState("mais-vendidos");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

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

  // Extract unique brands present in this category
  const brands = useMemo(() => {
    const list = initialProducts.map((p) => p.brand).filter(Boolean) as string[];
    return ["Todas", ...Array.from(new Set(list))];
  }, [initialProducts]);

  // Handle Search, Brand Filter and Sorting
  const filtered = useMemo(() => {
    return initialProducts.filter((p) => {
      const text = `${p.name} ${p.brand || ""} ${p.category} ${p.specs} ${p.tag}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesBrand = selectedBrand === "Todas" || p.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    });
  }, [initialProducts, search, selectedBrand]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortOption === "menor-preco") {
      return list.sort((a, b) => a.price - b.price);
    } else if (sortOption === "maior-preco") {
      return list.sort((a, b) => b.price - a.price);
    } else if (sortOption === "mais-vendidos") {
      return list.sort((a, b) => b.sold - a.sold);
    } else if (sortOption === "mais-recentes") {
      return list.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());
    }
    return list;
  }, [filtered, sortOption]);

  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  function showToast(message: string) {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }

  function addToCart(product: Product) {
    const found = cart.find((item) => item.id === product.id);
    if (found) {
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast("✅ Produto adicionado ao carrinho");
    setIsMiniCartOpen(true);
  }

  function removeFromCart(id: number) {
    setCart(cart.filter((item) => item.id !== id));
  }

  function updateQuantity(id: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
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
              <Link href="/monte-seu-pc" className="block rounded-lg bg-[#5865f2] px-4 py-3 font-bold hover:bg-[#404249]">
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
          
          <Link href="/" className="mb-3 block rounded-lg bg-[#404249] px-3 py-2 text-center font-bold text-white hover:bg-[#5865f2] transition">
            Voltar para a Home
          </Link>
          <Link href="/carrinho" className="mb-3 block rounded-lg bg-[#e18728] px-3 py-2 text-center font-bold text-white transition hover:bg-[#c7731d]">
            Meu Carrinho
          </Link>
          <Link href="/promocoes" className="mb-3 block rounded-lg bg-[#da373c] px-3 py-2 text-center font-bold text-white transition hover:bg-[#b92d32]">
            🔥 Promoções
          </Link>
          <Link href="/mais-vendidos" className="mb-3 block rounded-lg bg-[#23a559] px-3 py-2 text-center font-bold text-white transition hover:bg-[#1f8f4d]">
            ⭐ Mais Vendidos
          </Link>
          <Link href="/monte-seu-pc" className="mb-3 block rounded-lg bg-[#5865f2] px-3 py-2 text-center font-bold text-white hover:bg-[#4752c4]">
            Monte seu PC
          </Link>
        </aside>

        {/* Main Content Area */}
        <section className="bg-[#313338]">
          <header className="sticky top-0 z-20 border-b border-[#1e1f22] bg-[#313338] px-5 py-4">
            {/* Breadcrumbs */}
            <div className="mb-3 flex items-center gap-1.5 text-xs text-[#b5bac1]">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>&gt;</span>
              <span className="hover:text-white transition">Categoria</span>
              <span>&gt;</span>
              <span className="text-white font-bold">{categoryTitle}</span>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-black text-white">{categoryTitle}</h1>
                <p className="text-sm text-[#b5bac1]">{sorted.length} produtos encontrados</p>
              </div>
              
              {/* Filters Block */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Brand Filter */}
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

                {/* Sorting Filter */}
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="rounded-lg bg-[#1e1f22] px-3 py-3 outline-none text-white text-sm"
                >
                  <option value="mais-vendidos">Mais Vendidos</option>
                  <option value="menor-preco">Menor Preço</option>
                  <option value="maior-preco">Maior Preço</option>
                  <option value="mais-recentes">Mais Recentes</option>
                </select>

                {/* Search Field */}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nesta categoria..."
                  className="rounded-lg bg-[#1e1f22] px-4 py-3 outline-none lg:w-64 text-sm text-white"
                />
              </div>
            </div>
          </header>

          <section className="p-5">
            {sorted.length === 0 ? (
              <div className="text-center py-20 bg-[#2b2d31] rounded-2xl p-6">
                <p className="text-xl font-bold text-[#b5bac1]">Nenhum produto encontrado nesta categoria.</p>
                <p className="text-sm text-[#8e9297] mt-1">Tente remover ou alterar seus filtros de pesquisa.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((product) => (
                  <div key={product.id} className="relative overflow-hidden rounded-2xl bg-[#2b2d31] shadow-lg flex flex-col justify-between">
                    <div>
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute right-3 top-3 z-10 rounded-full bg-[#1e1f22]/90 px-3 py-2 text-sm font-black hover:bg-[#5865f2]"
                      >
                        {favoriteIds.includes(product.id) ? "Favorito" : "Salvar"}
                      </button>
                      
                      <div className="relative h-44 w-full bg-white p-4">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-2"
                        />
                      </div>

                      <div className="p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-[#5865f2] px-2 py-0.5 text-xs font-bold">{product.tag}</span>
                          <span className="text-xs text-[#b5bac1]">⭐ {product.rating}</span>
                        </div>

                        <h4 className="min-h-12 text-md font-bold text-white line-clamp-2">{product.name}</h4>
                        <p className="min-h-8 text-xs text-[#b5bac1] mt-1 line-clamp-2">{product.specs}</p>

                        <p className="mt-3 text-xs text-[#8e9297] line-through">
                          {product.oldPrice > product.price ? formatCurrency(product.oldPrice) : ""}
                        </p>
                        <p className="text-2xl font-black text-[#23a559]">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-[#b5bac1] mt-0.5">Estoque: {product.stock} • {product.sold} vendidos</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 grid gap-2 grid-cols-2">
                      <Link
                        href={`/produto/${product.slug}`}
                        className="rounded-lg bg-[#404249] py-2.5 text-center text-sm font-bold hover:bg-[#5865f2] transition"
                      >
                        Ver produto
                      </Link>
                      <button 
                        onClick={() => addToCart(product)} 
                        className="rounded-lg bg-[#5865f2] py-2.5 text-sm font-bold hover:bg-[#4752c4] transition"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      {toast.visible && (
        <div className="fixed bottom-5 left-5 z-[100] flex items-center gap-2 rounded-xl border border-[#23a559] bg-[#2b2d31] px-5 py-4 text-white shadow-2xl transition-all duration-300">
          <span className="text-xl">✅</span>
          <span className="font-bold text-sm text-white">{toast.message}</span>
        </div>
      )}

      {isMiniCartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMiniCartOpen(false)}
          />
          <aside className="relative flex h-full w-80 max-w-[85vw] flex-col bg-[#2b2d31] p-5 shadow-2xl z-10 text-[#f2f3f5]">
            <div className="flex items-center justify-between border-b border-[#1e1f22] pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-white">Meu Carrinho 🛒</h2>
                <p className="text-xs text-[#b5bac1]">{totalItems} item(ns)</p>
              </div>
              <button 
                onClick={() => setIsMiniCartOpen(false)}
                className="rounded-lg bg-[#1e1f22] p-2 font-black text-white hover:bg-[#404249]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <p className="text-center py-10 text-[#b5bac1]">Seu carrinho está vazio.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="rounded-xl bg-[#1e1f22] p-3 border border-[#1e1f22] hover:border-[#404249] transition">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-white line-clamp-2">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)} 
                            className="h-6 w-6 rounded bg-[#2b2d31] font-bold text-sm hover:bg-[#404249] text-white flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold px-1 text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)} 
                            className="h-6 w-6 rounded bg-[#2b2d31] font-bold text-sm hover:bg-[#404249] text-white flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-[#23a559] mt-2 text-sm">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                      <button 
                        onClick={() => setCart(cart.filter((c) => c.id !== item.id))}
                        className="text-red-400 font-bold hover:text-red-500 self-start text-xs p-1"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#1e1f22] pt-4 mt-4 space-y-4">
                {subtotal > 0 && (
                  <div className="rounded-xl bg-[#1e1f22] p-3 border border-[#1e1f22]">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      {499 - subtotal > 0 ? (
                        <span>
                          Faltam <span className="text-[#23a559]">{formatCurrency(499 - subtotal)}</span> para <span className="text-[#5865f2]">Frete Grátis</span>
                        </span>
                      ) : (
                        <span className="text-[#23a559]">🎉 Parabéns! Você ganhou Frete Grátis!</span>
                      )}
                      <span className="text-[#b5bac1]">{Math.round(Math.min((subtotal / 499) * 100, 100))}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#313338] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${499 - subtotal > 0 ? 'bg-[#5865f2]' : 'bg-[#23a559]'}`}
                        style={{ width: `${Math.min((subtotal / 499) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-sm text-white">
                  <div className="flex justify-between">
                    <span className="text-[#b5bac1]">Subtotal</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#23a559]">
                    <span>Frete</span>
                    <span>{subtotal >= 499 ? "Grátis" : "Calculado no checkout"}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-black text-white">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <Link 
                  href="/carrinho" 
                  onClick={() => setIsMiniCartOpen(false)}
                  className="block w-full rounded-lg bg-[#23a559] py-3 text-center font-black text-white hover:bg-[#1f8f4d] transition"
                >
                  Finalizar Compra 🚀
                </Link>
                <button 
                  onClick={() => setCart([])} 
                  className="w-full text-center text-xs text-[#b5bac1] hover:text-red-400 transition"
                >
                  Limpar Carrinho
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
