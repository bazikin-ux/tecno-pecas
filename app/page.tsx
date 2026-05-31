"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  calculateCoupon,
  estimateShipping,
  formatCurrency,
  slugify,
  type ShippingQuote,
} from "@/app/lib/commerce";

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

type CustomerAccount = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

const customerSessionKey = "tecno-pecas-customer-session";
const customerAccountsKey = "tecno-pecas-customer-accounts";
const favoritesKey = "tecno-pecas-favorites";
const whatsappNumber = "5511946365931";
const storeContactEmail = "tecnopecaspc@gmail.com";
const storeInstagramUrl = "https://www.instagram.com/tecnopecas.oficial?igsh=MW5mdnZpeWVkdWIzcw%3D%3D&utm_source=qr";
const storeProfileImage = "/tecno-pecas-profile.png";

const customerReviews = [
  { name: "Marcos A.", rating: 5, text: "Pedido chegou rapido, bem embalado e com nota fiscal." },
  { name: "Julia R.", rating: 5, text: "Comprei placa de video e o suporte ajudou a escolher a fonte certa." },
  { name: "Rafael P.", rating: 4, text: "Precos bons e rastreamento facil depois da compra." },
];

function loadSavedCustomer() {
  if (typeof window === "undefined") return null;

  const savedCustomer = localStorage.getItem(customerSessionKey);

  if (!savedCustomer) return null;

  try {
    const parsedCustomer = JSON.parse(savedCustomer) as CustomerAccount;
    return parsedCustomer.email ? parsedCustomer : null;
  } catch {
    localStorage.removeItem(customerSessionKey);
    return null;
  }
}

const img = {
  cpu: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=80",
  gpu: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80",
  ram: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=80",
  ssd: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80",
  memoryStorage: "https://images.unsplash.com/photo-1600348712270-5af9e3590f66?auto=format&fit=crop&w=900&q=80",
  motherboard: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  psu: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=900&q=80",
  case: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80",
  peripherals: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=900&q=80",
  monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
  pc: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=900&q=80",
};

const categoryHighlights = [
  { label: "PCs Gamer", categories: ["PCs Montados"], image: img.pc },
  { label: "Placas de Video", category: "Placas de VÃ­deo", image: img.gpu },
  { label: "Processadores", categories: ["Processadores"], image: img.cpu },
  { label: "SSD / Memoria", categories: ["Armazenamento", "Memórias RAM", "MemÃ³rias RAM"], image: img.memoryStorage },
  { label: "Monitores", categories: ["Monitores"], image: img.monitor },
  { label: "Perifericos", category: "PerifÃ©ricos", image: img.peripherals },
];

const mobileMenuCategories = [
  { label: "Processadores", categories: ["Processadores"] },
  { label: "Placas de video", categories: ["Placas de Video", "Placas de Vídeo", "Placas de VÃ­deo", "Placas de VÃƒÂ­deo"] },
  { label: "Memoria RAM", categories: ["Memorias RAM", "Memórias RAM", "MemÃ³rias RAM", "MemÃƒÂ³rias RAM"] },
  { label: "SSD / HD", categories: ["Armazenamento"] },
  { label: "Fontes", categories: ["Fontes"] },
  { label: "Gabinetes", categories: ["Gabinetes"] },
  { label: "Monitores", categories: ["Monitores"] },
  { label: "PCs completos", categories: ["PCs Montados"] },
];

