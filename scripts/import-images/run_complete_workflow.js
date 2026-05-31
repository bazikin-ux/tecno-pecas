const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const originalProductsMarketPrices = {
  2: { avg: 1950, max: 2400, confidence: 'Alta' }, // GeForce RTX 4060 8GB
  5: { avg: 850, max: 980, confidence: 'Alta' },  // Ryzen 5 5600
  6: { avg: 1350, max: 1490, confidence: 'Alta' }, // Ryzen 5 7600
  7: { avg: 1150, max: 1300, confidence: 'Alta' }, // Ryzen 7 5700X
  8: { avg: 2800, max: 3200, confidence: 'Alta' }, // Ryzen 7 7800X3D
  9: { avg: 720, max: 799, confidence: 'Alta' },  // Intel Core i3-14100F
  10: { avg: 710, max: 850, confidence: 'Alta' }, // Intel Core i5-12400F
  11: { avg: 1350, max: 1550, confidence: 'Alta' }, // Intel Core i5-14400F
  12: { avg: 2650, max: 2990, confidence: 'Alta' }, // Intel Core i7-14700K
  13: { avg: 1150, max: 1300, confidence: 'Alta' }, // GeForce RTX 3050 6GB
  14: { avg: 2650, max: 3000, confidence: 'Alta' }, // GeForce RTX 4060 Ti 8GB
  15: { avg: 3450, max: 3800, confidence: 'Alta' }, // GeForce RTX 4060 Ti 16GB
  16: { avg: 6100, max: 6699, confidence: 'Alta' }, // GeForce RTX 4070 Ti Super 16GB
  17: { avg: 1450, max: 1650, confidence: 'Alta' }, // Radeon RX 6600 8GB
  18: { avg: 2300, max: 2500, confidence: 'Alta' }, // Radeon RX 7600 XT 16GB
  19: { avg: 3150, max: 3499, confidence: 'Alta' }, // Radeon RX 7700 XT 12GB
  20: { avg: 3850, max: 4399, confidence: 'Alta' }, // Radeon RX 7800 XT 16GB
  21: { avg: 4250, max: 4700, confidence: 'Alta' }, // GeForce RTX 4070 Super 12GB
  22: { avg: 135, max: 170, confidence: 'Média' },  // Memória 8GB DDR4 3200MHz
  23: { avg: 240, max: 320, confidence: 'Média' }   // Memória 16GB DDR4 3200MHz
};

function getMarginConfig(category) {
  const normCat = (category || '').toLowerCase();
  if (normCat.includes('processador') || normCat.includes('cpu')) {
    return { name: 'Processadores (CPUs)', min: 0.08, max: 0.10, default: 0.10 };
  }
  if (normCat.includes('placa de vídeo') || normCat.includes('placa de video')) {
    return { name: 'Placas de Vídeo (GPUs)', min: 0.08, max: 0.12, default: 0.10 };
  }
  if (normCat.includes('memória') || normCat.includes('ram')) {
    return { name: 'Memórias RAM', min: 0.15, max: 0.20, default: 0.20 };
  }
  if (normCat.includes('armazenamento') || normCat.includes('ssd') || normCat.includes('hd')) {
    return { name: 'Armazenamento (SSDs/HDs)', min: 0.15, max: 0.20, default: 0.20 };
  }
  if (normCat.includes('fonte')) {
    return { name: 'Fontes de Alimentação', min: 0.12, max: 0.18, default: 0.15 };
  }
  if (normCat.includes('gabinete')) {
    return { name: 'Gabinetes', min: 0.15, max: 0.25, default: 0.20 };
  }
  if (
    normCat.includes('teclado') || 
    normCat.includes('mouse') || 
    normCat.includes('headset') || 
    normCat.includes('periferico') || 
    normCat.includes('acessorio') ||
    normCat.includes('cadeira') ||
    normCat.includes('monitor') ||
    normCat.includes('fan') ||
    normCat.includes('cooler')
  ) {
    return { name: 'Periféricos e Acessórios', min: 0.20, max: 0.30, default: 0.25 };
  }
  
  if (normCat.includes('placa-mãe') || normCat.includes('placa mae')) {
    return { name: 'Placas-mãe', min: 0.10, max: 0.15, default: 0.12 };
  }
  if (normCat.includes('kit') || normCat.includes('pc')) {
    return { name: 'PCs e Kits', min: 0.08, max: 0.12, default: 0.10 };
  }

  return { name: 'Outros', min: 0.10, max: 0.20, default: 0.15 };
}

