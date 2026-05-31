const fs = require('fs');
const path = require('path');

const brandReportPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\fase2_brand_report.json';
const brandReport = JSON.parse(fs.readFileSync(brandReportPath, 'utf-8'));

const outPath = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda\\brand_validation.md';

let md = `# Relatório de Validação de Marcas — Fase 2 (Tecno Peças)\n\n`;
md += `Este relatório apresenta os resultados da **Fase 2 (Marcas e Especificações Reais)** para os 100 produtos cadastrados.\n\n`;

md += `> [!NOTE]\n`;
md += `> **Status do Banco de Dados**: Nenhuma alteração foi efetuada. A coluna \`brand\` não foi atualizada.\n\n`;

md += `## 1. Resumo Executivo\n\n`;
const totalIdentified = brandReport.filter(r => r.brandIdentified !== 'Necessita Revisão').length;
const totalNeedRevision = brandReport.filter(r => r.brandIdentified === 'Necessita Revisão').length;

md += `- **Produtos Analisados**: ${brandReport.length}\n`;
md += `- **Marcas Mapeadas com Sucesso**: ${totalIdentified} de ${brandReport.length} (${(totalIdentified / brandReport.length * 100).toFixed(0)}%)\n`;
md += `- **Produtos que Necessitam Revisão Manual**: ${totalNeedRevision} de ${brandReport.length} (${(totalNeedRevision / brandReport.length * 100).toFixed(0)}%)\n\n`;

md += `## 2. Detalhes do Mapeamento de Marcas\n\n`;
md += `| ID | Produto | Marca Atual | Marca Identificada | Preço Final Sugerido | Confiança | Status |\n`;
md += `| :-: | :--- | :---: | :---: | :---: | :---: | :---: |\n`;

brandReport.forEach(r => {
  const isOk = r.status === 'Pronto para Importar';
  const statusStr = isOk ? '👍 Pronto para Importar' : '⚠️ Necessita Revisão';
  const brandStr = r.brandIdentified === 'Necessita Revisão' ? '**Necessita Revisão**' : r.brandIdentified;
  
  pricingStr = `R$ ${r.suggestedPrice.toFixed(2)}`;
  
  md += `| **${r.id}** | ${r.name} | ${r.brandAtual} | ${brandStr} | ${pricingStr} | ${r.confidence} | ${statusStr} |\n`;
});

fs.writeFileSync(outPath, md, 'utf-8');
console.log('Markdown report generated successfully at:', outPath);
