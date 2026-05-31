import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { firstProductImage, formatCurrency, parseImageList, slugify } from "@/app/lib/commerce";
import ProductImageGallery from "./ProductImageGallery";
import BuyButton from "./BuyButton";
import ProductShippingSimulator from "./ProductShippingSimulator";
import type { Metadata } from "next";

type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice: number;
  stock: number;
  specs: string;
  tag: string;
  image: string;
  images: string[];
  brand: string;
};

async function getProduct(slug: string): Promise<Product | null> {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, old_price, stock, specs, tag, image, active, brand, image2, image3")
    .eq("active", true);

  if (error) return null;

  const product = (data || []).find((item) => slugify(item.name) === slug);
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: slugify(product.name),
    category: product.category,
    price: Number(product.price || 0),
    oldPrice: Number(product.old_price || product.price || 0),
    stock: Number(product.stock || 0),
    specs: product.specs || "",
    tag: product.tag || "Produto",
    image: firstProductImage(product.image),
    images: [
      ...parseImageList(product.image),
      product.image2,
      product.image3
    ].filter(Boolean),
    brand: product.brand || "",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Produto não encontrado | Tecno Peças",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tecnopecas.com.br";
  const productUrl = `${siteUrl}/produto/${product.slug}`;

  return {
    title: `${product.name} | Tecno Peças`,
    description: `${product.name} da marca ${product.brand || "Tecno Peças"}. Ficha técnica: ${product.specs || "Especificações disponíveis no site"}. Compre com segurança e envio para todo o Brasil.`,
    openGraph: {
      title: `${product.name} | Tecno Peças`,
      description: `Compre ${product.name} com o melhor preço na Tecno Peças. Envio rápido e parcelamento em até 12x.`,
      url: productUrl,
      type: "website",
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
    },
  };
}

