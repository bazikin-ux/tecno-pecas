"use client";

import { useRouter } from "next/navigation";

export default function BuyButton({ product }: { product: any }) {
  const router = useRouter();

  function handleBuy() {
    try {
      const savedCart = localStorage.getItem("tecnopecas_cart");
      let cart = savedCart ? JSON.parse(savedCart) : [];
      const found = cart.find((item: any) => item.id === product.id);
      if (found) {
        cart = cart.map((item: any) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("tecnopecas_cart", JSON.stringify(cart));
      router.push("/carrinho");
    } catch (e) {
      console.error("Erro ao adicionar produto ao carrinho:", e);
    }
  }

  return (
    <button
      onClick={handleBuy}
      className="mt-6 w-full rounded-lg bg-[#23a559] py-4 text-center text-lg font-black hover:bg-[#1f8f4d]"
    >
      Comprar agora
    </button>
  );
}
