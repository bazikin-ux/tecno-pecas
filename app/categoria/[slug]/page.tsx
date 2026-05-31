import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { firstProductImage, slugify } from "@/app/lib/commerce";
import CategoryPageClient from "./CategoryPageClient";

// Consistent mapping to resolve database inconsistencies
export const categoryMap: Record<string, { title: string; dbCategories: string[] }> = {
  "placas-de-video": {
    title: "Placas de Vídeo",
    dbCategories: ["Placas de Vídeo", "Placas de vídeo"],
  },
  "processadores": {
    title: "Processadores",
    dbCategories: ["Processadores"],
  },
  "memorias-ram": {
    title: "Memórias RAM",
    dbCategories: ["Memória RAM", "Memórias RAM", "MemÃ³rias RAM"],
  },
  "armazenamento": {
    title: "Armazenamento",
    dbCategories: ["Armazenamento"],
  },
  "placas-mae": {
    title: "Placas-mãe",
    dbCategories: ["Placas-mãe", "Placas-mÃ£e", "Placas-mãe"],
  },
  "fontes": {
    title: "Fontes",
    dbCategories: ["Fontes"],
  },
  "gabinetes": {
    title: "Gabinetes",
    dbCategories: ["Gabinetes"],
  },
  "coolers": {
    title: "Coolers e Fans",
    dbCategories: ["Coolers", "Fans RGB", "Cooler"],
  },
  "monitores": {
    title: "Monitores",
    dbCategories: ["Monitores"],
  },
  "perifericos": {
    title: "Periféricos",
    dbCategories: ["Periféricos", "PerifÃ©ricos", "Teclados", "Mouses", "Headsets", "Mousepads", "Cadeiras gamer", "Kits gamer"],
  },
  "pcs-completos": {
    title: "PCs Completos",
    dbCategories: ["PCs completos", "PCs Montados"],
  },
  "kits-upgrade": {
    title: "Kits Upgrade",
    dbCategories: ["Kits upgrade", "Kits Upgrade"],
  },
};

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

async function getCategoryProducts(dbCategories: string[]): Promise<Product[]> {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) return [];

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, old_price, stock, specs, tag, image, active, brand, created_at")
    .eq("active", true)
    .in("category", dbCategories);

  if (error) return [];

  return (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price || 0),
    oldPrice: Number(product.old_price || product.price || 0),
    stock: Number(product.stock || 0),
    specs: product.specs || "",
    tag: product.tag || "Produto",
    rating: Number(product.rating || 4.7),
    sold: Number(product.sold || 0),
    image: firstProductImage(product.image),
    slug: slugify(product.name),
    brand: product.brand || "",
    created_at: product.created_at || new Date().toISOString(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoryConfig = categoryMap[slug];

  if (!categoryConfig) {
    return {
      title: "Categoria não encontrada | Tecno Peças",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tecnopecaspc.com.br";
  const categoryUrl = `${siteUrl}/categoria/${slug}`;

  return {
    title: `${categoryConfig.title} | Hardware Gamer | Tecno Peças`,
    description: `Compre ${categoryConfig.title} com o melhor preço na Tecno Peças. Envio rápido para todo o Brasil e parcelamento em até 12x sem juros.`,
    openGraph: {
      title: `${categoryConfig.title} | Hardware Gamer | Tecno Peças`,
      description: `Confira nossa linha de ${categoryConfig.title}. Os melhores componentes para seu computador gamer estão aqui.`,
      url: categoryUrl,
      type: "website",
      images: [
        {
          url: `${siteUrl}/tecno-pecas-profile.png`,
          width: 800,
          height: 800,
          alt: `Categoria ${categoryConfig.title} - Tecno Peças`,
        },
      ],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryConfig = categoryMap[slug];

  if (!categoryConfig) {
    notFound();
  }

  const products = await getCategoryProducts(categoryConfig.dbCategories);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tecnopecaspc.com.br";
  const categoryUrl = `${siteUrl}/categoria/${slug}`;

  // Rich JSON-LD Schemas: BreadcrumbList and ItemList
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Categoria",
          "item": `${siteUrl}/categoria`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": categoryConfig.title,
          "item": categoryUrl
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": categoryConfig.title,
      "description": `Produtos na categoria ${categoryConfig.title} na loja Tecno Peças.`,
      "url": categoryUrl,
      "numberOfItems": products.length,
      "itemListElement": products.map((p, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `${siteUrl}/produto/${p.slug}`
      }))
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPageClient 
        categorySlug={slug}
        categoryTitle={categoryConfig.title}
        initialProducts={products}
      />
    </>
  );
}
