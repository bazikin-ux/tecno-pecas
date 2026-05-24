import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { formatCurrency, slugify } from "@/app/lib/commerce";

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
};

async function getProduct(slug: string): Promise<Product | null> {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, old_price, stock, specs, tag, image, active")
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
    image: product.image || "https://via.placeholder.com/900",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#313338] p-6 text-white">
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
          <div className="overflow-hidden rounded-xl bg-[#1e1f22]">
            <Image
              src={product.image}
              alt={product.name}
              width={900}
              height={620}
              priority
              className="h-[360px] w-full object-cover md:h-[560px]"
            />
          </div>

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

            <div className="mt-5 rounded-xl bg-[#1e1f22] p-4">
              <p className="font-black">Descricao</p>
              <p className="mt-2 text-[#b5bac1]">{product.specs || "Produto original com garantia e envio rapido pela Tecno Pecas."}</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#1e1f22] p-4">
                <p className="text-sm text-[#b5bac1]">Estoque</p>
                <p className="text-2xl font-black">{product.stock}</p>
              </div>
              <div className="rounded-xl bg-[#1e1f22] p-4">
                <p className="text-sm text-[#b5bac1]">Frete</p>
                <p className="text-2xl font-black">Melhor Envio</p>
              </div>
            </div>

            <Link
              href={`/?produto=${product.slug}`}
              className="mt-6 rounded-lg bg-[#23a559] py-4 text-center text-lg font-black hover:bg-[#1f8f4d]"
            >
              Comprar agora
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
