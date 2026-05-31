const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Custom mapping rules based on product categories and name keywords
function suggestBrandAndModel(name, category) {
  const n = (name || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // 1. RAM Memory
  if (cat.includes('memória') || cat.includes('ram')) {
    if (n.includes('rgb') && n.includes('16gb')) return { brand: 'Corsair', model: 'Vengeance RGB Pro 2x8GB 3200MHz', conf: 'Média' };
    if (n.includes('rgb') && n.includes('32gb')) return { brand: 'Corsair', model: 'Vengeance RGB DDR5 2x16GB 6000MHz', conf: 'Média' };
    if (n.includes('32gb') && n.includes('3600')) return { brand: 'XPG', model: 'Gammix D30 2x16GB 3600MHz', conf: 'Média' };
    if (n.includes('ddr5') && n.includes('16gb')) return { brand: 'Kingston', model: 'Fury Beast DDR5 16GB 5600MHz', conf: 'Média' };
    if (n.includes('16gb')) return { brand: 'Kingston', model: 'Fury Beast Black DDR4 16GB 3200MHz', conf: 'Média' };
    return { brand: 'Kingston', model: 'Fury Beast Black DDR4 8GB 3200MHz', conf: 'Média' };
  }

  // 2. Storage (SSD/HD)
  if (cat.includes('armazenamento') || n.includes('ssd') || n.includes('hd ')) {
    if (n.includes('sata') && n.includes('480gb')) return { brand: 'Kingston', model: 'A400 SATA III 480GB', conf: 'Média' };
    if (n.includes('sata') && n.includes('1tb')) return { brand: 'Crucial', model: 'BX500 SATA III 1TB', conf: 'Média' };
    if (n.includes('nvme') && n.includes('500gb')) return { brand: 'Kingston', model: 'NV2 M.2 NVMe PCIe 4.0 500GB', conf: 'Média' };
    if (n.includes('nvme') && n.includes('1tb') && n.includes('3.0')) return { brand: 'WD', model: 'Blue SN570 NVMe M.2 1TB', conf: 'Média' };
    if (n.includes('nvme') && n.includes('1tb') && n.includes('4.0')) return { brand: 'Kingston', model: 'NV2 M.2 NVMe PCIe 4.0 1TB', conf: 'Média' };
    if (n.includes('nvme') && n.includes('2tb')) return { brand: 'Crucial', model: 'P3 Plus M.2 NVMe PCIe 4.0 2TB', conf: 'Média' };
  }

  // 3. Motherboards
  if (cat.includes('placa-mãe') || cat.includes('placa mae')) {
    if (n.includes('a520m')) return { brand: 'ASUS', model: 'Prime A520M-E', conf: 'Média' };
    if (n.includes('b550m')) return { brand: 'Gigabyte', model: 'B550M Aorus Elite', conf: 'Média' };
    if (n.includes('b550 gaming')) return { brand: 'ASUS', model: 'TUF Gaming B550-Plus Wi-Fi', conf: 'Média' };
    if (n.includes('b650m')) return { brand: 'MSI', model: 'MAG B650M Mortar Wi-Fi', conf: 'Média' };
    if (n.includes('x670e')) return { brand: 'ASUS', model: 'TUF Gaming X670E-Plus', conf: 'Média' };
    if (n.includes('h610m')) return { brand: 'ASUS', model: 'Prime H610M-E', conf: 'Média' };
    if (n.includes('b760m')) return { brand: 'Gigabyte', model: 'B760M Aorus Elite DDR4', conf: 'Média' };
    if (n.includes('z790')) return { brand: 'MSI', model: 'PRO Z790-A WiFi DDR5', conf: 'Média' };
  }

  // 4. Power Supplies
  if (cat.includes('fonte')) {
    if (n.includes('500w')) return { brand: 'MSI', model: 'MAG A500DN 500W', conf: 'Média' };
    if (n.includes('600w') || n.includes('650w')) return { brand: 'Corsair', model: 'CV650 650W 80 Plus', conf: 'Média' };
    if (n.includes('750w')) return { brand: 'XPG', model: 'Core Reactor 750W Gold', conf: 'Média' };
    if (n.includes('850w')) return { brand: 'XPG', model: 'Core Reactor 850W Gold Modular', conf: 'Média' };
    return { brand: 'MSI', model: 'MAG A550BN 550W', conf: 'Média' };
  }

  // 5. Cabinets/Cases
  if (cat.includes('gabinete')) {
    if (n.includes('black') || n.includes('preto')) return { brand: 'Mancer', model: 'Goblin Black Mid Tower', conf: 'Média' };
    if (n.includes('white') || n.includes('branco')) return { brand: 'Mancer', model: 'Goblin White Mid Tower', conf: 'Média' };
    if (n.includes('aquário') || n.includes('aquario')) return { brand: 'Redragon', model: 'Wideload Lite RGB', conf: 'Média' };
    if (n.includes('full tower')) return { brand: 'Cooler Master', model: 'Cosmos C700P Full Tower', conf: 'Média' };
    return { brand: 'Cooler Master', model: 'MasterBox TD500 Mesh', conf: 'Média' };
  }

  // 6. Peripherals / Accessories
  if (n.includes('teclado mecânico') || n.includes('teclado mecanico')) {
    if (n.includes('outemu')) return { brand: 'Redragon', model: 'Kumara K552 RGB Outemu', conf: 'Média' };
    if (n.includes('blue')) return { brand: 'Redragon', model: 'Mitra K551 RGB Blue Switch', conf: 'Média' };
    if (n.includes('red')) return { brand: 'Redragon', model: 'Dark Avenger K568 RGB Red Switch', conf: 'Média' };
    return { brand: 'Redragon', model: 'K530 Draconic 60% Wireless', conf: 'Média' };
  }
  if (n.includes('teclado gamer')) return { brand: 'Redragon', model: 'Harpe K503 RGB Membrana', conf: 'Média' };
  if (n.includes('mouse gamer')) {
    if (n.includes('7200')) return { brand: 'Redragon', model: 'Cobra M711 RGB', conf: 'Média' };
    if (n.includes('12000')) return { brand: 'Logitech', model: 'G502 Hero RGB', conf: 'Média' };
    return { brand: 'Logitech', model: 'G Pro X Superlight Wireless', conf: 'Média' };
  }
  if (n.includes('mouse office')) return { brand: 'Logitech', model: 'M170 Wireless Grey', conf: 'Média' };
  if (n.includes('headset gamer')) {
    if (n.includes('p2')) return { brand: 'Redragon', model: 'Scylla H901', conf: 'Média' };
    return { brand: 'Redragon', model: 'Zeus X RGB 7.1 USB', conf: 'Média' };
  }
  if (n.includes('headset wireless')) return { brand: 'HyperX', model: 'Cloud Flight Wireless', conf: 'Média' };
  if (n.includes('headset studio')) return { brand: 'HyperX', model: 'Cloud II Pro USB', conf: 'Média' };
  if (n.includes('mousepad')) {
    if (n.includes('médio')) return { brand: 'Redragon', model: 'Flick M Speed Medium', conf: 'Média' };
    if (n.includes('grande')) return { brand: 'Redragon', model: 'Flick L Speed Large', conf: 'Média' };
    if (n.includes('rgb')) return { brand: 'Redragon', model: 'Aurora RGB Large', conf: 'Média' };
    return { brand: 'HyperX', model: 'Fury S Pro XXL Deskmat', conf: 'Média' };
  }
  
  // 7. Chairs
  if (cat.includes('cadeira') || n.includes('cadeira')) {
    if (n.includes('basic')) return { brand: 'Husky', model: 'Gaming Blizzard Black/Red', conf: 'Média' };
    if (n.includes('rgb') || n.includes('pro')) return { brand: 'DT3', model: 'Sports Elise RGB Gaming', conf: 'Média' };
    if (n.includes('mesh')) return { brand: 'DT3', model: 'Office Alera Mesh Ergonomic', conf: 'Média' };
    return { brand: 'ThunderX3', model: 'Yama1 Premium Gaming', conf: 'Média' };
  }

  // 8. Other general items (cooling, fans, monitors)
  if (n.includes('air cooler') || n.includes('water cooler') || n.includes('fan')) {
    if (n.includes('water') && n.includes('240mm')) return { brand: 'Cooler Master', model: 'MasterLiquid ML240L V2 RGB', conf: 'Média' };
    if (n.includes('water') && n.includes('360mm')) return { brand: 'Cooler Master', model: 'MasterLiquid ML360L V2 ARGB', conf: 'Média' };
    if (n.includes('air cooler') && n.includes('dual tower')) return { brand: 'Cooler Master', model: 'Hyper 212 Spectrum V3', conf: 'Média' };
    return { brand: 'Rise Mode', model: 'Lazer RGB 120mm Fan Kit', conf: 'Média' };
  }

  if (n.includes('geforce') || n.includes('rtx') || n.includes('radeon') || n.includes('rx')) {
    if (n.includes('rtx 4070 super')) return { brand: 'Gigabyte', model: 'GeForce RTX 4070 Super Windforce 3X 12GB', conf: 'Média' };
    if (n.includes('rtx 4060 ti')) return { brand: 'Galax', model: 'GeForce RTX 4060 Ti 1-Click OC 8GB', conf: 'Média' };
    if (n.includes('rtx 4060')) return { brand: 'Galax', model: 'GeForce RTX 4060 1-Click OC 8GB', conf: 'Média' };
    if (n.includes('rtx 3050')) return { brand: 'MSI', model: 'GeForce RTX 3050 Ventus 2X 6GB', conf: 'Média' };
  }

  if (cat.includes('monitores') || n.includes('monitor')) {
    if (n.includes('144hz') || n.includes('curvo')) return { brand: 'LG', model: 'Ultragear 24GN600-B 144Hz IPS', conf: 'Média' };
    if (n.includes('165hz') || n.includes('quad')) return { brand: 'ASUS', model: 'TUF Gaming VG27AQ 165Hz QHD', conf: 'Média' };
    if (n.includes('ultrawide')) return { brand: 'LG', model: 'UltraWide 29UM69G-B 75Hz IPS', conf: 'Média' };
    if (n.includes('4k')) return { brand: 'LG', model: 'UltraFine 27UL500-W 4K IPS', conf: 'Média' };
    return { brand: 'LG', model: '22MP410-B 21.5" 75Hz VA', conf: 'Média' };
  }

  return { brand: 'Necessita Revisão', model: 'Modelo Não Identificado', conf: 'Baixa' };
}

async function runPendingSuggestions() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, specs')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const results = [];
  
  // We filter the 74 products that were classified as Needs Revision / Chipset Only
  // Let's identify which ones they are. Any product whose brand in the database is currently "GENERICA" or we mapped as revision.
  // Actually, let's suggest brands for all products that DO NOT have an explicit sub-vendor already mapped (e.g. Gigabyte, MSI, etc.).
  // In the previous step, we found 22 products are fully mapped, 4 are chipset only, and 74 are pending revision.
  // Let's target exactly these 74 + 4 = 78 products!
  
  const originalProductsIds = [2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  
  products.forEach(p => {
    // Check if it has a subvendor in specs:
    const specsLower = (p.specs || '').toLowerCase();
    const nameLower = (p.name || '').toLowerCase();
    
    let isFullyMapped = false;
    // Check if specs contain manufacturer
    if (specsLower.includes('gigabyte') || specsLower.includes('asrock') || specsLower.includes('msi') || specsLower.includes('xfx') || specsLower.includes('pcyes') || specsLower.includes('seagate')) {
      isFullyMapped = true;
    }
    // Check if it's AMD / Intel CPU
    if (nameLower.includes('ryzen') || nameLower.includes('intel core')) {
      isFullyMapped = true;
    }
    
    // Exception: GeForce GPU without sub-vendor is chipset only, so we want to suggest a brand (like ASUS/Galax/Gigabyte)
    if (nameLower.includes('geforce') && !isFullyMapped) {
      isFullyMapped = false; 
    }

    if (!isFullyMapped) {
      const suggestion = suggestBrandAndModel(p.name, p.category);
      results.push({
        id: p.id,
        name: p.name,
        category: p.category,
        brandSuggested: suggestion.brand,
        modelSuggested: suggestion.model,
        confidence: suggestion.conf
      });
    }
  });

  console.log(`Suggested brands for ${results.length} pending items.`);

  // Write markdown report
  let md = `# Sugestões de Marcas e Modelos Reais — FASE 3 (Tecno Peças)\n\n`;
  md += `Este relatório apresenta as sugestões de marcas comerciais brasileiras e modelos específicos para os **${results.length} produtos** pendentes de revisão ou cadastrados de forma genérica.\n\n`;

  md += `| ID | Produto | Categoria | Marca Sugerida | Modelo Sugerido | Confiança |\n`;
  md += `| :-: | :--- | :---: | :---: | :--- | :---: |\n`;

  results.forEach(r => {
    md += `| **${r.id}** | ${r.name} | ${r.category} | **${r.brandSuggested}** | ${r.modelSuggested} | ${r.confidence} |\n`;
  });

  const artPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\pending_brands_suggestions.md';
  fs.writeFileSync(artPath, md, 'utf-8');
  console.log('Markdown generated successfully at:', artPath);

  // Output first 15 for console preview
  console.log('\n--- PREVIEW (FIRST 15) ---');
  results.slice(0, 15).forEach(r => {
    console.log(`| **${r.id}** | ${r.name} | ${r.brandSuggested} | ${r.modelSuggested} | ${r.confidence} |`);
  });
}

runPendingSuggestions().catch(console.error);
