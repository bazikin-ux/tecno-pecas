"use client";

import { useEffect, useState } from "react";

type Product = {
  id?: number;
  name: string;
  category: string;
  price: number | string;
  old_price: number | string;
  stock: number | string;
  specs: string;
  tag: string;
  image: string;
  active?: boolean;
};

const emptyProduct: Product = {
  name: "",
  category: "Processadores",
  price: "",
  old_price: "",
  stock: "",
  specs: "",
  tag: "Produto",
  image: "",
  active: true,
};

function formatPrice(value: number | string) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(emptyProduct);
  const [password, setPassword] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tecno_admin_password");
    if (saved) {
      setPassword(saved);
      setIsLogged(true);
    }
  }, []);

  useEffect(() => {
    if (isLogged && password) loadProducts();
  }, [isLogged, password]);

  async function loadProducts() {
    const response = await fetch("/api/admin/products", {
      headers: { "x-admin-password": password },
    });

    if (!response.ok) {
      alert("Senha inválida ou acesso negado.");
      localStorage.removeItem("tecno_admin_password");
      setIsLogged(false);
      return;
    }

    const data = await response.json();
    setProducts(Array.isArray(data) ? data : []);
  }

  function login() {
    if (!password.trim()) return alert("Digite a senha.");
    localStorage.setItem("tecno_admin_password", password);
    setIsLogged(true);
  }

  function logout() {
    localStorage.removeItem("tecno_admin_password");
    setPassword("");
    setIsLogged(false);
    setProducts([]);
  }

  function updateField(field: keyof Product, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function saveProduct() {
    if (!form.name || !form.category || !form.price) {
      alert("Preencha nome, categoria e preço.");
      return;
    }

    setLoading(true);

    const response = await fetch(
      form.id ? `/api/admin/products/${form.id}` : "/api/admin/products",
      {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(form),
      }
    );

    setLoading(false);

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || "Erro ao salvar.");
      return;
    }

    setForm(emptyProduct);
    await loadProducts();
    alert("Produto salvo!");
  }

  async function deleteProduct(id?: number) {
    if (!id || !confirm("Excluir este produto?")) return;

    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });

    if (!response.ok) return alert("Erro ao excluir produto.");

    await loadProducts();
  }

  if (!isLogged) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#313338] p-6 text-white">
        <div className="w-full max-w-md rounded-2xl bg-[#2b2d31] p-8">
          <h1 className="text-4xl font-black text-[#5865f2]">Tecno Peças</h1>
          <p className="mt-2 text-[#b5bac1]">Painel Admin protegido</p>

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

          <a href="/" className="mt-4 block text-center text-sm text-[#b5bac1]">
            Voltar para loja
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#313338] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl bg-[#2b2d31] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black text-[#5865f2]">Painel Admin — Tecno Peças</h1>
              <p className="mt-2 text-[#b5bac1]">Cadastre produtos, edite preços, estoque e imagens.</p>
            </div>

            <div className="flex gap-2">
              <a href="/" className="rounded-lg bg-[#5865f2] px-4 py-2 font-bold">Loja</a>
              <button onClick={logout} className="rounded-lg bg-[#da373c] px-4 py-2 font-bold">Sair</button>
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-2xl bg-[#2b2d31] p-6">
          <h2 className="mb-4 text-2xl font-black">{form.id ? "Editar produto" : "Novo produto"}</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-lg bg-[#1e1f22] p-3 outline-none" placeholder="Nome do produto" value={form.name} onChange={(e) => updateField("name", e.target.value)} />

            <select className="rounded-lg bg-[#1e1f22] p-3 outline-none" value={form.category} onChange={(e) => updateField("category", e.target.value)}>
              <option>Processadores</option>
              <option>Placas de Vídeo</option>
              <option>Memórias RAM</option>
              <option>Armazenamento</option>
              <option>Placas-mãe</option>
              <option>Fontes</option>
              <option>Gabinetes</option>
              <option>Periféricos</option>
              <option>Monitores</option>
              <option>PCs Montados</option>
            </select>

            <input className="rounded-lg bg-[#1e1f22] p-3 outline-none" placeholder="Preço atual" type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
            <input className="rounded-lg bg-[#1e1f22] p-3 outline-none" placeholder="Preço antigo" type="number" value={form.old_price} onChange={(e) => updateField("old_price", e.target.value)} />
            <input className="rounded-lg bg-[#1e1f22] p-3 outline-none" placeholder="Estoque" type="number" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} />
            <input className="rounded-lg bg-[#1e1f22] p-3 outline-none" placeholder="Etiqueta" value={form.tag} onChange={(e) => updateField("tag", e.target.value)} />
            <input className="rounded-lg bg-[#1e1f22] p-3 outline-none md:col-span-2" placeholder="URL da imagem" value={form.image} onChange={(e) => updateField("image", e.target.value)} />
            <textarea className="rounded-lg bg-[#1e1f22] p-3 outline-none md:col-span-2" placeholder="Especificações" value={form.specs} onChange={(e) => updateField("specs", e.target.value)} />
          </div>

          <div className="mt-5 flex gap-3">
            <button disabled={loading} onClick={saveProduct} className="rounded-lg bg-[#23a559] px-5 py-3 font-black">
              {loading ? "Salvando..." : "Salvar produto"}
            </button>

            {form.id && (
              <button onClick={() => setForm(emptyProduct)} className="rounded-lg bg-[#5865f2] px-5 py-3 font-bold">
                Cancelar edição
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-[#2b2d31] p-6">
          <h2 className="mb-4 text-2xl font-black">Produtos cadastrados</h2>

          <div className="grid gap-4">
            {products.map((product) => (
              <div key={product.id} className="grid gap-4 rounded-xl bg-[#1e1f22] p-4 md:grid-cols-[80px_1fr_auto] md:items-center">
                <img src={product.image || "https://via.placeholder.com/200"} alt={product.name} className="h-20 w-20 rounded-lg object-cover" />

                <div>
                  <h3 className="text-xl font-black">{product.name}</h3>
                  <p className="text-sm text-[#b5bac1]">{product.category} • {product.specs}</p>
                  <p className="text-[#23a559]">{formatPrice(product.price)} <span className="text-sm text-[#8e9297] line-through">{formatPrice(product.old_price)}</span></p>
                  <p className="text-sm text-[#b5bac1]">Estoque: {product.stock} • {product.tag}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setForm(product)} className="rounded-lg bg-[#5865f2] px-4 py-2 font-bold">Editar</button>
                  <button onClick={() => deleteProduct(product.id)} className="rounded-lg bg-[#da373c] px-4 py-2 font-bold">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
