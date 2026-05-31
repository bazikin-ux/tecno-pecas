const fs = require('fs');
const path = require('path');

const progressPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase3_batch_progress.json';
const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

const total = progress.length;
const identified = progress.filter(r => r.brandIdentified !== 'GENERICA' && r.brandIdentified !== 'Necessita Revisão').length;
const unidentified = progress.filter(r => r.brandIdentified === 'GENERICA' || r.brandIdentified === 'Necessita Revisão').length;

// Sort by ID
progress.sort((a, b) => a.id - b.id);

let md = `# Relatório de Validação de Marcas Atualizado — FASE 3 CONCLUÍDA (Tecno Peças)\n\n`;
md += `Este relatório apresenta a consolidação final do catálogo de **${total} produtos** após a execução da Fase 3.\n\n`;

md += `## 1. Resumo Métrico Final\n\n`;
md += `* **Quantidade Total de Produtos Processados**: ${total}\n`;
md += `* **Quantidade de Produtos com Marca Identificada**: ${identified}\n`;
md += `* **Quantidade de Produtos com Marca Sem Identificação (GENERICA)**: ${unidentified}\n\n`;

md += `## 2. Tabela Geral de Mapeamento\n\n`;
md += `| ID | Produto | Marca Identificada | Modelo Identificado | image2 (URL) | image3 (URL) | Confiança | Status |\n`;
md += `| :-: | :--- | :---: | :---: | :--- | :--- | :---: | :---: |\n`;

progress.forEach(r => {
  const isOk = r.status === 'Pronto para Importar';
  const statusStr = isOk ? '👍 Pronto para Importar' : '⚠️ Necessita Revisão';
  md += `| **${r.id}** | ${r.name} | ${r.brandIdentified} | ${r.modelIdentified} | [Link 2](${r.image2}) | [Link 3](${r.image3}) | ${r.confidence} | ${statusStr} |\n`;
});

const outPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\fase3_final_brand_validation.md';
fs.writeFileSync(outPath, md, 'utf-8');
console.log('Final Markdown report written to:', outPath);
console.log(`Summary: Total: ${total}, Identified: ${identified}, Unidentified: ${unidentified}`);