function determineConfidence(name, category, brand) {
  const normName = (name || '').toLowerCase();
  if (
    normName.includes('ryzen') || 
    normName.includes('intel core') || 
    normName.includes('rtx') || 
    normName.includes('rx') ||
    normName.includes('seagate barracuda')
  ) {
    return 'Alta';
  }
  if (
    normName.includes('memória') || 
    normName.includes('ssd nvme') || 
    normName.includes('ssd sata') ||
    normName.includes('placa-mãe') ||
    normName.includes('fonte')
  ) {
    return 'Média';
  }
  return 'Baixa';
}

function identifyBrand(name, specs) {
  const text = ((name || '') + ' ' + (specs || '')).toLowerCase();
  
  const brandKeywords = [
    { brand: 'AMD', keys: ['amd', 'ryzen'] },
    { brand: 'Intel', keys: ['intel core', 'intel i3', 'intel i5', 'intel i7', 'intel i9', 'lga 1700', 'lga1700'] },
    { brand: 'Gigabyte', keys: ['gigabyte', 'aorus', 'windforce'] },
    { brand: 'ASRock', keys: ['asrock', 'cld'] },
    { brand: 'Galax', keys: ['galax', '1-click'] },
    { brand: 'MSI', keys: ['msi', 'gaming x', 'twin frozr'] },
    { brand: 'ASUS', keys: ['asus', 'tuf', 'rog', 'strix', 'prime'] },
    { brand: 'XFX', keys: ['xfx', 'speedster'] },
    { brand: 'PCYes', keys: ['pcyes', 'edge'] },
    { brand: 'Kingston', keys: ['kingston', 'fury'] },
    { brand: 'Corsair', keys: ['corsair', 'vengeance'] },
    { brand: 'TeamGroup', keys: ['teamgroup', 'team group', 't-force', 'vulcan'] },
    { brand: 'XPG', keys: ['xpg', 'gammix', 'spectrix'] },
    { brand: 'Crucial', keys: ['crucial'] },
    { brand: 'Lexar', keys: ['lexar'] },
    { brand: 'Seagate', keys: ['seagate', 'barracuda'] },
    { brand: 'WD', keys: ['wd blue', 'wd green', 'wd black', 'western digital'] },
    { brand: 'Redragon', keys: ['redragon'] },
    { brand: 'Logitech', keys: ['logitech'] },
    { brand: 'Razer', keys: ['razer'] },
    { brand: 'Cougar', keys: ['cougar'] },
    { brand: 'SuperFrame', keys: ['superframe'] },
    { brand: 'Mancer', keys: ['mancer'] },
    { brand: 'Pichau', keys: ['pichau'] },
    { brand: 'Deepcool', keys: ['deepcool'] },
    { brand: 'Thermalright', keys: ['thermalright'] },
    { brand: 'Rise Mode', keys: ['rise mode'] },
    { brand: 'Super Flower', keys: ['super flower'] },
    { brand: 'EVGA', keys: ['evga'] },
    { brand: 'Aerocool', keys: ['aerocool'] },
    { brand: 'Thermaltake', keys: ['thermaltake'] },
    { brand: 'Zotac', keys: ['zotac'] },
    { brand: 'Sapphire', keys: ['sapphire'] },
    { brand: 'PowerColor', keys: ['powercolor'] },
    { brand: 'Palit', keys: ['palit'] },
    { brand: 'PNY', keys: ['pny'] },
    { brand: 'Acer', keys: ['acer'] },
    { brand: 'LG', keys: ['lg monitor', 'lg 2'] },
    { brand: 'Samsung', keys: ['samsung'] },
    { brand: 'AOC', keys: ['aoc'] },
    { brand: 'Dell', keys: ['dell'] }
  ];

  for (const bk of brandKeywords) {
    if (bk.keys.some(k => text.includes(k))) {
      return bk.brand;
    }
  }

  return 'Necessita Revisão';
}

