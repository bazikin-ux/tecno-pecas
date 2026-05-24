export type CouponResult = {
  code: string;
  label: string;
  percent: number;
  discount: number;
  valid: boolean;
  message: string;
};

export type ShippingQuote = {
  cep: string;
  carrier: string;
  service: string;
  region: string;
  price: number;
  deliveryDays: string;
  freeShipping: boolean;
  source: "melhor-envio" | "automatic";
};

const coupons = [
  { code: "TECNO10", percent: 10, minSubtotal: 0, label: "10% OFF" },
  { code: "PIX5", percent: 5, minSubtotal: 0, label: "5% OFF no Pix" },
  { code: "PRIMEIRACOMPRA", percent: 12, minSubtotal: 300, label: "12% OFF na primeira compra" },
];

export function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseImageList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function firstProductImage(value: string, fallback = "https://via.placeholder.com/900") {
  return parseImageList(value)[0] || fallback;
}

export function calculateCoupon(rawCode: string, subtotal: number): CouponResult {
  const code = rawCode.trim().toUpperCase();
  const coupon = coupons.find((item) => item.code === code);

  if (!code) {
    return {
      code: "",
      label: "",
      percent: 0,
      discount: 0,
      valid: false,
      message: "Informe um cupom.",
    };
  }

  if (!coupon) {
    return {
      code,
      label: "",
      percent: 0,
      discount: 0,
      valid: false,
      message: "Cupom invalido.",
    };
  }

  if (subtotal < coupon.minSubtotal) {
    return {
      code,
      label: coupon.label,
      percent: coupon.percent,
      discount: 0,
      valid: false,
      message: `Cupom disponivel a partir de ${formatCurrency(coupon.minSubtotal)}.`,
    };
  }

  const discount = Number((subtotal * (coupon.percent / 100)).toFixed(2));

  return {
    code,
    label: coupon.label,
    percent: coupon.percent,
    discount,
    valid: true,
    message: `Cupom ${code} aplicado: ${coupon.percent}% de desconto.`,
  };
}

export function estimateShipping(cepValue: string, subtotal: number): ShippingQuote {
  const cep = onlyNumbers(cepValue);
  const prefix = Number(cep.slice(0, 2));

  let region = "Brasil";
  let price = 39.9;
  let deliveryDays = "5 a 9 dias uteis";

  if (prefix >= 1 && prefix <= 19) {
    region = "Sao Paulo";
    price = 19.9;
    deliveryDays = "2 a 5 dias uteis";
  } else if (prefix >= 20 && prefix <= 28) {
    region = "Rio de Janeiro";
    price = 24.9;
    deliveryDays = "3 a 6 dias uteis";
  } else if (prefix >= 30 && prefix <= 39) {
    region = "Minas Gerais";
    price = 29.9;
    deliveryDays = "3 a 7 dias uteis";
  } else if (prefix >= 80 && prefix <= 99) {
    region = "Sul do Brasil";
    price = 34.9;
    deliveryDays = "4 a 8 dias uteis";
  } else if (prefix >= 40 && prefix <= 79) {
    region = "Norte/Nordeste/Centro-Oeste";
    price = 49.9;
    deliveryDays = "6 a 12 dias uteis";
  }

  if (subtotal >= 500) {
    price = 0;
    deliveryDays = "3 a 7 dias uteis";
  }

  return {
    cep,
    carrier: "Correios",
    service: price === 0 ? "Frete gratis" : "PAC automatico",
    region,
    price,
    deliveryDays,
    freeShipping: price === 0,
    source: "automatic",
  };
}

export function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export const availableCoupons = coupons;
