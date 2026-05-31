const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('=== RUNNING BACKUP AND UPDATE FOR 19 PRODUCTS ===');

  // Load dry run changes to identify the 19 products
  const changesJsonPath = path.join(__dirname, 'dry_run_changes.json');
  if (!fs.existsSync(changesJsonPath)) {
    console.error('Error: dry_run_changes.json not found. Run dry_run_all_changes.js first.');
    process.exit(1);
  }
  const dryRunChanges = JSON.parse(fs.readFileSync(changesJsonPath, 'utf-8'));
  const targetIds = dryRunChanges.map(p => p.id);

  if (targetIds.length === 0) {
    console.log('No changes found. Database is already up-to-date.');
    process.exit(0);
  }

  // 1. Fetch current database state for these 19 products to create a backup
  console.log(`1. Fetching current records for the ${targetIds.length} target products...`);
  const { data: dbProducts, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .in('id', targetIds)
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('Error fetching products for backup:', fetchError.message);
    process.exit(1);
  }

  // 2. Save the backup as JSON
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup_19_products_${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);
  fs.writeFileSync(backupFilePath, JSON.stringify(dbProducts, null, 2), 'utf-8');

  console.log('✔ BACKUP CREATED SUCCESSFULLY:');
  console.log(`-> Path: ${backupFilePath}\n`);

  // Load consolidated catalog
  const catalogPath = path.join(__dirname, 'final_consolidated_catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const reportRows = [];
  let updatedCount = 0;
  let errorCount = 0;

  console.log('3. Updating products in Supabase...');

  for (const item of dryRunChanges) {
    const catalogItem = catalog.find(p => p.id === item.id);
    if (!catalogItem) {
      console.warn(`Warning: Product ID ${item.id} not found in catalog.`);
      continue;
    }

    const updateData = {};
    item.changes.forEach(change => {
      updateData[change.field] = change.newVal;
    });

    console.log(`Updating ID ${item.id} ("${item.name}")...`);
    
    // Update Supabase
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', item.id);

    if (updateError) {
      errorCount++;
      console.error(`❌ Error updating ID ${item.id}:`, updateError.message);
      
      // Save errors to report
      item.changes.forEach(change => {
        reportRows.push({
          id: item.id,
          name: item.name,
          field: change.field,
          oldVal: change.oldVal,
          newVal: change.newVal,
          status: `❌ ERRO: ${updateError.message}`
        });
      });
      
      console.log('\n[!] Execution stopped due to error.');
      break;
    }

    updatedCount++;
    item.changes.forEach(change => {
      reportRows.push({
        id: item.id,
        name: item.name,
        field: change.field,
        oldVal: change.oldVal,
        newVal: change.newVal,
        status: '✔ Sucesso'
      });
    });
  }

  // Generate markdown report
  let md = `# Relatório de Atualização das Imagens (19 Produtos)\n\n`;
  md += `Este relatório apresenta o resultado da atualização das imagens para os 19 produtos modificados no Supabase.\n\n`;
  md += `* **Backup Salvo Em**: \`${backupFilePath}\`\n`;
  md += `* **Produtos Atualizados com Sucesso**: ${updatedCount}\n`;
  md += `* **Erros**: ${errorCount}\n\n`;

  md += `| ID | Produto | Campo Alterado | URL Antiga | URL Nova | Status |\n`;
  md += `| :-: | :--- | :---: | :--- | :--- | :---: |\n`;

  reportRows.forEach(r => {
    let oldStr = !r.oldVal ? '*(vazio)*' : `[Link](${r.oldVal})`;
    let newStr = `**[Nova Link](${r.newVal})**`;
    md += `| **${r.id}** | ${r.name} | \`${r.field}\` | ${oldStr} | ${newStr} | ${r.status} |\n`;
  });

  const brainDir = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda';
  const finalReportPath = path.join(brainDir, 'final_update_images_report.md');
  fs.writeFileSync(finalReportPath, md, 'utf-8');

  console.log(`\n✔ Final update report saved to ${finalReportPath}`);
  console.log(`Updated products: ${updatedCount}, Errors: ${errorCount}`);
}

main().catch(console.error);
