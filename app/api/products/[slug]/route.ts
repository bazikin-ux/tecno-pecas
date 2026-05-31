import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { firstProductImage, parseImageList, slugify } from "@/app/lib/commerce";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  if (!supabase) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, old_price, stock, specs, tag, image, active, brand, image2, image3")
    .eq("active", true);

  if (error) {
    return NextResponse.json(
      { error: "Erro ao buscar produto.", details: error.message },
      { status: 500 }
    );
  }

  const product = (data || []).find((item) => slugify(item.name) === slug);

  if (!product) {
    return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: slugify(product.name),
    category: product.category,
    price: Number(product.price || 0),
    oldPrice: Number(product.old_price || product.price || 0),
    stock: Number(product.stock || 0),
    specs: product.specs || "",
    tag: product.tag || "Produto",
    rating: 4.8,
    sold: 0,
    image: firstProductImage(product.image),
    images: [
      ...parseImageList(product.image),
      product.image2,
      product.image3
    ].filter(Boolean),
    brand: product.brand || "",
  });
}
