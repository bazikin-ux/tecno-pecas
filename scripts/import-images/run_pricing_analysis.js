const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Researched market prices for the first 20 products
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
  22: { avg: 1350 * 0.1, max: 170, confidence: 'Média', actualAvg: 135 }, // Memória 8GB DDR4 3200MHz (avg is 135, DB has 119.90)
  23: { avg: 2400 * 0.1, max: 320, confidence: 'Média', actualAvg: 240 }  // Memória 16GB DDR4 3200MHz (avg is 240, DB has 199.90)
};

// Fixed correct averages for ID 22 and 23
originalProductsMarketPrices[22].avg = 135;
originalProductsMarketPrices[23].avg = 240;

function getMarginConfig(category) {
  const normCat = (category || '').toLowerCase();
  
  if (normCat.includes('processador') || normCat.includes('cpu')) {
    return { name: 'CPUs', min: 0.08, max: 0.10, default: 0.10 };
  }
  if (normCat.includes('placa de vídeo') || normCat.includes('placa de video')) {
    return { name: 'GPUs', min: 0.08, max: 0.12, default: 0.10 };
  }
  if (normCat.includes('memória') || normCat.includes('ram')) {
    return { name: 'Memórias RAM', min: 0.15, max: 0.20, default: 0.20 };
  }
  if (normCat.includes('armazenamento') || normCat.includes('ssd') || normCat.includes('hd')) {
    return { name: 'SSDs/HDs', min: 0.15, max: 0.20, default: 0.20 };
  }
  if (normCat.includes('fonte')) {
    return { name: 'Fontes', min: 0.12, max: 0.18, default: 0.15 };
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
    return { name: 'Periféricos/Acessórios', min: 0.20, max: 0.30, default: 0.25 };
  }
  
  // Default fallback for motherboards, kits, PCs completes
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
  
  // High confidence: specific model numbers or brands mentioned
  // e.g. "Ryzen 5 5600", "RTX 4060 Ti 16GB", "Seagate Barracuda 1TB"
  // Medium: generic item like "Memória 8GB DDR4", "Placa-mãe A520M"
  // Low: very generic like "Gabinete Aquário RGB", "Air Cooler Dual Tower RGB"
  
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

async function runFullAnalysis() {
  console.log('Fetching all products from Supabase...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, price, category, specs')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching database products:', error.message);
    process.exit(1);
  }

  console.log(`Successfully fetched ${products.length} products.\n`);

  const categorizedResults = {};
  const lowOrMediumConfidence = [];
  const noBrandDefined = [];
  const needsManualValidation = [];

  let totalProcessed = 0;

  products.forEach((p) => {
    totalProcessed++;
    
    // 1. Determine cost/base price (preço médio de mercado)
    let basePrice = p.price;
    let maxPrice = p.price * 1.25; // fallback max
    let confidence = determineConfidence(p.name, p.category, p.brand);

    if (originalProductsMarketPrices[p.id]) {
      basePrice = originalProductsMarketPrices[p.id].avg;
      maxPrice = originalProductsMarketPrices[p.id].max;
      confidence = originalProductsMarketPrices[p.id].confidence;
    }

    // 2. Apply dynamic margin
    const marginConfig = getMarginConfig(p.category);
    let selectedMargin = marginConfig.default;
    
    // Let's optimize margin so the suggested price stays below maxPrice
    let suggestedPrice = basePrice * (1 + selectedMargin);
    let roundedPrice = Math.round(suggestedPrice / 10) * 10 - 0.10; // commercial round to .90

    if (roundedPrice > maxPrice) {
      // Reduce margin to min
      selectedMargin = marginConfig.min;
      suggestedPrice = basePrice * (1 + selectedMargin);
      roundedPrice = Math.round(suggestedPrice / 10) * 10 - 0.10;
    }

    const profit = roundedPrice - basePrice;
    const realAppliedMargin = (profit / basePrice) * 100;

    const competitorStatus = roundedPrice <= maxPrice ? 'Competitivo' : 'Acima do Máximo Concorrência';

    const resultRow = {
      id: p.id,
      name: p.name,
      category: p.category,
      basePrice,
      maxPrice,
      marginApplied: realAppliedMargin.toFixed(2) + '%',
      suggestedPrice: roundedPrice,
      profit,
      competitorStatus,
      confidence
    };

    // Group by category name
    const catName = marginConfig.name;
    if (!categorizedResults[catName]) {
      categorizedResults[catName] = [];
    }
    categorizedResults[catName].push(resultRow);

    // Filter alerts
    if (confidence === 'Média' || confidence === 'Baixa') {
      lowOrMediumConfidence.push(resultRow);
    }
    
    if (p.brand === 'GENERICA' || !p.brand) {
      noBrandDefined.push({ id: p.id, name: p.name, brand: p.brand });
    }

    // If it's a very generic name or has low confidence, it needs manual validation
    if (confidence === 'Baixa' || (confidence === 'Média' && basePrice < 150)) {
      needsManualValidation.push(resultRow);
    }
  });

  // Print results
  console.log(`=== QUANTIDADE TOTAL DE PRODUTOS PROCESSADOS: ${totalProcessed} ===\n`);

  // Write reports to a local JSON so we can format them
  const reportData = {
    totalProcessed,
    categorizedResults,
    lowOrMediumConfidence,
    noBrandDefined,
    needsManualValidation
  };

  fs.writeFileSync('C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\full_pricing_report.json', JSON.stringify(reportData, null, 2), 'utf-8');
  console.log('Saved report data to: C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\full_pricing_report.json');
}

runFullAnalysis().catch(console.error);
