import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tecnopecas.com.br";

  const routes = [
    "",
    "/carrinho",
    "/promocoes",
    "/mais-vendidos",
    "/monte-seu-pc",
    "/rastreamento",
    "/cliente",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  let productRoutes: MetadataRoute.Sitemap = [];

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await supabase
        .from("products")
        .select("name")
        .eq("active", true);

      if (data && data.length > 0) {
        productRoutes = data.map((product) => ({
          url: `${siteUrl}/produto/${slugify(product.name)}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      }
    } catch (e) {
      console.error("Erro ao gerar sitemap dinâmico:", e);
    }
  }

  return [...routes, ...productRoutes];
}
