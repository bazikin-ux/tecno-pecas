import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { firstProductImage, parseImageList, slugify } from "@/app/lib/commerce";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function GET() {
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, price, old_price, stock, specs, tag, image, active, brand, image2, image3")
    .eq("active", true)
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao buscar produtos.", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      slug: slugify(product.name),
      category: product.category,
      price: Number(product.price || 0),
      oldPrice: Number(product.old_price || product.price || 0),
      stock: Number(product.stock || 0),
      specs: product.specs || "",
      tag: product.tag || "Produto",
      rating: Number((4.2 + (product.id % 8) / 10).toFixed(1)),
      sold: (product.id * 17) % 780 + 35,
      image: firstProductImage(product.image),
      images: [
        ...parseImageList(product.image),
        product.image2,
        product.image3
      ].filter(Boolean),
      brand: product.brand || "",
    }))
  );
}
