const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchImages(query) {
  try {
    const initialUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const initRes = await fetch(initialUrl, {
      headers: { 'User-Agent': userAgent }
    });
    if (!initRes.ok) return [];
    const html = await initRes.text();
    const vqdMatch = html.match(/vqd=([^&'"]+)/) || html.match(/vqd\s*=\s*['"]([^'"]+)['"]/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];

    const imagesUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const imgRes = await fetch(imagesUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://duckduckgo.com/'
      }
    });
    if (!imgRes.ok) return [];
    const data = await imgRes.json();
    return data.results || [];
  } catch (error) {
    return [];
  }
}

// Identifiers mapping
const brandKeywords = [
  { brand: 'AMD', keys: ['amd', 'ryzen'] },
  { brand: 'Intel', keys: ['intel core', 'intel i3', 'intel i5', 'intel i7', 'intel i9', 'lga 1700'] },
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
  { brand: 'Razer', keys: ['razer'] }
];

function identifyBrandAndModel(name, specs) {
  const text = ((name || '') + ' ' + (specs || '')).toLowerCase();
  
  let brand = 'GENERICA';
  for (const bk of brandKeywords) {
    if (bk.keys.some(k => text.includes(k))) {
      brand = bk.brand;
      break;
    }
  }

  // Model extraction
  let model = 'Desconhecido';
  const modelRegexes = [
    /(rtx\s\d{4}(?:\sti)?)/i,
    /(rx\s\d{4}(?:\sxt)?)/i,
    /(ryzen\s\d\s\d{4}(?:x3d|x)?)/i,
    /(core\si\d[-–]\d{5}[fk]?)/i,
    /((?:a520m|b550m|x670e|b650m|b550)\b)/i,
    /(ddr\d\s\d{4}mhz)/i,
    /(barracuda\s\d(tb|gb))/i,
    /(nvme\s\d(tb|gb))/i
  ];

  for (const regex of modelRegexes) {
    const match = name.match(regex) || (specs && specs.match(regex));
    if (match) {
      model = match[1].trim();
      break;
    }
  }

  if (model === 'Desconhecido') {
    model = name.replace(/(memória|ssd|hd|gabinete|fonte|placa-mãe|placa de vídeo|cooler|fan)\b/gi, '').trim();
  }

  return { brand, model };
}

async function runBatch() {
  console.log('Fetching all products from DB...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, price, category, specs, image')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching database products:', error);
    return;
  }

  // Load progress if exists
  const progressPath = path.join(__dirname, 'fase3_batch_progress.json');
  let progress = [];
  if (fs.existsSync(progressPath)) {
    progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
  }

  // Find index of last processed item in progress list
  const processedIds = new Set(progress.map(item => item.id));
  
  // We want to skip first 12 products since user says "sem repetir os já processados... continue a partir do produto 13"
  // Let's identify the first 12 product IDs
  const skippedIds = new Set(products.slice(0, 12).map(p => p.id));
  
  // Filter products remaining to process
  const pendingProducts = products.filter(p => !skippedIds.has(p.id) && !processedIds.has(p.id));

  console.log(`Total remaining to process in catalog: ${pendingProducts.length}`);
  if (pendingProducts.length === 0) {
    console.log('All products already processed in previous batches.');
    return;
  }

  // Take a batch of 10
  const batch = pendingProducts.slice(0, 10);
  console.log(`Processing batch of ${batch.length} products...\n`);

  const batchResults = [];

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    console.log(`[Batch Item ${i+1}/10] Searching images for ID ${p.id}: "${p.name}"`);

    const { brand, model } = identifyBrandAndModel(p.name, p.specs);
    
    let brandVal = brand;
    if (brandVal === 'GENERICA') {
      if (p.name.includes('GeForce') || p.name.includes('RTX') || p.name.includes('GTX')) brandVal = 'NVIDIA';
      else if (p.name.includes('Radeon') || p.name.includes('RX')) brandVal = 'AMD';
    }

    const query = `${brandVal} ${model} produto hardware`.trim();
    const imgs = await searchImages(query);
    
    const cleanMain = (p.image || '').toLowerCase();
    const validImgs = imgs
      .map(img => img.image)
      .filter(url => url && url.startsWith('http') && !url.toLowerCase().includes('supabase.co') && url.toLowerCase() !== cleanMain);

    const image2 = validImgs[0] || 'Não Encontrado';
    const image3 = validImgs[1] || 'Não Encontrado';

    const confidence = brandVal !== 'GENERICA' ? 'Alta' : 'Baixa';
    const status = brandVal !== 'GENERICA' ? 'Pronto para Importar' : 'Necessita Revisão';

    const resultRow = {
      id: p.id,
      name: p.name,
      brandIdentified: brandVal,
      modelIdentified: model,
      image2,
      image3,
      source: 'DuckDuckGo Search',
      confidence,
      status
    };

    batchResults.push(resultRow);
    progress.push(resultRow);

    await sleep(2000); // 2s delay
  }

  // Save progress
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf-8');
  console.log(`Progress saved to: ${progressPath}`);

  // Report statistics
  const totalProcessedSoFar = skippedIds.size + progress.length;
  const remainingInCatalog = products.length - totalProcessedSoFar;

  const highConfidenceCount = batchResults.filter(r => r.confidence === 'Alta').length;
  const revisionCount = batchResults.filter(r => r.confidence === 'Baixa').length;

  console.log('\n--- BATCH STATS ---');
  console.log(`Processed in this batch: ${batchResults.length}`);
  console.log(`Remaining in catalog: ${remainingInCatalog}`);
  console.log(`High confidence in this batch: ${highConfidenceCount}`);
  console.log(`Needs revision in this batch: ${revisionCount}`);

  // Print markdown table output
  console.log('\n--- MARKDOWN TABLE ---');
  console.log('| ID | Produto | Marca Identificada | Modelo Identificado | image2 | image3 | Confiança |');
  console.log('| :-: | :--- | :---: | :---: | :--- | :--- | :---: |');
  batchResults.forEach(r => {
    console.log(`| **${r.id}** | ${r.name} | ${r.brandIdentified} | ${r.modelIdentified} | [Link 2](${r.image2.substring(0,40)}...) | [Link 3](${r.image3.substring(0,40)}...) | ${r.confidence} |`);
  });
}

runBatch().catch(console.error);
