const XLSX = require('xlsx');

const filePath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\produtos_prontos_para_importar.xlsx';
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Produtos Prontos'];
const data = XLSX.utils.sheet_to_json(sheet);

const targets = [
  'Memória 8GB DDR4 3200MHz',
  'SSD NVMe 2TB PCIe 4.0',
  'PC Gamer Start Ryzen 5 4600G',
  'PC Gamer Ryzen 5 5600 + RX 6600',
  'PC Gamer Ryzen 7 + RTX 4060 Ti',
  'PC Gamer AM5 RTX 4070 Super',
  'Air Cooler Dual Tower RGB',
  'Gabinete Aquário RGB'
];

console.log('=== TARGET PRODUCTS IN EXISTING SHEET ===');
data.forEach((row) => {
  const name = row['Nome'];
  if (targets.some(t => name && name.toLowerCase().includes(t.toLowerCase()))) {
    console.log(`- Nome: "${row['Nome']}"`);
    console.log(`  Preço: ${row['Preço']}`);
    console.log(`  Categoria: ${row['Categoria']}`);
    console.log(`  URL Original: ${row['URL Imagem Original']}`);
    console.log(`  URL Supabase: ${row['URL Pública Supabase']}`);
    console.log(`  Status: ${row['Status']}`);
  }
});