const products: Product[] = [
  { id: 1, name: "Ryzen 5 5600", category: "Processadores", price: 699.9, oldPrice: 949.9, stock: 35, specs: "6 núcleos, 12 threads, AM4, até 4.4GHz", tag: "Custo-benefício", rating: 4.8, sold: 821, image: img.cpu },
  { id: 2, name: "Ryzen 7 5700X", category: "Processadores", price: 1099.9, oldPrice: 1399.9, stock: 18, specs: "8 núcleos, 16 threads, AM4, até 4.6GHz", tag: "Promoção", rating: 4.9, sold: 612, image: img.cpu },
  { id: 3, name: "Intel Core i5-12400F", category: "Processadores", price: 799.9, oldPrice: 999.9, stock: 20, specs: "6 núcleos, 12 threads, LGA1700", tag: "Barato e forte", rating: 4.7, sold: 444, image: img.cpu },
  { id: 4, name: "Ryzen 7 5700X3D", category: "Processadores", price: 1499.9, oldPrice: 1799.9, stock: 12, specs: "8 núcleos, 16 threads, 3D V-Cache", tag: "FPS alto", rating: 4.9, sold: 390, image: img.cpu },

  { id: 5, name: "RTX 4060 8GB", category: "Placas de Vídeo", price: 1999.9, oldPrice: 2499.9, stock: 12, specs: "8GB GDDR6, DLSS 3, baixo consumo", tag: "Mais vendida", rating: 4.8, sold: 1012, image: img.gpu },
  { id: 6, name: "RX 6600 8GB", category: "Placas de Vídeo", price: 1199.9, oldPrice: 1499.9, stock: 20, specs: "8GB GDDR6, ideal para Full HD", tag: "Custo-benefício", rating: 4.7, sold: 902, image: img.gpu },
  { id: 7, name: "RTX 4070 12GB", category: "Placas de Vídeo", price: 3999.9, oldPrice: 4599.9, stock: 8, specs: "12GB GDDR6X, 1440p ultra, DLSS 3", tag: "Premium", rating: 4.9, sold: 266, image: img.gpu },
  { id: 8, name: "RX 7800 XT 16GB", category: "Placas de Vídeo", price: 3799.9, oldPrice: 4399.9, stock: 6, specs: "16GB GDDR6, 1440p/4K", tag: "16GB barato", rating: 4.8, sold: 311, image: img.gpu },

  { id: 9, name: "Memória RAM 16GB DDR4", category: "Memórias RAM", price: 199.9, oldPrice: 299.9, stock: 60, specs: "16GB, 3200MHz, CL16", tag: "Oferta", rating: 4.7, sold: 1300, image: img.ram },
  { id: 10, name: "Kit 32GB DDR4 RGB", category: "Memórias RAM", price: 449.9, oldPrice: 599.9, stock: 30, specs: "2x16GB, RGB, 3200MHz", tag: "Gamer", rating: 4.8, sold: 841, image: img.ram },
  { id: 11, name: "Kit 32GB DDR5", category: "Memórias RAM", price: 699.9, oldPrice: 899.9, stock: 22, specs: "2x16GB, DDR5, 5600MHz", tag: "Nova geração", rating: 4.7, sold: 335, image: img.ram },

  { id: 12, name: "SSD NVMe 1TB", category: "Armazenamento", price: 349.9, oldPrice: 499.9, stock: 42, specs: "1TB, M.2 NVMe, até 3500MB/s", tag: "Mais vendido", rating: 4.9, sold: 1504, image: img.ssd },
  { id: 13, name: "SSD SATA 480GB", category: "Armazenamento", price: 169.9, oldPrice: 239.9, stock: 80, specs: "480GB, SATA III, upgrade barato", tag: "Barato", rating: 4.6, sold: 986, image: img.ssd },
  { id: 14, name: "HD 2TB 7200RPM", category: "Armazenamento", price: 399.9, oldPrice: 529.9, stock: 35, specs: "2TB, SATA, 7200RPM", tag: "Backup", rating: 4.5, sold: 388, image: img.ssd },

  { id: 15, name: "Placa-mãe B550M", category: "Placas-mãe", price: 549.9, oldPrice: 749.9, stock: 22, specs: "AM4, DDR4, PCIe 4.0, M.2", tag: "AM4 ideal", rating: 4.7, sold: 611, image: img.motherboard },
  { id: 16, name: "Placa-mãe H610M", category: "Placas-mãe", price: 449.9, oldPrice: 599.9, stock: 20, specs: "LGA1700, DDR4, M.2", tag: "Intel entrada", rating: 4.5, sold: 415, image: img.motherboard },
  { id: 17, name: "Placa-mãe B650M", category: "Placas-mãe", price: 999.9, oldPrice: 1299.9, stock: 15, specs: "AM5, DDR5, PCIe 4.0", tag: "AM5", rating: 4.8, sold: 212, image: img.motherboard },

  { id: 18, name: "Fonte 650W 80 Plus Bronze", category: "Fontes", price: 289.9, oldPrice: 399.9, stock: 45, specs: "650W, PFC ativo, ideal RTX 4060", tag: "Custo-benefício", rating: 4.7, sold: 725, image: img.psu },
  { id: 19, name: "Fonte 750W 80 Plus Gold", category: "Fontes", price: 549.9, oldPrice: 699.9, stock: 20, specs: "750W, modular, alta eficiência", tag: "Gold", rating: 4.8, sold: 344, image: img.psu },
  { id: 20, name: "Fonte 850W ATX 3.0 Gold", category: "Fontes", price: 849.9, oldPrice: 1099.9, stock: 10, specs: "850W, 12VHPWR, placas modernas", tag: "RTX moderna", rating: 4.9, sold: 155, image: img.psu },

  { id: 21, name: "Gabinete Airflow 3 Fans", category: "Gabinetes", price: 249.9, oldPrice: 379.9, stock: 28, specs: "ATX, frente mesh, 3 fans", tag: "Custo-benefício", rating: 4.6, sold: 508, image: img.case },
  { id: 22, name: "Gabinete Aquário RGB", category: "Gabinetes", price: 349.9, oldPrice: 499.9, stock: 20, specs: "ATX, vidro temperado, RGB", tag: "Visual premium", rating: 4.8, sold: 472, image: img.case },
  { id: 23, name: "Gabinete Branco RGB", category: "Gabinetes", price: 399.9, oldPrice: 549.9, stock: 18, specs: "ATX, branco, fans RGB", tag: "Setup branco", rating: 4.7, sold: 270, image: img.case },

  { id: 24, name: "Mouse Gamer 12000 DPI", category: "Periféricos", price: 89.9, oldPrice: 149.9, stock: 70, specs: "RGB, 6 botões, 12000 DPI", tag: "Barato e bom", rating: 4.6, sold: 2100, image: img.peripherals },
  { id: 25, name: "Teclado Mecânico RGB", category: "Periféricos", price: 179.9, oldPrice: 279.9, stock: 50, specs: "Switch Blue, ABNT2, RGB", tag: "Oferta gamer", rating: 4.7, sold: 1222, image: img.peripherals },
  { id: 26, name: "Headset Gamer 7.1 USB", category: "Periféricos", price: 159.9, oldPrice: 249.9, stock: 40, specs: "Som 7.1, microfone, USB", tag: "Promoção", rating: 4.6, sold: 877, image: img.peripherals },

  { id: 27, name: "Monitor Gamer 24 144Hz", category: "Monitores", price: 749.9, oldPrice: 999.9, stock: 22, specs: "Full HD, 144Hz, 1ms", tag: "FPS competitivo", rating: 4.8, sold: 690, image: img.monitor },
  { id: 28, name: "Monitor Gamer 27 165Hz", category: "Monitores", price: 1099.9, oldPrice: 1399.9, stock: 15, specs: "Full HD, 165Hz, 1ms", tag: "Gamer", rating: 4.7, sold: 420, image: img.monitor },
  { id: 29, name: "Monitor 27 QHD 75Hz", category: "Monitores", price: 1199.9, oldPrice: 1499.9, stock: 12, specs: "QHD, IPS, produtividade", tag: "Produtividade", rating: 4.6, sold: 188, image: img.monitor },

  { id: 30, name: "PC Ryzen 5 5600G", category: "PCs Montados", price: 1799.9, oldPrice: 2399.9, stock: 10, specs: "16GB RAM, SSD 500GB, vídeo integrado", tag: "Sem placa de vídeo", rating: 4.7, sold: 320, image: img.pc },
  { id: 31, name: "PC Gamer Ryzen 5 + RX 6600", category: "PCs Montados", price: 2899.9, oldPrice: 3599.9, stock: 8, specs: "RX 6600, 16GB RAM, SSD", tag: "Melhor custo-benefício", rating: 4.8, sold: 410, image: img.pc },
  { id: 32, name: "PC Gamer Ryzen 5 + RTX 4060", category: "PCs Montados", price: 3399.9, oldPrice: 4199.9, stock: 7, specs: "RTX 4060, 16GB RAM, SSD NVMe", tag: "Mais vendido", rating: 4.9, sold: 533, image: img.pc },
];

