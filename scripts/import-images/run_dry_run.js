const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: Credenciais do Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDryRun() {
  console.log('Buscando produtos atuais do Supabase...');
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Erro ao buscar dados do Supabase:', error.message);
    process.exit(1);
  }

  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  console.log(`Carregados ${catalog.length} produtos do catálogo local.`);
  console.log(`Carregados ${dbProducts.length} produtos do banco de dados.\n`);

  // 1. Confirm that all IDs in the catalog exist in the DB
  const missingIds = [];
  catalog.forEach(item => {
    const exists = dbProducts.some(dbItem => dbItem.id === item.id);
    if (!exists) {
      missingIds.push(item.id);
    }
  });

  const allExist = missingIds.length === 0;
  console.log('=== CONFIRMAÇÃO DE IDS ===');
  if (allExist) {
    console.log('✔ Confirmação: Todos os 100 IDs do catálogo existem no Supabase.');
  } else {
    console.error(`❌ ERRO: Os seguintes IDs do catálogo NÃO existem no Supabase: ${missingIds.join(', ')}`);
  }

  // 2. Track changes
  let updatedCount = 0;
  const updatesLog = [];

  catalog.forEach(item => {
    const dbItem = dbProducts.find(x => x.id === item.id);
    if (dbItem) {
      const changes = {};
      
      // Price check
      const oldPrice = dbItem.price;
      const newPrice = item.priceFinal;
      if (oldPrice !== newPrice) {
        changes.price = { antes: oldPrice, depois: newPrice };
      }

      // Brand check
      const oldBrand = dbItem.brand;
      const newBrand = item.brandFinal;
      if (oldBrand !== newBrand) {
        changes.brand = { antes: oldBrand, depois: newBrand };
      }

      // Specs check
      const oldSpecs = (dbItem.specs || '').trim();
      const newSpecs = (item.modelFinal || '').trim();
      if (oldSpecs !== newSpecs) {
        changes.specs = { antes: oldSpecs, depois: newSpecs };
      }

      // Image2 check
      const oldImg2 = dbItem.image2;
      const newImg2 = item.image2;
      if (oldImg2 !== newImg2) {
        changes.image2 = { antes: oldImg2, depois: newImg2 };
      }

      // Image3 check
      const oldImg3 = dbItem.image3;
      const newImg3 = item.image3;
      if (oldImg3 !== newImg3) {
        changes.image3 = { antes: oldImg3, depois: newImg3 };
      }

      if (Object.keys(changes).length > 0) {
        updatedCount++;
        updatesLog.push({
          id: item.id,
          name: item.name,
          changes
        });
      }
    }
  });

  console.log(`\n=== ESTATÍSTICA DE ATUALIZAÇÃO ===`);
  console.log(`Produtos a serem atualizados: ${updatedCount} de ${catalog.length}`);
  
  // Fields to update list
  console.log('\n=== LISTA DE CAMPOS QUE SERÃO ALTERADOS ===');
  console.log('- price (Preço final simulado)');
  console.log('- brand (Marca final comercial)');
  console.log('- specs (Modelo final / especificações)');
  console.log('- image2 (Segunda imagem de alta confiança)');
  console.log('- image3 (Terceira imagem de alta confiança)');

  // 3. Generate Markdown Report
  let md = `# Relatório de Simulação de Atualização (Dry-Run)\n\n`;
  md += `Este relatório apresenta a simulação detalhada de atualização do catálogo na base do Supabase.\n\n`;
  
  md += `## 1. Confirmação de Consistência\n`;
  md += `- **Todos os 100 IDs existem no Supabase?**: ${allExist ? '✔ Sim, 100% dos IDs confirmados.' : '❌ Não (IDs em falta: ' + missingIds.join(', ') + ')'}\n`;
  md += `- **Total de Produtos a serem atualizados**: ${updatedCount} produtos.\n`;
  md += `- **Campos alterados**: \`price\`, \`brand\`, \`specs\`, \`image2\`, \`image3\`\n\n`;

  md += `## 2. Exemplo de Antes/Depois (Primeiros 10 Produtos)\n\n`;

  // First 10 products before/after comparison
  const sample10 = catalog.slice(0, 10);
  sample10.forEach(item => {
    const dbItem = dbProducts.find(x => x.id === item.id);
    const itemChanges = updatesLog.find(x => x.id === item.id);
    
    md += `### ID **${item.id}** - ${item.name}\n`;
    if (!itemChanges) {
      md += `*Nenhuma alteração detectada para este produto.*\n\n`;
      return;
    }

    md += `| Campo | Valor no Supabase (Antes) | Novo Valor Sugerido (Depois) | Status |\n`;
    md += `| :--- | :--- | :--- | :---: |\n`;

    const fields = ['price', 'brand', 'specs', 'image2', 'image3'];
    fields.forEach(field => {
      const change = itemChanges.changes[field];
      const fieldDbVal = dbItem[field] === null ? 'null' : dbItem[field];
      const fieldJsonVal = field === 'specs' ? item.modelFinal : item[field === 'price' ? 'priceFinal' : field];
      
      if (change) {
        let antesStr = change.antes === null ? '*null*' : String(change.antes);
        let depoisStr = change.depois === null ? '*null*' : String(change.depois);
        
        // Truncate URLs for readability
        if (antesStr.startsWith('http')) antesStr = `[Link](${antesStr})`;
        if (depoisStr.startsWith('http')) depoisStr = `[Link](${depoisStr})`;
        
        md += `| **${field}** | ${antesStr} | **${depoisStr}** | 🟡 Alterado |\n`;
      } else {
        let valStr = String(fieldJsonVal);
        if (valStr.startsWith('http')) valStr = `[Link](${valStr})`;
        md += `| **${field}** | ${valStr} | ${valStr} | ✔ Mantido |\n`;
      }
    });
    md += `\n`;
  });

  md += `## 3. Resumo de Todas as Alterações Planejadas (100 Produtos)\n\n`;
  md += `| ID | Produto | Alterações Planejadas |\n`;
  md += `| :-: | :--- | :--- |\n`;

  updatesLog.forEach(u => {
    const changesKeys = Object.keys(u.changes).map(k => `\`${k}\``).join(', ');
    md += `| **${u.id}** | ${u.name} | Alteração nos campos: ${changesKeys} |\n`;
  });

  const artPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\dry_run_report.md';
  fs.writeFileSync(artPath, md, 'utf-8');
  console.log('\nRelatório Markdown de dry-run salvo em:', artPath);

  // Print first 10 compare directly to terminal for user review
  console.log('\n=== COMPARAÇÃO DOS PRIMEIROS 10 PRODUTOS ===');
  sample10.forEach(item => {
    const dbItem = dbProducts.find(x => x.id === item.id);
    const itemChanges = updatesLog.find(x => x.id === item.id);
    console.log(`\nID ${item.id}: "${item.name}"`);
    if (!itemChanges) {
      console.log('   (Sem alterações)');
      return;
    }
    Object.keys(itemChanges.changes).forEach(field => {
      const change = itemChanges.changes[field];
      console.log(`   - ${field}: "${change.antes}" -> "${change.depois}"`);
    });
  });
}

runDryRun().catch(console.error);
