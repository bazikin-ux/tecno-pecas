const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const originalProductsMarketPrices = {
  2: { avg: 1950, max: 2400 },
  5: { avg: 850, max: 980 },
  6: { avg: 1350, max: 1490 },
  7: { avg: 1150, max: 1300 },
  8: { avg: 2800, max: 3200 },
  9: { avg: 720, max: 799 },
  10: { avg: 710, max: 850 },
  11: { avg: 1350, max: 1550 },
  12: { avg: 2650, max: 2990 },
  13: { avg: 1150, max: 1300 },
  14: { avg: 2650, max: 3000 },
  15: { avg: 3450, max: 3800 },
  16: { avg: 6100, max: 6699 },
  17: { avg: 1450, max: 1650 },
  18: { avg: 2300, max: 2500 },
  19: { avg: 3150, max: 3499 },
  20: { avg: 3850, max: 4399 },
  21: { avg: 4250, max: 4700 },
  22: { avg: 135, max: 170 },
  23: { avg: 240, max: 320 }
};

function getMarginConfig(category) {
  const normCat = (category || '').toLowerCase();
  if (normCat.includes('processador') || normCat.includes('cpu')) {
    return { min: 0.08, max: 0.10, default: 0.10 };
  }
  if (normCat.includes('placa de vídeo') || normCat.includes('placa de video')) {
    return { min: 0.08, max: 0.12, default: 0.10 };
  }
  if (normCat.includes('memória') || normCat.includes('ram')) {
    return { min: 0.15, max: 0.20, default: 0.20 };
  }
  if (normCat.includes('armazenamento') || normCat.includes('ssd') || normCat.includes('hd')) {
    return { min: 0.15, max: 0.20, default: 0.20 };
  }
  if (normCat.includes('fonte')) {
    return { min: 0.12, max: 0.18, default: 0.15 };
  }
  if (normCat.includes('gabinete')) {
    return { min: 0.15, max: 0.25, default: 0.20 };
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
    return { min: 0.20, max: 0.30, default: 0.25 };
  }
  
  if (normCat.includes('placa-mãe') || normCat.includes('placa mae')) {
    return { min: 0.10, max: 0.15, default: 0.12 };
  }
  if (normCat.includes('kit') || normCat.includes('pc')) {
    return { min: 0.08, max: 0.12, default: 0.10 };
  }
  return { min: 0.10, max: 0.20, default: 0.15 };
}

async function fixPrices() {
  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, price, category')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching prices from db:', error.message);
    process.exit(1);
  }

  let fixedCount = 0;

  catalog.forEach(item => {
    if (item.priceFinal === null || isNaN(item.priceFinal)) {
      const dbProd = dbProducts.find(x => x.id === item.id);
      if (dbProd) {
        let basePrice = dbProd.price;
        let maxPrice = dbProd.price * 1.25;

        if (originalProductsMarketPrices[item.id]) {
          basePrice = originalProductsMarketPrices[item.id].avg;
          maxPrice = originalProductsMarketPrices[item.id].max;
        }

        const marginConfig = getMarginConfig(dbProd.category || item.category);
        let selectedMargin = marginConfig.default;
        let suggestedPrice = basePrice * (1 + selectedMargin);
        let roundedPrice = Math.round(suggestedPrice / 10) * 10 - 0.10;

        if (roundedPrice > maxPrice) {
          selectedMargin = marginConfig.min;
          suggestedPrice = basePrice * (1 + selectedMargin);
          roundedPrice = Math.round(suggestedPrice / 10) * 10 - 0.10;
        }

        item.priceFinal = roundedPrice;
        fixedCount++;
      }
    }
  });

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`Successfully fixed ${fixedCount} null prices in final_consolidated_catalog.json`);
}

fixPrices().catch(console.error);