const defaultShippingQuote = estimateShipping("01001000", 0);

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [category, setCategory] = useState("Todos");
  const [payment, setPayment] = useState("Pix");
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote>(defaultShippingQuote);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [storeProducts, setStoreProducts] = useState<Product[]>(products);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (response.ok && Array.isArray(data) && data.length > 0) {
          setStoreProducts(data);
        }
      } catch {
        setStoreProducts(products);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    const savedCustomer = loadSavedCustomer();

    if (!savedCustomer) return;

    queueMicrotask(() => {
      setCustomer(savedCustomer);
      setEmail(savedCustomer.email);
      setPhone(savedCustomer.phone || "");
    });
  }, []);

  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(favoritesKey) || "[]") as number[];
      queueMicrotask(() => setFavoriteIds(Array.isArray(savedFavorites) ? savedFavorites : []));
    } catch {
      localStorage.removeItem(favoritesKey);
    }
  }, []);

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

  useEffect(() => {
    if (!isCartLoaded) return;
    try {
      localStorage.setItem("tecnopecas_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Erro ao salvar o carrinho:", e);
    }
  }, [cart, isCartLoaded]);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(storeProducts.map((p) => p.category)))], [storeProducts]);
  const brands = useMemo(() => {
    const list = storeProducts.map((p) => p.brand).filter(Boolean) as string[];
    return ["Todas", ...Array.from(new Set(list))];
  }, [storeProducts]);

  function selectHighlightedCategory(item: { label: string; category?: string; categories?: string[] }) {
    const candidates = item.categories || (item.category ? [item.category] : []);
    const productCategory =
      item.label === "Placas de Video"
        ? storeProducts.find((product) => /rtx|rx/i.test(product.name))?.category
        : "";
    const categoryMatch =
      productCategory ||
      categories.find((cat) => candidates.some((candidate) => cat === candidate || slugify(cat) === slugify(candidate)));

    setCategory(categoryMatch || candidates[0] || "Todos");
  }

  function selectMobileCategory(item: { categories: string[] }) {
    const categoryMatch = categories.find((cat) =>
      item.categories.some((candidate) => cat === candidate || slugify(cat) === slugify(candidate))
    );

    setCategory(categoryMatch || item.categories[0]);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCustomerAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);

    setTimeout(() => {
      document.getElementById("conta-cliente")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  const filtered = useMemo(() => {
    return storeProducts.filter((p) => {
      const text = `${p.name} ${p.category} ${p.specs} ${p.tag}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory = category === "Todos" || p.category === category;
      const matchesPrice = p.price <= maxPrice;
      const matchesBrand = selectedBrand === "Todas" || p.brand === selectedBrand;
      return matchesSearch && matchesCategory && matchesPrice && matchesBrand;
    });
  }, [storeProducts, search, category, maxPrice, selectedBrand]);

  const bestSellers = useMemo(() => [...storeProducts].sort((a, b) => b.sold - a.sold).slice(0, 4), [storeProducts]);
  const favoriteProducts = useMemo(
    () => storeProducts.filter((product) => favoriteIds.includes(product.id)),
    [storeProducts, favoriteIds]
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponResult = appliedCoupon ? calculateCoupon(appliedCoupon, subtotal) : null;
  const discount = couponResult?.valid ? couponResult.discount : 0;
  const currentCep = cep.replace(/\D/g, "");
  const currentShippingQuote =
    currentCep.length === 8 && shippingQuote.cep === currentCep
      ? shippingQuote
      : estimateShipping(currentCep, subtotal);
  const shipping = subtotal === 0 ? 0 : currentShippingQuote.price;
  const total = subtotal - discount + shipping;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    const found = cart.find((item) => item.id === product.id);
    if (found) {
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return;
    }
    setCart([...cart, { ...product, quantity: 1 }]);
  }

  function removeFromCart(id: number) {
    setCart(cart.filter((item) => item.id !== id));
  }

  function toggleFavorite(productId: number) {
    const nextFavorites = favoriteIds.includes(productId)
      ? favoriteIds.filter((id) => id !== productId)
      : [...favoriteIds, productId];

    setFavoriteIds(nextFavorites);
    localStorage.setItem(favoritesKey, JSON.stringify(nextFavorites));
  }

  function applyCoupon() {
    const result = calculateCoupon(coupon, subtotal);

    if (result.valid) {
      setAppliedCoupon(result.code);
      alert(result.message);
      return;
    }

    setAppliedCoupon("");
    alert(result.message);
  }

  function getSavedAccounts() {
    try {
      return JSON.parse(localStorage.getItem(customerAccountsKey) || "[]") as CustomerAccount[];
    } catch {
      return [];
    }
  }

  function saveCustomerSession(account: CustomerAccount) {
    setCustomer(account);
    setEmail(account.email);
    setPhone(account.phone || "");
    setAuthOpen(false);
    setAuthPassword("");
    localStorage.setItem(customerSessionKey, JSON.stringify(account));
  }

  function registerCustomer() {
    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPhone = authPhone.replace(/\D/g, "");

    if (!authName.trim()) return alert("Informe seu nome.");
    if (!cleanEmail) return alert("Informe seu email.");
    if (cleanPhone.length < 10) return alert("Informe seu WhatsApp com DDD.");
    if (authPassword.length < 6) return alert("Crie uma senha com pelo menos 6 caracteres.");

    const accounts = getSavedAccounts();

    if (accounts.some((account) => account.email === cleanEmail)) {
      alert("Este email ja tem cadastro. Faca login para continuar.");
      setAuthMode("login");
      return;
    }

    const account = {
      name: authName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: authPassword,
    };

    localStorage.setItem(customerAccountsKey, JSON.stringify([...accounts, account]));
    saveCustomerSession(account);
  }

  function loginCustomer() {
    const cleanEmail = authEmail.trim().toLowerCase();
    const account = getSavedAccounts().find((item) => item.email === cleanEmail && item.password === authPassword);

    if (!account) {
      alert("Email ou senha incorretos. Se ainda nao tiver conta, cadastre-se.");
      return;
    }

    saveCustomerSession(account);
  }

  function logoutCustomer() {
    setCustomer(null);
    setEmail("");
    setPhone("");
    localStorage.removeItem(customerSessionKey);
  }

  async function calculateShipping() {
    if (cart.length === 0) return alert("Adicione um produto ao carrinho.");
    if (cep.replace(/\D/g, "").length !== 8) return alert("Digite um CEP valido com 8 numeros.");

    setCalculatingShipping(true);

    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, subtotal }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao calcular frete.");
        return;
      }

      setShippingQuote(data);
    } catch {
      alert("Erro ao consultar frete.");
    } finally {
      setCalculatingShipping(false);
    }
  }

  async function checkout() {
  if (cart.length === 0) return alert("Adicione um produto ao carrinho.");
  if (!customer) {
    setAuthOpen(true);
    setAuthMode("register");
    setAuthEmail(email);
    setAuthPhone(phone);
    return alert("Cadastre-se ou faca login para finalizar a compra.");
  }
  if (!email.trim()) return alert("Informe seu email.");
  if (cep.replace(/\D/g, "").length !== 8) return alert("Informe seu CEP para calcular o frete.");

  try {
    const response = await fetch("/api/create-preference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cart,
        payment,
        customerEmail: email,
        customerPhone: phone,
        cep,
        shippingQuote: currentShippingQuote,
        coupon: appliedCoupon,
        total,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao criar pagamento.");
      return;
    }

    if (data.init_point) {
      window.location.href = data.init_point;
    } else if (data.sandbox_init_point) {
      window.location.href = data.sandbox_init_point;
    } else {
      alert("Pagamento criado, mas o link do checkout não foi retornado.");
    }
  } catch {
    alert("Erro ao conectar com o Mercado Pago. Verifique a API.");
  }
}

  return (
    <main className="min-h-screen bg-[#313338] text-[#f2f3f5]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Tecno Peças",
            "url": "https://www.tecnopecas.com.br",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://www.tecnopecas.com.br/?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#1e1f22] bg-[#2b2d31] px-4 py-3 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg bg-[#1e1f22] px-4 py-2 font-black hover:bg-[#404249]"
          aria-label="Abrir menu"
        >
          ☰ Menu
        </button>
        <span className="flex items-center gap-2 font-black text-white">
          <Image src={storeProfileImage} alt="Tecno Pecas" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
          Tecno Pecas
        </span>
        <Link href="/carrinho" className="rounded-lg bg-[#1e1f22] px-3 py-2 text-sm font-bold text-white hover:bg-[#404249] transition">
          🛒 {totalItems}
        </Link>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="relative h-full w-80 max-w-[86vw] overflow-y-auto bg-[#2b2d31] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <Image src={storeProfileImage} alt="Tecno Pecas" width={64} height={64} className="mb-3 h-16 w-16 rounded-full object-cover" />
                <p className="text-sm text-[#b5bac1]">Tecno Pecas</p>
                <h2 className="text-2xl font-black">Menu</h2>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#1e1f22] px-3 py-2 font-black">
                X
              </button>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-black text-[#b5bac1]">Categorias</h3>
              <div className="grid gap-2">
                {mobileMenuCategories.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => selectMobileCategory(item)}
                    className="rounded-lg bg-[#1e1f22] px-4 py-3 text-left font-bold hover:bg-[#5865f2]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h3 className="mb-2 text-sm font-black text-[#b5bac1]">Minha conta</h3>
              <div className="grid gap-2">
                {customer ? (
                  <div className="rounded-lg bg-[#1e1f22] px-4 py-3">
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-sm text-[#b5bac1]">{customer.email}</p>
                  </div>
                ) : (
                  <>
                    <button onClick={() => openCustomerAuth("login")} className="rounded-lg bg-[#23a559] px-4 py-3 text-left font-bold hover:bg-[#1f8f4d]">
                      Entrar
                    </button>
                    <button onClick={() => openCustomerAuth("register")} className="rounded-lg bg-[#5865f2] px-4 py-3 text-left font-bold hover:bg-[#4752c4]">
                      Criar cadastro
                    </button>
                  </>
                )}
                <Link onClick={() => setMobileMenuOpen(false)} href="/cliente" className="rounded-lg bg-[#1e1f22] px-4 py-3 font-bold hover:bg-[#404249]">
                  Meus pedidos
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} href="/rastreamento" className="rounded-lg bg-[#1e1f22] px-4 py-3 font-bold hover:bg-[#404249]">
                  Rastreamento
                </Link>
                 <Link onClick={() => setMobileMenuOpen(false)} href="/carrinho" className="rounded-lg bg-[#e18728] px-4 py-3 font-bold hover:bg-[#c7731d] text-white transition">
                  Meu Carrinho 🛒
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} href="/promocoes" className="rounded-lg bg-[#da373c] px-4 py-3 font-bold hover:bg-[#b92d32] text-white transition">
                  🔥 Promoções
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} href="/mais-vendidos" className="rounded-lg bg-[#23a559] px-4 py-3 font-bold hover:bg-[#1f8f4d] text-white transition">
                  ⭐ Mais Vendidos
                </Link>
              </div>
            </section>

            <section className="mt-6 rounded-xl bg-[#1e1f22] p-4">
              <p className="text-sm font-black text-[#b5bac1]">Contato</p>
              <a href={`mailto:${storeContactEmail}`} className="mt-2 block font-bold text-[#23a559]">
                {storeContactEmail}
              </a>
              <a href={storeInstagramUrl} target="_blank" rel="noreferrer" className="mt-3 block font-bold text-[#5865f2]">
                Instagram @tecnopecas.oficial
              </a>
            </section>
          </aside>
        </div>
      )}

      <div className="grid min-h-screen md:grid-cols-[78px_250px_1fr_370px]">
        <aside className="hidden bg-[#1e1f22] p-3 md:block">
          <Image src={storeProfileImage} alt="Tecno Pecas" width={48} height={48} className="mb-4 h-12 w-12 rounded-2xl object-cover" />
          {categories.filter((c) => c !== "Todos").map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2b2d31] text-xs font-bold hover:bg-[#5865f2]">
              {cat.slice(0, 2)}
            </button>
          ))}
        </aside>

        <aside className="hidden bg-[#2b2d31] p-4 md:block">
          <h1 className="text-2xl font-black text-white">Tecno Peças</h1>
          <p className="mb-5 text-sm text-[#b5bac1]">Loja de hardware</p>
          <a href={`mailto:${storeContactEmail}`} className="mb-3 block rounded-lg bg-[#1e1f22] px-3 py-2 text-center text-sm font-bold text-[#23a559]">
            {storeContactEmail}
          </a>
          <a href={storeInstagramUrl} target="_blank" rel="noreferrer" className="mb-3 block rounded-lg bg-[#1e1f22] px-3 py-2 text-center text-sm font-bold text-[#e879f9]">
            Instagram
          </a>
          <Link href="/cliente" className="mb-3 block rounded-lg bg-[#23a559] px-3 py-2 text-center font-bold">
            Minha conta
          </Link>
          <Link href="/monte-seu-pc" className="mb-3 block rounded-lg bg-[#5865f2] px-3 py-2 text-center font-bold">
            Monte seu PC
          </Link>
          <Link href="/carrinho" className="mb-3 block rounded-lg bg-[#e18728] px-3 py-2 text-center font-bold hover:bg-[#c7731d] text-white transition">
            Meu Carrinho
          </Link>
          <Link href="/promocoes" className="mb-3 block rounded-lg bg-[#da373c] px-3 py-2 text-center font-bold text-white hover:bg-[#b92d32] transition">
            🔥 Promoções
          </Link>
          <Link href="/mais-vendidos" className="mb-3 block rounded-lg bg-[#23a559] px-3 py-2 text-center font-bold text-white hover:bg-[#1f8f4d] transition">
            ⭐ Mais Vendidos
          </Link>

          <button onClick={() => setCategory("Todos")} className="mb-2 w-full rounded-lg bg-[#404249] px-3 py-2 text-left font-bold hover:bg-[#5865f2]"># todos-produtos</button>
          {categories.filter((c) => c !== "Todos").map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className="mb-2 w-full rounded-lg px-3 py-2 text-left text-[#dbdee1] hover:bg-[#404249]">
              # {cat.toLowerCase()}
            </button>
          ))}

          <div className="mt-6 rounded-xl bg-[#232428] p-3">
            <p className="text-sm font-bold">Cliente</p>
            {customer ? (
              <>
                <p className="mt-2 text-sm text-white">{customer.name}</p>
                <p className="text-xs text-[#b5bac1]">{customer.email}</p>
                <button onClick={logoutCustomer} className="mt-3 w-full rounded-md bg-[#404249] px-3 py-2 text-sm font-bold hover:bg-[#5865f2]">
                  Sair
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-xs text-[#b5bac1]">Entre ou cadastre-se para finalizar compras.</p>
                <button onClick={() => setAuthOpen(true)} className="mt-3 w-full rounded-md bg-[#23a559] px-3 py-2 text-sm font-bold hover:bg-[#1f8f4d]">
                  Entrar ou cadastrar
                </button>
              </>
            )}
          </div>

        </aside>

        <section className="bg-[#313338]">
          <header className="sticky top-0 z-20 border-b border-[#1e1f22] bg-[#313338] px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-black"># {category === "Todos" ? "promoções" : category.toLowerCase()}</h2>
                <p className="text-sm text-[#b5bac1]">Peças, categorias, promoções, pagamento e carrinho estilo Discord.</p>
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
                  placeholder="Buscar produto..."
                  className="rounded-lg bg-[#1e1f22] px-4 py-3 outline-none lg:w-80 text-sm"
                />
              </div>
            </div>
          </header>

          <section className="p-5">
            <div className="relative mb-6 min-h-64 overflow-hidden rounded-2xl bg-[#1e1f22] p-6">
              <Image
                src={img.pc}
                alt="Setup gamer com hardware em destaque"
                fill
                priority
                className="object-cover opacity-35"
              />
              <div className="relative max-w-2xl">
                <h3 className="text-4xl font-black">Ofertas gamer da Tecno Pecas</h3>
                <p className="mt-3 text-[#eef0ff]">Hardware para montar, atualizar e turbinar seu setup com Pix, cartao, boleto e Mercado Pago.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => setCategory("PCs Montados")} className="rounded-lg bg-[#23a559] px-4 py-3 font-black hover:bg-[#1f8f4d]">
                    Ver PCs Gamer
                  </button>
                  <Link href="/monte-seu-pc" className="rounded-lg bg-[#5865f2] px-4 py-3 font-black hover:bg-[#4752c4]">
                    Montar meu PC
                  </Link>
                </div>
              </div>
            </div>

            {/* Selos de Confiança */}
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

            <div className="mb-6">
              <h3 className="mb-3 text-xl font-black">Categorias em destaque</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categoryHighlights.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => selectHighlightedCategory(item)}
                    className="group relative min-h-28 overflow-hidden rounded-xl bg-[#1e1f22] p-4 text-left"
                  >
                    <Image src={item.image} alt={item.label} fill className="object-cover opacity-30 transition group-hover:scale-105" />
                    <span className="relative text-lg font-black">{item.label}</span>
                    <span className="relative mt-2 block text-sm text-[#b5bac1]">Ver produtos</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 rounded-2xl bg-[#2b2d31] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-xl font-black">Mais vendidos</h3>
                  <p className="text-sm text-[#b5bac1]">Produtos com maior saída na loja.</p>
                </div>
                <div>
                  <label className="text-sm text-[#b5bac1]">Preço máximo: {formatCurrency(maxPrice)}</label>
                  <input type="range" min="100" max="10000" step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="block w-72" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {bestSellers.map((product) => (
                  <button key={product.id} onClick={() => addToCart(product)} className="rounded-xl bg-[#1e1f22] p-3 text-left hover:bg-[#404249]">
                    <p className="font-bold">{product.name}</p>
                    <p className="text-sm text-[#23a559]">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-[#b5bac1]">{product.sold} vendidos</p>
                  </button>
                ))}
              </div>
            </div>

            {favoriteProducts.length > 0 && (
              <div className="mb-6 rounded-2xl bg-[#2b2d31] p-4">
                <h3 className="text-xl font-black">Favoritos</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {favoriteProducts.map((product) => (
                    <div key={product.id} className="rounded-xl bg-[#1e1f22] p-3">
                      <p className="font-bold">{product.name}</p>
                      <p className="text-sm text-[#23a559]">{formatCurrency(product.price)}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link href={`/produto/${product.slug || slugify(product.name)}`} className="rounded-lg bg-[#404249] py-2 text-center text-sm font-bold hover:bg-[#5865f2]">
                          Ver
                        </Link>
                        <button onClick={() => addToCart(product)} className="rounded-lg bg-[#23a559] py-2 text-sm font-bold hover:bg-[#1f8f4d]">
                          Comprar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categories.filter((cat) => cat !== "Todos").map((cat) => {
              const items = filtered.filter((p) => p.category === cat);
              if (!items.length) return null;

              return (
                <div key={cat} className="mb-9">
                  <h3 className="mb-4 text-xl font-black text-white"># {cat}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((product) => (
                      <div key={product.id} className="relative overflow-hidden rounded-2xl bg-[#2b2d31] shadow-lg">
                        <button
                          onClick={() => toggleFavorite(product.id)}
                          className="absolute right-3 top-3 z-10 rounded-full bg-[#1e1f22]/90 px-3 py-2 text-sm font-black hover:bg-[#5865f2]"
                          aria-label={favoriteIds.includes(product.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          {favoriteIds.includes(product.id) ? "Favorito" : "Salvar"}
                        </button>
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={480}
                          height={240}
                          className="h-40 w-full bg-white object-contain p-3"
                        />
                        <div className="p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="rounded-full bg-[#5865f2] px-2 py-1 text-xs font-bold">{product.tag}</span>
                            <span className="text-xs text-[#b5bac1]">⭐ {product.rating}</span>
                          </div>

                          <h4 className="min-h-14 text-lg font-black text-white">{product.name}</h4>
                          <p className="min-h-10 text-sm text-[#b5bac1]">{product.specs}</p>

                          <p className="mt-3 text-sm text-[#8e9297] line-through">{formatCurrency(product.oldPrice)}</p>
                          <p className="text-2xl font-black text-[#23a559]">{formatCurrency(product.price)}</p>
                          <p className="text-xs text-[#b5bac1]">Estoque: {product.stock} • {product.sold} vendidos</p>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <Link
                              href={`/produto/${product.slug || slugify(product.name)}`}
                              className="rounded-lg bg-[#404249] py-3 text-center font-black hover:bg-[#5865f2]"
                            >
                              Ver produto
                            </Link>
                            <button onClick={() => addToCart(product)} className="rounded-lg bg-[#5865f2] py-3 font-black hover:bg-[#4752c4]">
                              Comprar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="mb-6">
              <h3 className="mb-3 text-xl font-black">Avaliacoes de clientes</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {customerReviews.map((review) => (
                  <div key={review.name} className="rounded-xl bg-[#2b2d31] p-4">
                    <p className="font-black text-[#23a559]">{"★".repeat(review.rating)}</p>
                    <p className="mt-2 font-bold">{review.name}</p>
                    <p className="mt-1 text-sm text-[#b5bac1]">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-2xl bg-[#2b2d31] p-5">
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase text-[#23a559]">Sobre nos</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Hardware escolhido com cuidado para o seu setup</h3>
                  <p className="mt-3 text-sm leading-6 text-[#dbdee1]">
                    A Tecno Pecas nasceu para facilitar a compra de componentes, PCs gamer e perifericos com atendimento
                    direto, produtos bem selecionados e suporte antes e depois da venda.
                  </p>
                  <a href={storeInstagramUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-lg bg-[#5865f2] px-4 py-3 font-black text-white hover:bg-[#4752c4]">
                    Ver novidades no Instagram
                  </a>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-xl bg-[#1e1f22] p-4">
                    <p className="font-black text-white">Atendimento rapido</p>
                    <p className="mt-1 text-sm text-[#b5bac1]">Ajuda pelo WhatsApp para escolher pecas compativeis.</p>
                  </div>
                  <div className="rounded-xl bg-[#1e1f22] p-4">
                    <p className="font-black text-white">Compra segura</p>
                    <p className="mt-1 text-sm text-[#b5bac1]">Pagamento por Pix, cartao, boleto e Mercado Pago.</p>
                  </div>
                  <div className="rounded-xl bg-[#1e1f22] p-4">
                    <p className="font-black text-white">Envio com rastreio</p>
                    <p className="mt-1 text-sm text-[#b5bac1]">Acompanhe seu pedido depois da confirmacao.</p>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </section>

        <aside className="bg-[#2b2d31] p-4">
          <h2 className="text-2xl font-black">Carrinho</h2>
          <p className="text-sm text-[#b5bac1]">{totalItems} item(ns)</p>

          <div className="mt-4 space-y-3">
            {cart.length === 0 && <p className="rounded-xl bg-[#1e1f22] p-4 text-[#b5bac1]">Seu carrinho está vazio.</p>}

            {cart.map((item) => (
              <div key={item.id} className="rounded-xl bg-[#1e1f22] p-3">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-[#b5bac1]">Qtd: {item.quantity}</p>
                    <p className="font-bold text-[#23a559]">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="font-black text-red-400">X</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-[#1e1f22] p-4">
            <div id="conta-cliente" className="mb-5 scroll-mt-20 rounded-xl bg-[#232428] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">Conta do cliente</p>
                  <p className="text-xs text-[#b5bac1]">
                    {customer ? `${customer.name} - ${customer.email}` : "Necessaria para finalizar a compra."}
                  </p>
                </div>
                {customer ? (
                  <button onClick={logoutCustomer} className="rounded-lg bg-[#404249] px-3 py-2 text-sm font-bold hover:bg-[#5865f2]">
                    Sair
                  </button>
                ) : (
                  <button onClick={() => setAuthOpen(!authOpen)} className="rounded-lg bg-[#23a559] px-3 py-2 text-sm font-bold hover:bg-[#1f8f4d]">
                    Entrar
                  </button>
                )}
              </div>

              {!customer && authOpen && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAuthMode("login")}
                      className={`rounded-lg py-2 text-sm font-bold ${authMode === "login" ? "bg-[#5865f2]" : "bg-[#313338]"}`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setAuthMode("register")}
                      className={`rounded-lg py-2 text-sm font-bold ${authMode === "register" ? "bg-[#5865f2]" : "bg-[#313338]"}`}
                    >
                      Cadastro
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {authMode === "register" && (
                      <>
                        <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Nome completo" className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none" />
                        <input value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="WhatsApp com DDD" className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none" />
                      </>
                    )}
                    <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="email@email.com" className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none" />
                    <input value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} type="password" placeholder="Senha" className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none" />
                    <button onClick={authMode === "login" ? loginCustomer : registerCustomer} className="rounded-lg bg-[#23a559] py-3 font-black hover:bg-[#1f8f4d]">
                      {authMode === "login" ? "Entrar" : "Cadastrar e entrar"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="mb-2 font-bold">Cupom de desconto</p>
            <div className="flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Cupom" className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none" />
              <button onClick={applyCoupon} className="rounded-lg bg-[#5865f2] px-3 font-bold">OK</button>
            </div>

            <p className="mb-2 mt-4 font-bold">Frete automatico</p>
            <div className="flex gap-2">
              <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none" />
              <button onClick={calculateShipping} className="rounded-lg bg-[#5865f2] px-3 font-bold">
                {calculatingShipping ? "..." : "Calcular"}
              </button>
            </div>
            {currentCep.length === 8 && (
              <p className="mt-2 text-xs text-[#b5bac1]">
                {currentShippingQuote.carrier} - {currentShippingQuote.service} • {currentShippingQuote.deliveryDays}
              </p>
            )}

            <p className="mb-2 mt-4 font-bold">Forma de pagamento</p>
            <select value={payment} onChange={(e) => setPayment(e.target.value)} className="w-full rounded-lg bg-[#313338] px-3 py-3 outline-none">
              <option>Pix</option>
              <option>Cartão de Crédito</option>
              <option>Boleto</option>
              <option>Mercado Pago</option>
            </select>

            <div className="mt-5 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Desconto</span><span>- {formatCurrency(discount)}</span></div>
              <div className="flex justify-between"><span>Frete</span><span>{shipping === 0 ? "Grátis" : formatCurrency(shipping)}</span></div>
            </div>

            <div className="mt-4 flex justify-between text-xl font-black">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <button onClick={checkout} className="mt-4 w-full rounded-lg bg-[#23a559] py-3 font-black hover:bg-[#1f8f4d]">
              Finalizar compra
            </button>

            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="mt-3 w-full rounded-lg bg-[#da373c] py-2 font-bold hover:bg-[#b92d32]">
                Limpar carrinho
              </button>
            )}
          </div>
        </aside>
      </div>
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Ola, preciso de ajuda na Tecno Pecas.")}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 rounded-full bg-[#23a559] px-5 py-4 font-black text-white shadow-xl hover:bg-[#1f8f4d]"
      >
        WhatsApp 11 94636-5931
      </a>
    </main>
  );
}
