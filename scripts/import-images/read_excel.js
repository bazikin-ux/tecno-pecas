const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\produtos_prontos_para_importar_v2.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total rows:', data.length);
console.log('Sample of first 20 rows:');
data.slice(0, 20).forEach((row, index) => {
  console.log(`[${index + 1}] Nome: "${row['Nome']}" | Preço: "${row['Preço']}" | Categoria: "${row['Categoria']}" | Status: "${row['Status']}" | Observações: "${row['Observações']}"`);
});
