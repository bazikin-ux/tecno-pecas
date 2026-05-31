"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  calculateCoupon,
  formatCurrency,
  onlyNumbers,
  estimateShipping,
  type ShippingQuote
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
const whatsappNumber = "5511946365931";
const storeContactEmail = "tecnopecaspc@gmail.com";
const storeProfileImage = "/tecno-pecas-profile.png";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [payment, setPayment] = useState("Pix");

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCart = localStorage.getItem("tecnopecas_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Erro ao carregar o carrinho do localStorage:", e);
    }

    try {
      const savedCustomer = localStorage.getItem(customerSessionKey);
      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer) as CustomerAccount;
        if (parsed.email) {
          setCustomer(parsed);
          setEmail(parsed.email);
          setPhone(parsed.phone || "");
        }
      }
    } catch (e) {
      console.error("Erro ao carregar a sessão do cliente:", e);
    }
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("tecnopecas_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Erro ao salvar o carrinho no localStorage:", e);
    }
  }, [cart, isMounted]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const couponResult = useMemo(() => appliedCoupon ? calculateCoupon(appliedCoupon, subtotal) : null, [appliedCoupon, subtotal]);
  const discount = couponResult?.valid ? couponResult.discount : 0;

  const currentCep = cep.replace(/\D/g, "");
  
  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    if (shippingQuote && shippingQuote.cep === currentCep) return shippingQuote.price;
    return estimateShipping(currentCep, subtotal).price;
  }, [shippingQuote, currentCep, subtotal]);

  const total = useMemo(() => subtotal - discount + shipping, [subtotal, discount, shipping]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

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

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function applyCoupon() {
    const result = calculateCoupon(coupon, subtotal);
    if (result.valid) {
      setAppliedCoupon(result.code);
      alert(result.message);
    } else {
      setAppliedCoupon("");
      alert(result.message);
    }
  }

  async function calculateShipping() {
    const cleanCep = cep.replace(/\D/g, "");
    if (!cleanCep) {
      setShippingError("Por favor, digite um CEP.");
      setShippingQuote(null);
      return;
    }
    if (cleanCep.length !== 8) {
      setShippingError("CEP inválido. Digite um CEP com 8 números.");
      setShippingQuote(null);
      return;
    }
    setShippingError(null);
    setCalculatingShipping(true);

    try {
      const response = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cleanCep, subtotal }),
      });

      const data = await response.json();

      if (!response.ok) {
        setShippingError(data.error || "Erro ao calcular frete.");
        setShippingQuote(null);
        return;
      }

      setShippingQuote(data);
    } catch {
      setShippingError("Erro ao consultar frete.");
      setShippingQuote(null);
    } finally {
      setCalculatingShipping(false);
    }
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
      alert("Este email já tem cadastro. Faça login para continuar.");
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
      alert("Email ou senha incorretos. Se ainda não tiver conta, cadastre-se.");
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

  async function checkout() {
    if (cart.length === 0) return alert("Adicione um produto ao carrinho.");
    if (!customer) {
      setAuthOpen(true);
      setAuthMode("register");
      setAuthEmail(email);
      setAuthPhone(phone);
      return alert("Cadastre-se ou faça login para finalizar a compra.");
    }
    if (!email.trim()) return alert("Informe seu email.");
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return alert("Informe seu CEP com 8 números para calcular o frete.");

    try {
      const activeShippingQuote = shippingQuote && shippingQuote.cep === cleanCep
        ? shippingQuote
        : estimateShipping(cleanCep, subtotal);

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
          cep: cleanCep,
          shippingQuote: activeShippingQuote,
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

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#313338] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold">Carregando carrinho...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#313338] text-[#f2f3f5] p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header and Breadcrumbs */}
        <header className="mb-6 flex items-center justify-between border-b border-[#1e1f22] pb-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image
                src={storeProfileImage}
                alt="Tecno Pecas"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">Seu Carrinho</h1>
              <p className="text-sm text-[#b5bac1]">Você tem {totalItems} item(ns)</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-bold text-[#5865f2] hover:underline"
          >
            Continuar comprando
          </Link>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#2b2d31] p-12 text-center">
            <p className="text-xl font-bold text-[#b5bac1] mb-6">Seu carrinho está vazio.</p>
            <Link
              href="/"
              className="rounded-lg bg-[#23a559] px-6 py-3 font-black text-white hover:bg-[#1f8f4d] transition"
            >
              Voltar para a Loja
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
            {/* Left side: Items & Account */}
            <div className="space-y-6">
              {/* Cart Items List */}
              <div className="rounded-2xl bg-[#2b2d31] p-5 space-y-4">
                <h2 className="text-lg font-black text-white border-b border-[#1e1f22] pb-3">
                  Produtos no Carrinho
                </h2>
                <div className="divide-y divide-[#1e1f22] space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 first:pt-0 gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-white p-1 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-white leading-tight">{item.name}</h3>
                          <p className="text-xs text-[#b5bac1] mt-1">{item.category}</p>
                          <p className="text-sm text-[#23a559] font-black mt-1">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 bg-[#1e1f22] rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="px-2 py-1 font-black text-[#b5bac1] hover:text-white"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="px-2 py-1 font-black text-[#b5bac1] hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        {/* Price summary and remove */}
                        <div className="flex items-center gap-4">
                          <p className="font-black text-[#23a559] text-right min-w-[90px]">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="rounded-lg bg-[#da373c] p-2 hover:bg-[#b92d32] text-white text-xs font-black transition"
                            title="Remover"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Block */}
              <div id="conta-cliente" className="rounded-2xl bg-[#2b2d31] p-5 scroll-mt-6">
                <h2 className="text-lg font-black text-white border-b border-[#1e1f22] pb-3 mb-4">
                  Conta do Cliente
                </h2>
                <div className="flex items-center justify-between gap-3 bg-[#1e1f22] p-4 rounded-xl">
                  <div>
                    <p className="font-bold text-white">Sua Identificação</p>
                    <p className="text-xs text-[#b5bac1] mt-1">
                      {customer ? `${customer.name} (${customer.email})` : "Identifique-se para finalizar a compra."}
                    </p>
                  </div>
                  {customer ? (
                    <button
                      onClick={logoutCustomer}
                      className="rounded-lg bg-[#404249] px-4 py-2 text-sm font-bold hover:bg-[#5865f2] transition"
                    >
                      Sair
                    </button>
                  ) : (
                    <button
                      onClick={() => setAuthOpen(!authOpen)}
                      className="rounded-lg bg-[#23a559] px-4 py-2 text-sm font-bold hover:bg-[#1f8f4d] transition"
                    >
                      {authOpen ? "Fechar" : "Entrar / Cadastrar"}
                    </button>
                  )}
                </div>

                {!customer && authOpen && (
                  <div className="mt-4 bg-[#1e1f22] p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAuthMode("login")}
                        className={`rounded-lg py-2 text-sm font-bold transition ${
                          authMode === "login" ? "bg-[#5865f2] text-white" : "bg-[#313338] text-[#b5bac1] hover:bg-[#404249]"
                        }`}
                      >
                        Fazer Login
                      </button>
                      <button
                        onClick={() => setAuthMode("register")}
                        className={`rounded-lg py-2 text-sm font-bold transition ${
                          authMode === "register" ? "bg-[#5865f2] text-white" : "bg-[#313338] text-[#b5bac1] hover:bg-[#404249]"
                        }`}
                      >
                        Nova Conta
                      </button>
                    </div>

                    <div className="grid gap-3">
                      {authMode === "register" && (
                        <>
                          <input
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Nome completo"
                            className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none text-white text-sm"
                          />
                          <input
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="WhatsApp com DDD"
                            className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none text-white text-sm"
                          />
                        </>
                      )}
                      <input
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="Seu email"
                        type="email"
                        className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none text-white text-sm"
                      />
                      <input
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        type="password"
                        placeholder="Senha"
                        className="w-full rounded-lg bg-[#313338] px-3 py-2 outline-none text-white text-sm"
                      />
                      <button
                        onClick={authMode === "login" ? loginCustomer : registerCustomer}
                        className="rounded-lg bg-[#23a559] py-3 font-black text-white hover:bg-[#1f8f4d] transition"
                      >
                        {authMode === "login" ? "Entrar" : "Cadastrar e Entrar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Summary & Totals */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-[#2b2d31] p-5 space-y-6">
                <h2 className="text-lg font-black text-white border-b border-[#1e1f22] pb-3">
                  Resumo do Pedido
                </h2>

                {/* Cupom */}
                <div>
                  <label className="block text-sm font-bold text-[#b5bac1] mb-2">
                    Cupom de Desconto
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Ex: TECNO10"
                      className="w-full rounded-lg bg-[#1e1f22] px-3 py-2 outline-none text-white text-sm"
                    />
                    <button
                      onClick={applyCoupon}
                      className="rounded-lg bg-[#5865f2] px-4 font-bold text-white hover:bg-[#4752c4] text-sm transition"
                    >
                      Aplicar
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="mt-1 text-xs text-[#23a559] font-bold">
                      Cupom {appliedCoupon} ativo!
                    </p>
                  )}
                </div>

                {/* Shipping */}
                <div>
                  <label className="block text-sm font-bold text-[#b5bac1] mb-2">
                    Cálculo de Frete
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="Digite o CEP (Ex: 01001-000)"
                      maxLength={9}
                      className="w-full rounded-lg bg-[#1e1f22] px-3 py-2 outline-none text-white text-sm"
                    />
                    <button
                      onClick={calculateShipping}
                      className="rounded-lg bg-[#5865f2] px-4 font-bold text-white hover:bg-[#4752c4] text-sm transition"
                      disabled={calculatingShipping}
                    >
                      {calculatingShipping ? "..." : "Calcular"}
                    </button>
                  </div>
                  {shippingError && (
                    <p className="mt-2 text-xs text-red-400 font-bold">
                      {shippingError}
                    </p>
                  )}
                  {currentCep.length === 8 && shippingQuote && shippingQuote.cep === currentCep && (
                    <div className="mt-2 p-3 bg-[#1e1f22] rounded-lg">
                      <p className="text-sm font-bold text-white">
                        {shippingQuote.carrier} - {shippingQuote.service}
                      </p>
                      <p className="text-xs text-[#b5bac1] mt-1">
                        Prazo: {shippingQuote.deliveryDays} • Valor: {shippingQuote.price === 0 ? "Grátis" : formatCurrency(shippingQuote.price)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment option */}
                <div>
                  <label className="block text-sm font-bold text-[#b5bac1] mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    className="w-full rounded-lg bg-[#1e1f22] px-3 py-3 outline-none text-white text-sm"
                  >
                    <option>Pix</option>
                    <option>Cartão de Crédito</option>
                    <option>Boleto</option>
                    <option>Mercado Pago</option>
                  </select>
                </div>

                {/* Values Breakdown */}
                {subtotal > 0 && (
                  <div className="rounded-xl bg-[#1e1f22] p-3 border border-[#1e1f22] mb-2">
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

                <div className="space-y-2 border-t border-[#1e1f22] pt-4 text-sm">
                  <div className="flex justify-between text-[#b5bac1]">
                    <span>Subtotal</span>
                    <span className="text-white font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#b5bac1]">
                    <span>Desconto</span>
                    <span className="text-red-400 font-bold">- {formatCurrency(discount)}</span>
                  </div>
                  <div className="flex justify-between text-[#b5bac1]">
                    <span>Frete</span>
                    <span className="text-white font-bold">
                      {shipping === 0 ? "Grátis" : formatCurrency(shipping)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-white text-xl font-black border-t border-[#1e1f22] pt-4">
                    <span>Total</span>
                    <span className="text-[#23a559]">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={checkout}
                    className="w-full rounded-lg bg-[#23a559] py-4 text-center text-lg font-black text-white hover:bg-[#1f8f4d] transition shadow-lg"
                  >
                    Finalizar Compra
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Tem certeza que deseja limpar o seu carrinho?")) {
                        setCart([]);
                      }
                    }}
                    className="w-full rounded-lg bg-[#da373c] py-2 text-center text-sm font-bold text-white hover:bg-[#b92d32] transition"
                  >
                    Limpar Carrinho
                  </button>
                </div>

                {/* Selos de Confiança */}
                <div className="mt-4 border-t border-[#1e1f22] pt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#b5bac1]">
                    <span>🚚</span>
                    <span><strong>Frete grátis</strong> em compras acima de R$ 499</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#b5bac1]">
                    <span>💳</span>
                    <span><strong>Até 12x sem juros</strong> no cartão</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#b5bac1]">
                    <span>🔒</span>
                    <span>Sua compra é <strong>100% segura</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Whatsapp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá, preciso de ajuda com meu carrinho na Tecno Peças.")}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 rounded-full bg-[#23a559] px-5 py-4 font-black text-white shadow-xl hover:bg-[#1f8f4d] transition"
      >
        WhatsApp 11 94636-5931
      </a>
    </main>
  );
}
