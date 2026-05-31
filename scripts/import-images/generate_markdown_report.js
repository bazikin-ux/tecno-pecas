const fs = require('fs');
const path = require('path');

const reportPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\full_pricing_report.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const outPath = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda\\full_catalog_pricing.md';

let md = `# Relatório Geral de Precificação Dinâmica — Tecno Peças\n\n`;
md += `Este relatório apresenta a simulação de preços dinâmicos para **100% do catálogo (100 produtos)** cadastrados na base de dados.\n\n`;

md += `> [!NOTE]\n`;
md += `> **Status do Banco de Dados**: Nenhuma alteração foi realizada no banco. O banco permanece íntegro e sem modificações.\n\n`;

md += `## 1. Resumo Executivo\n\n`;
md += `- **Total de Produtos Processados**: ${report.totalProcessed}\n`;
md += `- **Produtos sem Marca Definida (GENERICA)**: ${report.noBrandDefined.length} de ${report.totalProcessed} (${(report.noBrandDefined.length / report.totalProcessed * 100).toFixed(0)}%)\n`;
md += `- **Produtos com Confiança Média ou Baixa**: ${report.lowOrMediumConfidence.length}\n`;
md += `- **Produtos que requerem Validação Manual de Preço**: ${report.needsManualValidation.length}\n\n`;

md += `## 2. Detalhamento por Categoria\n\n`;

for (const [categoryName, items] of Object.entries(report.categorizedResults)) {
  md += `### ${categoryName} (${items.length} produtos)\n\n`;
  md += `| ID | Produto | Preço de Custo/Médio | Margem Aplicada | Preço Sugerido | Lucro Estimado | Confiança | Competitividade |\n`;
  md += `| :-: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  
  items.forEach(item => {
    md += `| **${item.id}** | ${item.name} | R$ ${item.basePrice.toFixed(2)} | ${item.marginApplied} | **R$ ${item.suggestedPrice.toFixed(2)}** | R$ ${item.profit.toFixed(2)} | ${item.confidence} | ${item.competitorStatus} |\n`;
  });
  md += `\n`;
}

md += `## 3. Produtos com Confiança Média ou Baixa (Preço Estimado)\n\n`;
md += `Estes produtos possuem nomenclaturas genéricas na base de dados, o que dificulta a associação direta ao preço de um fabricante específico. Recomenda-se preencher a marca na Fase 2 para elevar o nível de confiança.\n\n`;
md += `| ID | Produto | Categoria | Preço de Referência | Confiança |\n`;
md += `| :-: | :--- | :---: | :---: | :---: |\n`;
report.lowOrMediumConfidence.forEach(item => {
  md += `| **${item.id}** | ${item.name} | ${item.category} | R$ ${item.basePrice.toFixed(2)} | **${item.confidence}** |\n`;
});
md += `\n`;

md += `## 4. Produtos que Necessitam de Validação Manual\n\n`;
md += `Estes itens possuem descrições de baixo custo ou alta variação mercadológica, exigindo revisão física de preços para evitar perda de competitividade ou margens negativas.\n\n`;
md += `| ID | Produto | Preço de Referência | Margem Aplicada | Novo Preço Sugerido | Justificativa |\n`;
md += `| :-: | :--- | :---: | :---: | :---: | :--- |\n`;
report.needsManualValidation.forEach(item => {
  md += `| **${item.id}** | ${item.name} | R$ ${item.basePrice.toFixed(2)} | ${item.marginApplied} | **R$ ${item.suggestedPrice.toFixed(2)}** | Nome genérico com alta oscilação no varejo |\n`;
});
md += `\n`;

md += `## 5. Produtos Sem Marca Definida (Marcados como GENERICA)\n\n`;
md += `Constatamos que **${report.noBrandDefined.length} produtos** estão cadastrados com a marca **"GENERICA"** no banco de dados. Isso será corrigido na **Fase 2 (Marcas e Especificações)**.\n`;

fs.writeFileSync(outPath, md, 'utf-8');
console.log('Markdown report generated successfully at:', outPath);
