const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Fetching database products to compare image fields...');
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, brand, specs, image, image2, image3')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching database products:', error.message);
    process.exit(1);
  }

  const catalogPath = path.join(__dirname, 'final_consolidated_catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const imageChanges = [];

  catalog.forEach(catItem => {
    const dbItem = dbProducts.find(db => db.id === catItem.id);
    if (!dbItem) return;

    const changes = {};
    if (dbItem.image !== catItem.image) {
      changes.image = { old: dbItem.image, new: catItem.image };
    }
    if (dbItem.image2 !== catItem.image2) {
      changes.image2 = { old: dbItem.image2, new: catItem.image2 };
    }
    if (dbItem.image3 !== catItem.image3) {
      changes.image3 = { old: dbItem.image3, new: catItem.image3 };
    }

    if (Object.keys(changes).length > 0) {
      imageChanges.push({
        id: catItem.id,
        name: catItem.name,
        brand: catItem.brandFinal,
        model: catItem.modelFinal,
        changes
      });
    }
  });

  console.log(`Found ${imageChanges.length} products with image differences.`);

  // Generate markdown report
  let md = `# Relatório de Auditoria e Alterações de Imagens\n\n`;
  md += `Este relatório apresenta todos os produtos que terão seus links de imagem (\`image\`, \`image2\` e/ou \`image3\`) atualizados no banco de dados. \n`;
  md += `Todas as imagens foram validadas localmente para garantir compatibilidade com a marca final e modelo do produto, priorizando os domínios oficiais e varejistas brasileiros (KaBuM, Pichau, Terabyte).\n\n`;
  md += `Total de produtos com alteração de imagem: **${imageChanges.length}**\n\n`;

  md += `| ID | Produto | Campo | URL Anterior | Nova URL Sugerida | Motivo / Domínio |\n`;
  md += `| :-: | :--- | :---: | :--- | :--- | :--- |\n`;

  imageChanges.forEach(p => {
    Object.entries(p.changes).forEach(([field, change]) => {
      const oldStr = !change.old || change.old === 'Pendente' || change.old === 'Não Encontrado' ? '*(vazio/invalido)*' : `[Link](${change.old})`;
      const newStr = `**[Nova Link](${change.new})**`;
      
      let reason = 'Atualização para domínio de alta confiança';
      if (change.old && change.old.includes('placeholder')) {
        reason = 'Remoção de placeholder';
      }
      
      // Highlight our latest brand mismatches resolved in this turn
      if (p.id === 2 && field === 'image3') {
        reason = '⚠️ **Correção: Remoção de imagem PNY em produto Galax**';
      } else if (p.id === 19 && (field === 'image2' || field === 'image3')) {
        reason = '⚠️ **Correção: Remoção de imagem Sapphire em produto Gigabyte**';
      } else if (p.id === 21 && field === 'image3') {
        reason = '⚠️ **Correção: Remoção de imagem PNY em produto Gigabyte**';
      } else if (p.id === 90 && (field === 'image2' || field === 'image3')) {
        reason = '⚠️ **Correção: Remoção de imagem Redragon/Keychron em produto Logitech**';
      } else if (change.old && (change.old.includes('mlstatic.com') || change.old.includes('gstatic.com'))) {
        reason = 'Remoção de domínio não permitido (Mercado Livre / Google Shopping)';
      }

      md += `| **${p.id}** | ${p.name} (${p.brand}) | \`${field}\` | ${oldStr} | ${newStr} | ${reason} |\n`;
    });
  });

  const reportPath = path.join(__dirname, 'image_comparison_report.md');
  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`Report written to ${reportPath}`);

  // Write a copy to the brain artifacts directory too
  const brainDir = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda';
  fs.writeFileSync(path.join(brainDir, 'image_comparison_report.md'), md, 'utf-8');
  console.log(`Report copied to brain artifact directory.`);
}

main().catch(console.error);
