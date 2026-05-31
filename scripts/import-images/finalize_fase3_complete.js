const fs = require('fs');
const path = require('path');

const originalReportPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase3_images_report.json';
const batchReportPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase3_batch_progress.json';

const originalData = JSON.parse(fs.readFileSync(originalReportPath, 'utf-8'));
const batchData = JSON.parse(fs.readFileSync(batchReportPath, 'utf-8'));

// Merge batch data into original data based on id
const merged = originalData.map(item => {
  const batchItem = batchData.find(b => b.id === item.id);
  return batchItem ? batchItem : item;
});

const total = merged.length;
const identified = merged.filter(r => r.brandIdentified !== 'GENERICA' && r.brandIdentified !== 'Necessita Revisão').length;
const unidentified = merged.filter(r => r.brandIdentified === 'GENERICA' || r.brandIdentified === 'Necessita Revisão').length;

// Sort by ID
merged.sort((a, b) => a.id - b.id);

let md = `# Relatório de Validação de Marcas Atualizado — FASE 3 CONCLUÍDA (Tecno Peças)\n\n`;
md += `Este relatório apresenta a consolidação final do catálogo de **${total} produtos** após a execução de toda a Fase 3.\n\n`;

md += `## 1. Resumo Métrico Final\n\n`;
md += `* **Quantidade Total de Produtos Processados**: ${total}\n`;
md += `* **Quantidade de Produtos com Marca Identificada**: ${identified}\n`;
md += `* **Quantidade de Produtos com Marca Sem Identificação (GENERICA)**: ${unidentified}\n\n`;

md += `## 2. Tabela Geral de Mapeamento\n\n`;
md += `| ID | Produto | Marca Identificada | Modelo Identificado | image2 (URL) | image3 (URL) | Confiança | Status |\n`;
md += `| :-: | :--- | :---: | :---: | :--- | :--- | :---: | :---: |\n`;

merged.forEach(r => {
  const isOk = r.status === 'Pronto para Importar';
  const statusStr = isOk ? '👍 Pronto para Importar' : '⚠️ Necessita Revisão';
  md += `| **${r.id}** | ${r.name} | ${r.brandIdentified} | ${r.modelIdentified} | [Link 2](${r.image2}) | [Link 3](${r.image3}) | ${r.confidence} | ${statusStr} |\n`;
});

const outPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\fase3_final_brand_validation.md';
fs.writeFileSync(outPath, md, 'utf-8');
console.log('Final Markdown report written to:', outPath);
console.log(`Summary: Total: ${total}, Identified: ${identified}, Unidentified: ${unidentified}`);
