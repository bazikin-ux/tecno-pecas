import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();

  const { data, error } = await supabase
    .from("products")
    .update({
      name: body.name,
      category: body.category,
      price: Number(body.price),
      old_price: Number(body.old_price || body.price),
      stock: Number(body.stock || 0),
      specs: body.specs || "",
      tag: body.tag || "Produto",
      image: body.image || "",
      active: Boolean(body.active),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao atualizar produto.", details: error }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Erro ao excluir produto.", details: error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