async function getRelatedProducts(category: string, currentProductId: number): Promise<Product[]> {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) return [];

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 1. Same category
  const { data: catData } = await supabase
    .from("products")
    .select("id, name, category, price, old_price, stock, specs, tag, image, active, brand, image2, image3")
    .eq("active", true)
    .eq("category", category)
    .neq("id", currentProductId)
    .limit(4);

  let list = catData || [];

  // 2. Fallback in other categories
  if (list.length < 4) {
    const { data: otherData } = await supabase
      .from("products")
      .select("id, name, category, price, old_price, stock, specs, tag, image, active, brand, image2, image3")
      .eq("active", true)
      .neq("category", category)
      .neq("id", currentProductId)
      .limit(4 - list.length);
    if (otherData) {
      list = [...list, ...otherData];
    }
  }

  return list.map((product) => ({
    id: product.id,
    name: product.name,
    slug: slugify(product.name),
    category: product.category,
    price: Number(product.price || 0),
    oldPrice: Number(product.old_price || product.price || 0),
    stock: Number(product.stock || 0),
    specs: product.specs || "",
    tag: product.tag || "Produto",
    image: firstProductImage(product.image),
    images: [
      ...parseImageList(product.image),
      product.image2,
      product.image3
    ].filter(Boolean),
    brand: product.brand || "",
  }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const pixPrice = Number(((product?.price || 0) * 0.85).toFixed(2));

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tecnopecas.com.br";
  const productUrl = `${siteUrl}/produto/${product.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": `${product.name} - ${product.specs}`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Tecno Peças"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "BRL",
      "price": product.price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Tecno Peças"
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#313338] p-6 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-[#b5bac1]">
            Voltar para a loja
          </Link>
          <Link href="/cliente" className="text-sm font-bold text-[#b5bac1]">
            Minha conta
          </Link>
        </div>

        <section className="grid gap-6 rounded-2xl bg-[#2b2d31] p-5 md:grid-cols-[1.1fr_0.9fr]">
          <ProductImageGallery
            name={product.name}
            images={product.images}
            fallbackImage={product.image}
          />

          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-[#b5bac1]">{product.category}</p>
            <h1 className="mt-2 text-4xl font-black text-white">{product.name}</h1>
            <p className="mt-3 inline-block w-fit rounded-full bg-[#5865f2] px-3 py-1 text-sm font-bold">
              {product.tag}
            </p>

            <p className="mt-6 text-sm text-[#8e9297] line-through">
              {formatCurrency(product.oldPrice)}
            </p>
            <p className="text-4xl font-black text-[#23a559]">
              {formatCurrency(product.price)}
            </p>
            <div className="mt-3 rounded-xl bg-[#1e1f22] p-4">
              <p className="text-sm font-bold text-[#23a559]">Pix com 15% OFF</p>
              <p className="text-3xl font-black text-[#23a559]">{formatCurrency(pixPrice)}</p>
              <p className="mt-1 text-sm text-[#b5bac1]">
                Cartao, boleto ou Mercado Pago mantem o preco original de {formatCurrency(product.price)}.
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-[#1e1f22] p-4">
              <p className="font-black">Ficha Técnica</p>
              <div className="mt-2 space-y-1 text-[#b5bac1]">
                <p><span className="font-bold text-white">Marca:</span> {product.brand || "Não informada"}</p>
                <p><span className="font-bold text-white">Modelo:</span> {product.specs || "Não informado"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#1e1f22] p-4">
              <p className="font-black">Detalhes de compra</p>
              <div className="mt-3 grid gap-2 text-sm text-[#b5bac1]">
                <p>Garantia de 12 meses com suporte da loja.</p>
                <p>Pagamento por Pix, cartao, boleto ou Mercado Pago.</p>
                <p>Envio com rastreamento e atualizacao pelo painel do cliente.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#1e1f22] p-4">
                <p className="text-sm text-[#b5bac1]">Estoque</p>
                <p className="text-2xl font-black">{product.stock}</p>
              </div>
              <ProductShippingSimulator productPrice={product.price} />
            </div>

            <BuyButton product={product} />

            {/* Selos de Confiança */}
            <div className="mt-6 border-t border-[#1e1f22] pt-4">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 text-[#b5bac1]">
                  <span>🚚</span>
                  <span><strong>Frete Grátis</strong> para compras acima de R$ 499</span>
                </div>
                <div className="flex items-center gap-2 text-[#b5bac1]">
                  <span>💳</span>
                  <span><strong>Até 12x sem juros</strong> no cartão</span>
                </div>
                <div className="flex items-center gap-2 text-[#b5bac1]">
                  <span>🔒</span>
                  <span>Compra <strong>100% segura</strong> e garantida</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { name: "Compra verificada", text: "Produto chegou muito bem embalado e dentro do prazo." },
            { name: "Setup gamer", text: "Atendimento ajudou a escolher pecas compativeis." },
            { name: "Entrega rastreada", text: "Recebi o codigo de rastreio e acompanhei pelo site." },
          ].map((review) => (
            <div key={review.name} className="rounded-xl bg-[#2b2d31] p-4">
              <p className="font-black">★★★★★</p>
              <p className="mt-2 font-bold">{review.name}</p>
              <p className="mt-1 text-sm text-[#b5bac1]">{review.text}</p>
            </div>
          ))}
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-12 border-t border-[#2b2d31] pt-10">
            <h3 className="text-2xl font-black text-white mb-6">Produtos Relacionados</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <div key={p.id} className="rounded-2xl bg-[#2b2d31] p-4 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="relative h-40 w-full overflow-hidden rounded-xl bg-white p-2 mb-3">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="rounded-full bg-[#5865f2] px-2 py-0.5 text-xs font-bold">{p.tag}</span>
                    <h4 className="mt-2 text-md font-bold text-white min-h-[48px] line-clamp-2">{p.name}</h4>
                    <p className="mt-2 text-lg font-black text-[#23a559]">{formatCurrency(p.price)}</p>
                  </div>
                  <Link
                    href={`/produto/${p.slug}`}
                    className="mt-4 block w-full rounded-lg bg-[#404249] py-2 text-center text-sm font-bold text-white hover:bg-[#5865f2] transition"
                  >
                    Ver produto
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
