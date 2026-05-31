const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Set DRY_RUN to false for real database import
const DRY_RUN = false;

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: Credenciais do Supabase não encontradas no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runImport() {
  console.log('==================================================');
  console.log(`INICIANDO SCRIPT DE IMPORTAÇÃO (DRY_RUN = ${DRY_RUN})`);
  console.log('==================================================\n');

  // 1. Fetch existing products from database
  console.log('Buscando produtos existentes no Supabase...');
  const { data: dbProducts, error: dbError } = await supabase
    .from('products')
    .select('*');

  if (dbError) {
    console.error('Erro ao buscar produtos existentes:', dbError.message);
    process.exit(1);
  }
  console.log(`Encontrados ${dbProducts.length} produtos cadastrados no banco de dados.\n`);

  // 2. Perform logical backup
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup_products_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(dbProducts, null, 2), 'utf-8');
  console.log(`[BACKUP LÓGICO] Backup dos produtos do banco de dados salvo em:`);
  console.log(`-> ${backupFile}\n`);

  // 3. Read spreadsheet
  const inputPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\produtos_prontos_para_importar_v2.xlsx';
  console.log(`Lendo planilha v2 de: ${inputPath}`);
  const workbook = XLSX.readFile(inputPath);
  const sheet = workbook.Sheets['Produtos Prontos'];
  if (!sheet) {
    console.error('Erro: Aba "Produtos Prontos" não encontrada na planilha.');
    process.exit(1);
  }

  const excelRows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Planilha carregada. Total de linhas para importar/atualizar: ${excelRows.length}\n`);

  // 4. Analysis and Simulation
  let toInsert = 0;
  let toUpdate = 0;
  let conflicts = 0;
  
  const insertList = [];
  const updateList = [];
  const conflictList = [];

  // Track duplicate names in the spreadsheet
  const seenInExcel = new Set();

  for (const item of excelRows) {
    const name = item['Nome'];
    const price = parseFloat(item['Preço']);
    const category = item['Categoria'];
    const specs = item['Especificações'];
    const imageUrl = item['URL Pública Supabase'];
    const statusExcel = item['Status'];
    const observacoes = item['Observações'];

    if (!name) {
      console.warn('  [Aviso] Linha sem nome de produto encontrada. Pulando.');
      continue;
    }

    // Check for duplicate in Excel
    if (seenInExcel.has(name.toLowerCase())) {
      conflictList.push({
        produto: name,
        tipo: 'Duplicidade na Planilha',
        detalhes: 'O produto está listado mais de uma vez na planilha Excel.'
      });
      conflicts++;
      continue;
    }
    seenInExcel.add(name.toLowerCase());

    // Map status from Excel to active boolean in DB
    const active = statusExcel === 'OK';

    // Find if product exists in DB (case-insensitive match)
    const existingDbProduct = dbProducts.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );

    const productData = {
      name,
      price,
      category,
      specs,
      image: imageUrl || null,
      stock: 22, // mandatory rule 6
      active
    };

    if (existingDbProduct) {
      // Check what fields would change
      const changes = [];
      if (existingDbProduct.price !== price) changes.push(`Preço: ${existingDbProduct.price} -> ${price}`);
      if (existingDbProduct.category !== category) changes.push(`Categoria: "${existingDbProduct.category}" -> "${category}"`);
      if (existingDbProduct.specs !== specs) changes.push(`Specs: "${existingDbProduct.specs}" -> "${specs}"`);
      if (existingDbProduct.image !== imageUrl) changes.push(`Imagem: "${existingDbProduct.image}" -> "${imageUrl}"`);
      if (existingDbProduct.stock !== 22) changes.push(`Estoque: ${existingDbProduct.stock} -> 22`);
      if (existingDbProduct.active !== active) changes.push(`Ativo: ${existingDbProduct.active} -> ${active}`);

      updateList.push({
        id: existingDbProduct.id,
        name,
        changes: changes.length > 0 ? changes : ['Nenhuma alteração detectada (valores idênticos)'],
        hasChanges: changes.length > 0,
        original: existingDbProduct,
        newData: productData
      });
      toUpdate++;
    } else {
      insertList.push({
        name,
        data: productData
      });
      toInsert++;
    }
  }

  // 5. Output Simulation Report
  console.log('==================================================');
  console.log('           RELATÓRIO DE SIMULAÇÃO (DRY-RUN)        ');
  console.log('==================================================');
  console.log(`\n1. Estatísticas de Importação:`);
  console.log(`   - Produtos a serem INSERIDOS (Novos): ${toInsert}`);
  console.log(`   - Produtos a serem ATUALIZADOS (Existentes): ${toUpdate}`);
  console.log(`   - Conflitos detectados: ${conflicts}`);

  console.log(`\n2. Detalhes de Conflitos:`);
  if (conflictList.length === 0) {
    console.log('   Nenhum conflito ou duplicidade encontrado.');
  } else {
    conflictList.forEach((c, idx) => {
      console.log(`   [${idx + 1}] Produto: "${c.produto}" | Conflito: ${c.tipo} | Detalhes: ${c.detalhes}`);
    });
  }

  console.log(`\n3. Campos que não existem na tabela "products" do Supabase:`);
  console.log('   - "URL Imagem Original" (Planilha) -> Não possui correspondente (descartado após upload)');
  console.log('   - "Status" (Planilha) -> Mapeado para o campo booleano "active" (OK = true, Outros = false)');
  console.log('   - "Observações" (Planilha) -> Apenas informativa (descartada)');

  console.log(`\n4. Simulação de Novas Inserções (exibindo primeiros 5):`);
  insertList.slice(0, 5).forEach((item, idx) => {
    console.log(`   - Novo [${idx + 1}]: "${item.name}" | Preço: R$ ${item.data.price} | Cat: "${item.data.category}" | Img: ${item.data.image ? 'Sim' : 'Não'}`);
  });
  if (insertList.length > 5) console.log(`     ... e mais ${insertList.length - 5} produtos.`);

  console.log(`\n5. Simulação de Atualizações (exibindo primeiras 5 com alterações):`);
  const updatesWithChanges = updateList.filter(u => u.hasChanges);
  if (updatesWithChanges.length === 0) {
    console.log('   Nenhuma alteração pendente para produtos existentes.');
  } else {
    updatesWithChanges.slice(0, 5).forEach((item, idx) => {
      console.log(`   - Atualização [${idx + 1}]: "${item.name}" (ID ${item.id})`);
      item.changes.forEach(c => console.log(`     * ${c}`));
    });
    if (updatesWithChanges.length > 5) console.log(`     ... e mais ${updatesWithChanges.length - 5} produtos.`);
  }

  // 6. DB execution logic (blocked by DRY_RUN)
  if (!DRY_RUN) {
    console.log('\n[EXECUÇÃO REAL] Iniciando importação no banco de dados...');
    
    // Perform inserts
    for (const item of insertList) {
      const { data, error } = await supabase
        .from('products')
        .insert(item.data);
      if (error) {
        console.error(`Erro ao inserir "${item.name}":`, error.message);
      }
    }

    // Perform updates
    for (const item of updateList) {
      const { data, error } = await supabase
        .from('products')
        .update(item.newData)
        .eq('id', item.id);
      if (error) {
        console.error(`Erro ao atualizar "${item.name}" (ID ${item.id}):`, error.message);
      }
    }
    console.log('\n[EXECUÇÃO REAL] Importação concluída com sucesso!');
  } else {
    console.log('\n[INFO] Nenhuma alteração foi gravada no banco de dados (Modo Dry-Run ativo).');
  }
}

runImport().catch(console.error);
