import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) return NextResponse.json({ error: "Erro ao buscar produtos.", details: error }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      category: body.category,
      price: Number(body.price),
      old_price: Number(body.old_price || body.price),
      stock: Number(body.stock || 0),
      specs: body.specs || "",
      tag: body.tag || "Produto",
      image: body.image || "",
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao criar produto.", details: error }, { status: 500 });
  return NextResponse.json(data);
}
