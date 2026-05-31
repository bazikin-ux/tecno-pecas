const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('=== STANDARDIZING MAIN IMAGE (IMAGE) FOR 91 PRODUCTS ===');

  const proposalsPath = path.join(__dirname, 'image_standardization_proposals.json');
  if (!fs.existsSync(proposalsPath)) {
    console.error('Error: image_standardization_proposals.json not found. Run audit_and_propose_main_images.js first.');
    process.exit(1);
  }
  const proposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf-8'));
  const targetIds = proposals.map(p => p.id);

  if (targetIds.length === 0) {
    console.log('No standardization proposals found.');
    process.exit(0);
  }

  // 1. Fetch current database state for these 91 products for backup
  console.log(`1. Fetching current records for the ${targetIds.length} products...`);
  const { data: dbProducts, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .in('id', targetIds)
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('Error fetching database products for backup:', fetchError.message);
    process.exit(1);
  }

  // 2. Save the backup as JSON
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup_91_main_images_${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);
  fs.writeFileSync(backupFilePath, JSON.stringify(dbProducts, null, 2), 'utf-8');

  console.log('✔ BACKUP CREATED SUCCESSFULLY:');
  console.log(`-> Path: ${backupFilePath}\n`);

  const reportRows = [];
  let updatedCount = 0;
  let errorCount = 0;

  console.log('3. Updating ONLY the "image" field in Supabase...');

  for (const prop of proposals) {
    const updateData = {
      image: prop.newImage
    };

    console.log(`[${updatedCount + 1}/${targetIds.length}] Updating image for ID ${prop.id}: "${prop.name}"`);
    
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', prop.id);

    if (updateError) {
      errorCount++;
      console.error(`❌ Error updating ID ${prop.id}:`, updateError.message);
      
      reportRows.push({
        id: prop.id,
        name: prop.name,
        oldImage: prop.oldImage,
        newImage: prop.newImage,
        status: `❌ ERRO: ${updateError.message}`
      });
      
      console.log('\n[!] Execution stopped due to error.');
      break;
    }

    updatedCount++;
    reportRows.push({
      id: prop.id,
      name: prop.name,
      oldImage: prop.oldImage,
      newImage: prop.newImage,
      status: '✔ Sucesso'
    });
  }

  // Generate markdown report
  let md = `# Relatório de Padronização da Imagem Principal (91 Produtos)\n\n`;
  md += `Este relatório apresenta o resultado da promoção e padronização da imagem principal (\`image\`) para os 91 produtos atualizados no Supabase.\n\n`;
  md += `* **Backup Salvo Em**: \`${backupFilePath}\`\n`;
  md += `* **Produtos Atualizados com Sucesso**: ${updatedCount}\n`;
  md += `* **Erros**: ${errorCount}\n\n`;

  md += `| ID | Produto | Imagem Antiga | Imagem Nova | Status |\n`;
  md += `| :-: | :--- | :--- | :--- | :---: |\n`;

  reportRows.forEach(r => {
    let oldStr = !r.oldImage ? '*(vazia)*' : `[Link](${r.oldImage})`;
    let newStr = `**[Nova Link](${r.newImage})**`;
    md += `| **${r.id}** | ${r.name} | ${oldStr} | ${newStr} | ${r.status} |\n`;
  });

  const brainDir = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda';
  const finalReportPath = path.join(brainDir, 'final_standardization_report.md');
  fs.writeFileSync(finalReportPath, md, 'utf-8');

  console.log(`\n✔ Final standardization report saved to ${finalReportPath}`);
  console.log(`Updated products: ${updatedCount}, Errors: ${errorCount}`);
}

main().catch(console.error);
