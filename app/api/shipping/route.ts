import { NextResponse } from "next/server";
import { estimateShipping, onlyNumbers, type ShippingQuote } from "@/app/lib/commerce";

type MelhorEnvioService = {
  id?: number;
  name?: string;
  company?: { name?: string };
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  error?: string;
};

async function quoteMelhorEnvio(cep: string, subtotal: number): Promise<ShippingQuote | null> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const fromPostalCode = onlyNumbers(process.env.SHIPPING_FROM_CEP || "");
  const sandbox = process.env.MELHOR_ENVIO_SANDBOX !== "false";

  if (!token || fromPostalCode.length !== 8) {
    return null;
  }

  const baseUrl = sandbox ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
  const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Tecno Pecas",
    },
    body: JSON.stringify({
      from: { postal_code: fromPostalCode },
      to: { postal_code: cep },
      products: [
        {
          id: "cart",
          width: 20,
          height: 12,
          length: 28,
          weight: 1.2,
          insurance_value: Math.max(subtotal, 10),
          quantity: 1,
        },
      ],
      options: {
        receipt: false,
        own_hand: false,
        insurance_value: Math.max(subtotal, 10),
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data: MelhorEnvioService[] = await response.json();
  const bestService = data
    .filter((service) => !service.error)
    .sort((a, b) => Number(a.custom_price || a.price || 9999) - Number(b.custom_price || b.price || 9999))[0];

  if (!bestService) {
    return null;
  }

  const price = subtotal >= 500 ? 0 : Number(bestService.custom_price || bestService.price || 0);

  return {
    cep,
    carrier: bestService.company?.name || "Melhor Envio",
    service: bestService.name || "Frete cotado",
    region: "Brasil",
    price,
    deliveryDays: `${bestService.delivery_time || 7} dias uteis`,
    freeShipping: price === 0,
    source: "melhor-envio",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cep = onlyNumbers(body.cep || "");
    const subtotal = Number(body.subtotal || 0);

    if (cep.length !== 8) {
      return NextResponse.json(
        { error: "CEP invalido. Digite 8 numeros." },
        { status: 400 }
      );
    }

    const melhorEnvioQuote = await quoteMelhorEnvio(cep, subtotal);

    return NextResponse.json(melhorEnvioQuote || estimateShipping(cep, subtotal));
  } catch {
    return NextResponse.json(
      { error: "Erro ao calcular frete." },
      { status: 500 }
    );
  }
}
