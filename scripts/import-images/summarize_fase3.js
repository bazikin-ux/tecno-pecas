const fs = require('fs');

const path = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase3_images_report.json';
const data = JSON.parse(fs.readFileSync(path, 'utf-8'));

const total = data.length;
const identified = data.filter(r => r.brandIdentified !== 'GENERICA' && r.brandIdentified !== 'Necessita Revisão').length;
const remainingUnidentified = data.filter(r => r.brandIdentified === 'GENERICA' || r.brandIdentified === 'Necessita Revisão').length;

console.log('--- STATS ---');
console.log('Total processed:', total);
console.log('Identified brands:', identified);
console.log('Unidentified/Revision brands:', remainingUnidentified);

console.log('\n--- FIRST 10 PRODUCTS TABLE FORMAT ---');
const first10 = data.slice(0, 10);
first10.forEach(p => {
  console.log(`| **${p.id}** | ${p.name} | ${p.brandIdentified} | ${p.modelIdentified} | [Link 2](${p.image2.substring(0, 40)}...) | [Link 3](${p.image3.substring(0, 40)}...) | ${p.confidence} |`);
});
