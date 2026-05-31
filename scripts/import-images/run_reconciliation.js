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

function getChipsetAndFamily(name) {
  const normName = name.toLowerCase();
  
  if (normName.includes('rtx 4060 ti')) return 'NVIDIA GeForce RTX 4060 Ti';
  if (normName.includes('rtx 4060')) return 'NVIDIA GeForce RTX 4060';
  if (normName.includes('rtx 3050')) return 'NVIDIA GeForce RTX 3050';
  if (normName.includes('rtx 4070 ti super')) return 'NVIDIA GeForce RTX 4070 Ti Super';
  if (normName.includes('rtx 4070 super')) return 'NVIDIA GeForce RTX 4070 Super';
  if (normName.includes('rx 6600')) return 'AMD Radeon RX 6600';
  if (normName.includes('rx 7600 xt')) return 'AMD Radeon RX 7600 XT';
  if (normName.includes('rx 7700 xt')) return 'AMD Radeon RX 7700 XT';
  if (normName.includes('rx 7800 xt')) return 'AMD Radeon RX 7800 XT';
  if (normName.includes('ryzen 5 5600')) return 'AMD Ryzen 5 5600';
  if (normName.includes('ryzen 5 7600')) return 'AMD Ryzen 5 7600';
  if (normName.includes('ryzen 7 5700x')) return 'AMD Ryzen 7 5700X';
  if (normName.includes('ryzen 7 7800x3d')) return 'AMD Ryzen 7 7800X3D';
  if (normName.includes('i3-14100f')) return 'Intel Core i3-14100F';
  if (normName.includes('i5-12400f')) return 'Intel Core i5-12400F';
  if (normName.includes('i5-14400f')) return 'Intel Core i5-14400F';
  if (normName.includes('i7-14700k')) return 'Intel Core i7-14700K';
  if (normName.includes('a520m')) return 'AMD A520 Chipset';
  if (normName.includes('b550m') || normName.includes('b550')) return 'AMD B550 Chipset';
  if (normName.includes('b650m') || normName.includes('b650')) return 'AMD B650 Chipset';
  if (normName.includes('x670e')) return 'AMD X670E Chipset';
  if (normName.includes('h610m')) return 'Intel H610 Chipset';
  if (normName.includes('b760m')) return 'Intel B760 Chipset';
  if (normName.includes('z790')) return 'Intel Z790 Chipset';
  if (normName.includes('ddr4')) return 'DDR4 Memory';
  if (normName.includes('ddr5')) return 'DDR5 Memory';
  if (normName.includes('ssd nvme')) return 'M.2 NVMe SSD';
  if (normName.includes('ssd sata')) return 'SATA III 2.5" SSD';
  if (normName.includes('barracuda')) return 'HDD 3.5" SATA III';
  
  return 'Geral Hardware';
}

function resolveBrandAndStatus(p) {
  const specs = (p.specs || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  
  // High confidence items mapping
  if (specs.includes('gigabyte')) return { brand: 'Gigabyte', status: 'Pronto para Atualizar', confidence: 'Alta' };
  if (specs.includes('asrock')) return { brand: 'ASRock', status: 'Pronto para Atualizar', confidence: 'Alta' };
  if (specs.includes('msi')) return { brand: 'MSI', status: 'Pronto para Atualizar', confidence: 'Alta' };
  if (specs.includes('xfx')) return { brand: 'XFX', status: 'Pronto para Atualizar', confidence: 'Alta' };
  if (specs.includes('pcyes')) return { brand: 'PCYes', status: 'Pronto para Atualizar', confidence: 'Alta' };
  if (name.includes('seagate') || specs.includes('seagate')) return { brand: 'Seagate', status: 'Pronto para Atualizar', confidence: 'Alta' };
  
  // CPUs Box are branded as AMD/Intel
  if (name.includes('ryzen 5') || name.includes('ryzen 7')) return { brand: 'AMD', status: 'Pronto para Atualizar', confidence: 'Alta' };
  if (name.includes('intel core')) return { brand: 'Intel', status: 'Pronto para Atualizar', confidence: 'Alta' };
  
  // If it's a GPU but has only chipset details
  if (name.includes('geforce rtx 4060') || name.includes('geforce rtx 3050') || name.includes('geforce rtx 4060 ti') || name.includes('geforce rtx 4070 super')) {
    return { brand: 'Apenas Chipset (NVIDIA)', status: 'Apenas Chipset Identificado', confidence: 'Média' };
  }
  
  // Generic products mapping
  let suggestedGenericBrand = 'Necessita Revisão (Kingston/Corsair/XPG)';
  if (p.category.includes('Placas-mãe')) suggestedGenericBrand = 'Necessita Revisão (ASUS/Gigabyte/MSI)';
  else if (p.category.includes('Fontes')) suggestedGenericBrand = 'Necessita Revisão (Corsair/MSI/Cougar)';
  else if (p.category.includes('Gabinetes')) suggestedGenericBrand = 'Necessita Revisão (Pichau/Mancer/Redragon)';
  else if (p.category.includes('Periféricos') || p.category.includes('Teclado') || p.category.includes('Mouse') || p.category.includes('Headset')) {
    suggestedGenericBrand = 'Necessita Revisão (Redragon/Logitech/Razer)';
  }
  
  return { brand: suggestedGenericBrand, status: 'Necessita Revisão', confidence: 'Baixa' };
}

async function runReconciliation() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, specs')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const results = [];
  let readyCount = 0;
  let chipsetOnlyCount = 0;
  let revisionCount = 0;

  products.forEach(p => {
    const chipset = getChipsetAndFamily(p.name);
    const { brand, status, confidence } = resolveBrandAndStatus(p);

    if (status === 'Pronto para Atualizar') readyCount++;
    else if (status === 'Apenas Chipset Identificado') chipsetOnlyCount++;
    else revisionCount++;

    results.push({
      id: p.id,
      name: p.name,
      chipset,
      brand,
      confidence,
      status
    });
  });

  // Write markdown report
  let md = `# Relatório de Reconciliação Final de Marcas — Tecno Peças\n\n`;
  md += `## 1. Resumo Executivo\n\n`;
  md += `* **Total de Produtos**: ${products.length}\n`;
  md += `* **Produtos Prontos para Atualizar (Marca Comercial Identificada)**: ${readyCount}\n`;
  md += `* **Produtos com Apenas Chipset Identificado**: ${chipsetOnlyCount}\n`;
  md += `* **Produtos Pendentes (Necessitam Revisão Comercial)**: ${revisionCount}\n\n`;

  md += `## 2. Relatório de Reconciliação de Marcas (100 Produtos)\n\n`;
  md += `| ID | Produto | Chipset/Família | Marca Comercial Identificada | Confiança | Status |\n`;
  md += `| :-: | :--- | :---: | :---: | :---: | :--- |\n`;

  results.forEach(r => {
    md += `| **${r.id}** | ${r.name} | ${r.chipset} | ${r.brand} | ${r.confidence} | ${r.status} |\n`;
  });

  const artPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\final_brand_reconciliation.md';
  fs.writeFileSync(artPath, md, 'utf-8');
  console.log('Report written to:', artPath);
  console.log(`Ready: ${readyCount}, ChipsetOnly: ${chipsetOnlyCount}, Revision: ${revisionCount}`);
}

runReconciliation().catch(console.error);
