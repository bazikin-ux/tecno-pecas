const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: Credenciais do Supabase não encontradas no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runUpdate() {
  console.log('==================================================');
  console.log('       INICIANDO EXECUÇÃO DE ATUALIZAÇÃO REAL     ');
  console.log('==================================================\n');

  // 1. Fetch current database state for backup
  console.log('1. Buscando registros atuais para Backup...');
  const { data: dbProducts, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('❌ ERRO ao buscar dados para backup:', fetchError.message);
    process.exit(1);
  }

  // 2. Save backup file
  const backupDir = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\backups';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup_products_final_${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFileName);
  
  fs.writeFileSync(backupPath, JSON.stringify(dbProducts, null, 2), 'utf-8');
  console.log('✔ BACKUP CRIADO COM SUCESSO:');
  console.log(`-> Path: ${backupPath}\n`);

  // 3. Load consolidated catalog
  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  console.log(`Carregado catálogo local com ${catalog.length} produtos.\n`);

  // 4. Update Loop
  let updatedCount = 0;
  let ignoredCount = 0;
  let errorCount = 0;
  const errorsList = [];

  console.log('Iniciando atualizações no Supabase...');

  for (let idx = 0; idx < catalog.length; idx++) {
    const item = catalog[idx];
    const dbItem = dbProducts.find(x => x.id === item.id);

    if (!dbItem) {
      console.warn(`  [Ignorado] ID ${item.id} não foi encontrado no Supabase.`);
      ignoredCount++;
      continue;
    }

    // Verify if changes are needed
    const hasChanges = 
      dbItem.price !== item.priceFinal ||
      dbItem.brand !== item.brandFinal ||
      dbItem.specs !== item.modelFinal ||
      dbItem.image2 !== item.image2 ||
      dbItem.image3 !== item.image3;

    if (!hasChanges) {
      ignoredCount++;
      continue;
    }

    // Perform Update
    const updateData = {
      price: item.priceFinal,
      brand: item.brandFinal,
      specs: item.modelFinal,
      image2: item.image2,
      image3: item.image3
    };

    console.log(`[${idx + 1}/100] Atualizando ID ${item.id}: "${item.name}"`);
    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', item.id);

    if (updateError) {
      errorCount++;
      errorsList.push({ id: item.id, name: item.name, error: updateError.message });
      console.error(`❌ ERRO ao atualizar ID ${item.id}:`, updateError.message);
      
      // Stop execution on first error as requested
      console.log('\n[!] OPERAÇÃO INTERROMPIDA devido a um erro.');
      break;
    }

    updatedCount++;
  }

  // 5. Output Final Report
  console.log('\n==================================================');
  console.log('                RELATÓRIO DE CONCLUSÃO             ');
  console.log('==================================================');
  console.log(`Total de Produtos Processados : ${catalog.length}`);
  console.log(`Produtos Atualizados Sucesso  : ${updatedCount}`);
  console.log(`Produtos Ignorados (Sem Alt.) : ${ignoredCount}`);
  console.log(`Produtos com Erros            : ${errorCount}`);

  if (errorCount > 0) {
    console.log('\nDetalhes de Erros Encontrados:');
    errorsList.forEach(e => {
      console.log(`- ID ${e.id} ("${e.name}"): ${e.error}`);
    });
    console.log('\n[FALHA] Atualização incompleta. Por favor, revise os erros acima.');
    process.exit(1);
  } else {
    console.log('\n[SUCESSO] Todos os produtos foram atualizados com sucesso no Supabase!');
  }
}

runUpdate().catch(console.error);
