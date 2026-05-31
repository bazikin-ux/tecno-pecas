const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Fetching database products for dry-run comparison...');
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, brand, specs, price, image, image2, image3')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching database products:', error.message);
    process.exit(1);
  }

  const catalogPath = path.join(__dirname, 'final_consolidated_catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const dryRunReport = [];
  let productsWithChangesCount = 0;

  catalog.forEach(catItem => {
    const dbItem = dbProducts.find(db => db.id === catItem.id);
    if (!dbItem) return;

    const changes = [];

    // Check brand
    if (dbItem.brand !== catItem.brandFinal) {
      changes.push({
        field: 'brand',
        oldVal: dbItem.brand,
        newVal: catItem.brandFinal
      });
    }

    // Check specs (model)
    if (dbItem.specs !== catItem.modelFinal) {
      changes.push({
        field: 'specs',
        oldVal: dbItem.specs,
        newVal: catItem.modelFinal
      });
    }

    // Check price
    if (dbItem.price !== catItem.priceFinal) {
      changes.push({
        field: 'price',
        oldVal: dbItem.price,
        newVal: catItem.priceFinal
      });
    }

    // Check main image
    if (dbItem.image !== catItem.image) {
      changes.push({
        field: 'image',
        oldVal: dbItem.image,
        newVal: catItem.image
      });
    }

    // Check image2
    if (dbItem.image2 !== catItem.image2) {
      changes.push({
        field: 'image2',
        oldVal: dbItem.image2,
        newVal: catItem.image2
      });
    }

    // Check image3
    if (dbItem.image3 !== catItem.image3) {
      changes.push({
        field: 'image3',
        oldVal: dbItem.image3,
        newVal: catItem.image3
      });
    }

    if (changes.length > 0) {
      productsWithChangesCount++;
      dryRunReport.push({
        id: catItem.id,
        name: catItem.name,
        changes
      });
    }
  });

  console.log(`Total products with changes in DB: ${productsWithChangesCount}`);

  // Generate markdown report
  let md = `# Relatório de Simulação (Dry-Run) Final\n\n`;
  md += `Este relatório apresenta a simulação de atualização dos registros no banco de dados Supabase de acordo com o catálogo local final. \n\n`;
  md += `* **Total de produtos analisados**: 100\n`;
  md += `* **Produtos que sofrerão alteração**: ${productsWithChangesCount}\n`;
  md += `* **Produtos que permanecerão 100% intocados**: ${100 - productsWithChangesCount}\n\n`;

  md += `## Lista Detalhada de Alterações por Produto\n\n`;
  md += `| ID | Produto | Campo | Valor Atual (DB) | Novo Valor (Catálogo) |\n`;
  md += `| :-: | :--- | :---: | :--- | :--- |\n`;

  dryRunReport.forEach(p => {
    p.changes.forEach(c => {
      let oldDisp = c.oldVal === null || c.oldVal === undefined || c.oldVal === '' ? '*(vazio)*' : String(c.oldVal);
      let newDisp = c.newVal === null || c.newVal === undefined || c.newVal === '' ? '*(vazio)*' : String(c.newVal);

      // Truncate long URLs to make table readable
      if (oldDisp.startsWith('http')) {
        oldDisp = `[Link](${oldDisp})`;
      }
      if (newDisp.startsWith('http')) {
        newDisp = `**[Nova Link](${newDisp})**`;
      }

      md += `| **${p.id}** | ${p.name} | \`${c.field}\` | ${oldDisp} | ${newDisp} |\n`;
    });
  });

  const reportPath = path.join(__dirname, 'dry_run_detailed_changes.md');
  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`Dry-run report written to ${reportPath}`);

  // Copy to brain artifacts
  const brainDir = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda';
  fs.writeFileSync(path.join(brainDir, 'dry_run_detailed_changes.md'), md, 'utf-8');
  console.log('Dry-run report copied to brain artifacts directory.');
  
  // Write JSON comparison data for easy scripting/debugging
  fs.writeFileSync(path.join(__dirname, 'dry_run_changes.json'), JSON.stringify(dryRunReport, null, 2), 'utf-8');
}

main().catch(console.error);
