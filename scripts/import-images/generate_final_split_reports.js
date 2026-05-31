const fs = require('fs');
const path = require('path');

const originalReportPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase3_images_report.json';
const batchReportPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase3_batch_progress.json';

const originalData = JSON.parse(fs.readFileSync(originalReportPath, 'utf-8'));
const batchData = JSON.parse(fs.readFileSync(batchReportPath, 'utf-8'));

// Merge batch data
const merged = originalData.map(item => {
  const batchItem = batchData.find(b => b.id === item.id);
  return batchItem ? batchItem : item;
});

// Sort by ID
merged.sort((a, b) => a.id - b.id);

// Split into lists
const readyToUpdate = [];
const needsRevision = [];

let hasImagesCount = 0;
let missingImagesCount = 0;

merged.forEach(r => {
  const hasImage2 = r.image2 && r.image2 !== 'Pendente' && r.image2 !== 'Não Encontrado';
  const hasImage3 = r.image3 && r.image3 !== 'Pendente' && r.image3 !== 'Não Encontrado';
  
  const validImages = hasImage2 && hasImage3;
  if (validImages) {
    hasImagesCount++;
  } else {
    missingImagesCount++;
  }

  // Ready to update means: identified brand is not GENERICA, confidence is Alta, and images are valid
  const isBrandIdentified = r.brandIdentified && r.brandIdentified !== 'GENERICA' && r.brandIdentified !== 'Necessita Revisão';
  const isReady = isBrandIdentified && r.confidence === 'Alta' && validImages;

  if (isReady) {
    readyToUpdate.push(r);
  } else {
    needsRevision.push(r);
  }
});

// Write markdown report
let md = `# Relatório de Divisão e Status do Catálogo — FASE 3 (Tecno Peças)\n\n`;
md += `## 1. Estatísticas de Imagens e Segurança\n\n`;
md += `* **Produtos com image2 e image3 válidas**: ${hasImagesCount}\n`;
md += `* **Produtos sem imagens adicionais**: ${missingImagesCount}\n`;
md += `* **Produtos que podem ser atualizados com segurança agora**: ${readyToUpdate.length} (possuem marca mapeada e imagens adicionais válidas)\n`;
md += `* **Produtos pendentes de revisão**: ${needsRevision.length} (nomenclatura genérica ou falta de imagens/marca)\n\n`;

md += `## 2. LISTA 1: Produtos Prontos para Atualizar (${readyToUpdate.length} itens)\n\n`;
md += `| ID | Produto | Marca Identificada | Modelo Identificado | image2 (URL) | image3 (URL) | Fonte | Confiança | Status |\n`;
md += `| :-: | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :---: |\n`;
readyToUpdate.forEach(r => {
  md += `| **${r.id}** | ${r.name} | ${r.brandIdentified} | ${r.modelIdentified} | [Link 2](${r.image2}) | [Link 3](${r.image3}) | ${r.source} | ${r.confidence} | 👍 Pronto |\n`;
});
md += `\n`;

md += `## 3. LISTA 2: Produtos que Ainda Precisam de Revisão (${needsRevision.length} itens)\n\n`;
md += `| ID | Produto | Marca Identificada | Modelo Identificado | image2 (URL) | image3 (URL) | Fonte | Confiança | Status |\n`;
md += `| :-: | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :---: |\n`;
needsRevision.forEach(r => {
  md += `| **${r.id}** | ${r.name} | ${r.brandIdentified} | ${r.modelIdentified} | [Link 2](${r.image2}) | [Link 3](${r.image3}) | ${r.source} | ${r.confidence} | ⚠️ Revisar |\n`;
});

const outPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\final_split_validation_report.md';
fs.writeFileSync(outPath, md, 'utf-8');

console.log('--- STATS ---');
console.log('Valid Images:', hasImagesCount);
console.log('Missing Images:', missingImagesCount);
console.log('Ready to Update:', readyToUpdate.length);
console.log('Needs Revision:', needsRevision.length);

console.log('\n--- READY PREVIEW (FIRST 5) ---');
readyToUpdate.slice(0, 5).forEach(r => {
  console.log(`| **${r.id}** | ${r.name} | ${r.brandIdentified} | ${r.modelIdentified} | [Link 2](${r.image2.substring(0,25)}...) | [Link 3](${r.image3.substring(0,25)}...) | ${r.source} | ${r.confidence} | Pronto |`);
});

console.log('\n--- REVISION PREVIEW (FIRST 5) ---');
needsRevision.slice(0, 5).forEach(r => {
  console.log(`| **${r.id}** | ${r.name} | ${r.brandIdentified} | ${r.modelIdentified} | [Link 2](${r.image2.substring(0,25)}...) | [Link 3](${r.image3.substring(0,25)}...) | ${r.source} | ${r.confidence} | Revisar |`);
});
