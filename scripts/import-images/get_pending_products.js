const fs = require('fs');

const path = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase2_brand_report.json';
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));

const pending = data.filter(r => r.brandIdentified === 'Necessita Revisão');
console.log('Total pending:', pending.length);
pending.slice(0, 15).forEach((p, idx) => {
  console.log(`[${idx + 1}] ID: ${p.id} | Name: "${p.name}"`);
});
