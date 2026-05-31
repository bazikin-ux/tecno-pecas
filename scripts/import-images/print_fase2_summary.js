const fs = require('fs');

const path = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase2_brand_report.json';
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));

const total = data.length;
const identified = data.filter(r => r.brandIdentified !== 'Necessita Revisão').length;
const revision = data.filter(r => r.brandIdentified === 'Necessita Revisão').length;
const undefinedBrand = revision; // since initially all were GENERICA, any not identified still needs a brand defined

console.log('--- STATS ---');
console.log('Total:', total);
console.log('Identified:', identified);
console.log('Revision:', revision);
console.log('Undefined:', undefinedBrand);

console.log('\n--- LAST 20 PRODUCTS ---');
const last20 = data.slice(-20);
last20.forEach(p => {
  console.log(`ID: ${p.id} | Name: "${p.name}" | Brand: "${p.brandIdentified}" | Suggested: R$ ${p.suggestedPrice.toFixed(2)} | Confidence: ${p.confidence} | Status: ${p.status}`);
});
