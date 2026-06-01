"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/app/lib/commerce";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice: number;
  stock: number;
  tag: string;
  image: string;
  category: string;
  images?: string[];
  brand?: string;
  slug?: string;
};

type BundleSelectorProps = {
  mainProduct: Product;
  bundleProduct: Product;
};

export default function BundleSelector({ mainProduct, bundleProduct }: BundleSelectorProps) {
  const router = useRouter();
  const [includeBundle, setIncludeBundle] = useState(true);

  const mainPixPrice = Number((mainProduct.price * 0.95).toFixed(2));
  const bundlePixPrice = Number((bundleProduct.price * 0.95).toFixed(2));

  const totalRegular = mainProduct.price + (includeBundle ? bundleProduct.price : 0);
  const totalPix = mainPixPrice + (includeBundle ? bundlePixPrice : 0);

  function handleAddBundle() {
    try {
      const savedCart = localStorage.getItem("tecnopecas_cart");
      let cart = savedCart ? JSON.parse(savedCart) : [];

      // Add main product
      const foundMain = cart.find((item: any) => item.id === mainProduct.id);
      if (foundMain) {
        cart = cart.map((item: any) =>
          item.id === mainProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        cart.push({ ...mainProduct, quantity: 1 });
      }

      // Add bundle product if checked
      if (includeBundle) {
        const foundBundle = cart.find((item: any) => item.id === bundleProduct.id);
        if (foundBundle) {
          cart = cart.map((item: any) =>
            item.id === bundleProduct.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          cart.push({ ...bundleProduct, quantity: 1 });
        }
      }

      localStorage.setItem("tecnopecas_cart", JSON.stringify(cart));
      router.push("/carrinho");
    } catch (e) {
      console.error("Erro ao adicionar combo ao carrinho:", e);
    }
  }

  return (
    <div className="mt-8 rounded-2xl bg-[#2b2d31] p-5 border border-[#1e1f22]">
      <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
        <span>📦</span> Compre Junto e Economize
      </h3>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-center md:text-left w-full md:w-auto">
          {/* Main Product Card */}
          <div className="flex items-center gap-3 p-3 bg-[#1e1f22] rounded-xl border border-transparent">
            <input
              type="checkbox"
              checked
              disabled
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#23a559] focus:ring-0 cursor-not-allowed"
            />
            <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white p-1 flex-shrink-0">
              <Image
                src={mainProduct.image}
                alt={mainProduct.name}
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white max-w-[150px] truncate">{mainProduct.name}</h4>
              <p className="text-xs text-[#23a559] font-black">{formatCurrency(mainProduct.price)}</p>
            </div>
          </div>

          <span className="text-xl font-bold text-[#b5bac1]">+</span>

          {/* Bundle Product Card */}
          <div 
            onClick={() => setIncludeBundle(!includeBundle)}
            className={`flex items-center gap-3 p-3 bg-[#1e1f22] rounded-xl border cursor-pointer transition select-none ${
              includeBundle ? "border-[#23a559]" : "border-[#404249] opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={includeBundle}
              onChange={() => {}} // Click is handled on container
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-[#23a559] focus:ring-0 cursor-pointer"
            />
            <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-white p-1 flex-shrink-0">
              <Image
                src={bundleProduct.image}
                alt={bundleProduct.name}
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white max-w-[150px] truncate">{bundleProduct.name}</h4>
              <p className="text-xs text-[#23a559] font-black">{formatCurrency(bundleProduct.price)}</p>
            </div>
          </div>
        </div>

        {/* Pricing / CTA */}
        <div className="w-full md:w-auto text-center md:text-right border-t md:border-t-0 border-[#1e1f22] pt-4 md:pt-0 flex flex-col md:items-end justify-center">
          <p className="text-xs text-[#b5bac1]">Leve os {includeBundle ? "2" : "1"} produtos por:</p>
          <div className="mt-1">
            <span className="text-xs text-[#8e9297] line-through block">{formatCurrency(totalRegular)}</span>
            <span className="text-2xl font-black text-[#23a559] block">{formatCurrency(totalPix)} <span className="text-xs font-normal text-[#23a559]">(no Pix)</span></span>
            <span className="text-xs text-[#b5bac1] block">ou {formatCurrency(totalRegular)} em até 12x</span>
          </div>
          <button
            onClick={handleAddBundle}
            className="mt-3 w-full md:w-auto px-5 py-3 rounded-lg bg-[#23a559] hover:bg-[#1f8f4d] font-black text-sm text-white transition flex items-center justify-center gap-2"
          >
            <span>🛒</span> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
