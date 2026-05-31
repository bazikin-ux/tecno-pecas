const fs = require('fs');

const path = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
const catalog = JSON.parse(fs.readFileSync(path, 'utf-8'));

const officialDomains = [
  'kabum.com.br', 'pichau.com.br', 'terabyteshop.com.br',
  'asus.com', 'gigabyte.com', 'intel.com', 'amd.com', 
  'msi.com', 'corsair.com', 'hyperx.com', 'kingston.com',
  'logitech.com', 'razer.com', 'redragon.com'
];

const revision = [];

catalog.forEach(r => {
  const i2 = r.image2 || '';
  const i3 = r.image3 || '';

  const isI2Simulated = i2.includes('exemplo_') || i2.includes('placeholder') || i2 === 'Não Encontrado' || i2 === 'Pendente';
  const isI3Simulated = i3.includes('exemplo_') || i3.includes('placeholder') || i3 === 'Não Encontrado' || i3 === 'Pendente';

  const isReady = (r.confidence === 'Alta' || r.confidence === 'Média') && !isI2Simulated && !isI3Simulated;

  if (!isReady) {
    revision.push(r);
  }
});

console.log(`Found ${revision.length} products to revise:`);
revision.forEach((p, idx) => {
  console.log(`[${idx + 1}] ID: ${p.id} | Name: "${p.name}" | Brand: "${p.brandFinal}" | Model: "${p.modelFinal}"`);
});