async function runComplete() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, price, category, specs')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  const categorizedResults = {};
  const allRows = [];

  products.forEach((p) => {
    let basePrice = p.price;
    let maxPrice = p.price * 1.25;
    let confidence = determineConfidence(p.name, p.category, p.brand);

    if (originalProductsMarketPrices[p.id]) {
      basePrice = originalProductsMarketPrices[p.id].avg;
      maxPrice = originalProductsMarketPrices[p.id].max;
      confidence = originalProductsMarketPrices[p.id].confidence;
    }

    const marginConfig = getMarginConfig(p.category);
    let selectedMargin = marginConfig.default;
    
    let suggestedPrice = basePrice * (1 + selectedMargin);
    let roundedPrice = Math.round(suggestedPrice / 10) * 10 - 0.10;

    if (roundedPrice > maxPrice) {
      selectedMargin = marginConfig.min;
      suggestedPrice = basePrice * (1 + selectedMargin);
      roundedPrice = Math.round(suggestedPrice / 10) * 10 - 0.10;
    }

    const profit = roundedPrice - basePrice;
    const realAppliedMargin = (profit / basePrice) * 100;

    const row = {
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      currentPrice: p.price,
      basePrice,
      maxPrice,
      marginApplied: realAppliedMargin,
      profit,
      suggestedPrice: roundedPrice,
      confidence
    };

    allRows.push(row);

    const catName = marginConfig.name;
    if (!categorizedResults[catName]) {
      categorizedResults[catName] = [];
    }
    categorizedResults[catName].push(row);
  });

  // Sort rows by profit descending for top 20
  const sortedByProfit = [...allRows].sort((a, b) => b.profit - a.profit);
  const top20ProfitIds = new Set(sortedByProfit.slice(0, 20).map(r => r.id));

  // Sort by ID to restore
  // Write full_catalog_pricing_complete.md
  let pricingMd = `# Relatório de Precificação Completa do Catálogo — Tecno Peças\n\n`;
  pricingMd += `Este relatório detalha a precificação com margens dinâmicas de todos os **100 produtos** do catálogo.\n\n`;
  
  pricingMd += `> [!IMPORTANT]\n`;
  pricingMd += `> **Preços em Destaque**: Produtos destacados com 🌟 pertencem ao grupo das **20 maiores margens de lucro absolutas**. Produtos destacados com ⚠️ possuem confiança média ou baixa no preço de referência.\n\n`;

  for (const [catName, items] of Object.entries(categorizedResults)) {
    pricingMd += `## Categoria: ${catName} (${items.length} produtos)\n\n`;
    pricingMd += `| ID | Produto | Marca Atual | Preço Atual | Preço de Custo (Mercado) | Margem Aplicada (%) | Lucro Estimado | Novo Preço Sugerido | Confiança |\n`;
    pricingMd += `| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :-: |\n`;

    items.forEach(r => {
      const topStar = top20ProfitIds.has(r.id) ? '🌟 ' : '';
      const confWarn = (r.confidence === 'Média' || r.confidence === 'Baixa') ? '⚠️ ' : '';
      pricingMd += `| **${r.id}** | ${topStar}${r.name} | ${r.brand} | R$ ${r.currentPrice.toFixed(2)} | R$ ${r.basePrice.toFixed(2)} | ${r.marginApplied.toFixed(2)}% | R$ ${r.profit.toFixed(2)} | **R$ ${r.suggestedPrice.toFixed(2)}** | ${confWarn}${r.confidence} |\n`;
    });
    pricingMd += `\n`;
  }

  // Add top 20 profit list
  pricingMd += `## Top 20 Produtos com Maior Lucro Absoluto\n\n`;
  pricingMd += `| ID | Produto | Categoria | Preço de Custo | Preço Sugerido | Lucro em R$ |\n`;
  pricingMd += `| :-: | :--- | :---: | :---: | :---: | :---: |\n`;
  sortedByProfit.slice(0, 20).forEach(r => {
    pricingMd += `| **${r.id}** | ${r.name} | ${r.category} | R$ ${r.basePrice.toFixed(2)} | R$ ${r.suggestedPrice.toFixed(2)} | **R$ ${r.profit.toFixed(2)}** |\n`;
  });
  pricingMd += `\n`;

  // Write to artifact
  const artPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\full_catalog_pricing_complete.md';
  fs.writeFileSync(artPath, pricingMd, 'utf-8');
  console.log('Complete catalog pricing report written to:', artPath);

  // Now, run Fase 2 (Brands Identification)
  const brandResults = [];
  products.forEach((p) => {
    const identified = identifyBrand(p.name, p.specs);
    const priceRow = allRows.find(r => r.id === p.id);
    const suggestedPrice = priceRow ? priceRow.suggestedPrice : p.price;
    const confidence = determineConfidence(p.name, p.category, p.brand);
    
    let status = 'Pronto para Importar';
    if (identified === 'Necessita Revisão') {
      status = 'Necessita Revisão';
    }

    brandResults.push({
      id: p.id,
      name: p.name,
      brandAtual: p.brand,
      brandIdentified: identified,
      suggestedPrice,
      confidence,
      status
    });
  });

  // Write Fase 2 JSON report
  fs.writeFileSync('C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase2_brand_report.json', JSON.stringify(brandResults, null, 2), 'utf-8');
  console.log('Saved brand report data to: C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase2_brand_report.json');
}

runComplete().catch(console.error);
