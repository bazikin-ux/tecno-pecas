const ExcelJS = require('exceljs');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const { downloadProductImage, sleep } = require('./image-scraper');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: Credenciais do Supabase não encontradas no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parsePrice(precoOrig, precoRef) {
  if (typeof precoOrig === 'number' && !isNaN(precoOrig)) {
    return precoOrig;
  }
  
  let valStr = '';
  if (precoOrig !== undefined && precoOrig !== null) valStr = precoOrig.toString();
  else if (precoRef !== undefined && precoRef !== null) valStr = precoRef.toString();
  
  if (!valStr) return 0;
  
  // Clean R$, spaces, and convert format (e.g. "R$ 4.599,90" -> "4599.90")
  let cleanStr = valStr.replace('R$', '').replace(/\s/g, '').trim();
  cleanStr = cleanStr.replace(/\./g, ''); // remove thousands dot
  cleanStr = cleanStr.replace(',', '.');  // change decimal comma to dot
  
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

function getMimeType(ext) {
  switch (ext) {
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    default: return 'image/jpeg';
  }
}

async function ensureBucket() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('Aviso ao listar buckets:', listError.message);
      return;
    }
    
    const bucketExists = buckets.some(b => b.name === 'products');
    if (!bucketExists) {
      console.log('Criando bucket "products" no Supabase...');
      const { error: createError } = await supabase.storage.createBucket('products', {
        public: true
      });
      if (createError) {
        console.error('Erro ao criar o bucket "products":', createError.message);
      } else {
        console.log('Bucket "products" criado e definido como público.');
      }
    }
  } catch (err) {
    console.warn('Erro ao garantir existência do bucket:', err.message);
  }
}

async function startProcessing() {
  await ensureBucket();

  const inputPath = 'C:\\Users\\Pichau\\Downloads\\planilha_modificacoes_apenas_itens_nao_verdes.xlsx';
  const outputPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\produtos_prontos_para_importar.xlsx';

  console.log(`Lendo planilha original via SheetJS de: ${inputPath}`);
  const inputWorkbook = XLSX.readFile(inputPath);
  const worksheet = inputWorkbook.Sheets['Modificações'];
  
  if (!worksheet) {
    console.error('Erro: Aba "Modificações" não encontrada na planilha original.');
    process.exit(1);
  }

  // Parse worksheet to array of arrays
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log(`Aba carregada. Total de linhas lidas: ${sheetData.length}`);

  // Output Workbook Setup (using exceljs for beautiful styled spreadsheet)
  const outputWorkbook = new ExcelJS.Workbook();
  const outSheet = outputWorkbook.addWorksheet('Produtos Prontos', { views: [{ showGridLines: true }] });

  outSheet.columns = [
    { header: 'Nome', key: 'nome', width: 35 },
    { header: 'Preço', key: 'preco', width: 15 },
    { header: 'Categoria', key: 'categoria', width: 22 },
    { header: 'Especificações', key: 'especificacoes', width: 45 },
    { header: 'URL Imagem Original', key: 'url_imagem_original', width: 40 },
    { header: 'URL Pública Supabase', key: 'url_publica_supabase', width: 40 },
    { header: 'Status', key: 'status', width: 22 },
    { header: 'Observações', key: 'observacoes', width: 35 }
  ];

  // Stylize Output headers
  const outHeaderRow = outSheet.getRow(1);
  outHeaderRow.height = 28;
  outHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' } // Navy Blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let countProcessed = 0;
  let countOk = 0;
  let countImageNotFound = 0;

  // Data rows in sheetData start at index 6 (Row 7)
  for (let r = 6; r < sheetData.length; r++) {
    const row = sheetData[r];
    if (!row || row.length === 0) continue;

    const idOriginal = row[0];
    const categoria = row[1];
    const produto = row[2]; // name
    
    if (!produto && !categoria && !idOriginal) {
      console.log(`Linha ${r + 1} vazia ou terminada. Pulando.`);
      continue;
    }

    countProcessed++;
    console.log(`\n[${countProcessed}] Processando produto: "${produto}" (Linha original ${r + 1})`);

    const precoOriginalVal = row[4];
    const precoPesquisadoVal = row[5];
    const especificacoes = row[6];

    const precoFinal = parsePrice(precoOriginalVal, precoPesquisadoVal);

    // Initial validation
    if (!produto || !categoria || !especificacoes || precoFinal <= 0) {
      console.log(`  -> Dados Incompletos!`);
      const rowData = {
        nome: produto || '[NOME AUSENTE]',
        preco: precoFinal,
        categoria: categoria || '[CATEGORIA AUSENTE]',
        especificacoes: especificacoes || '[ESPECIFICAÇÕES AUSENTES]',
        url_imagem_original: '',
        url_publica_supabase: '',
        status: 'DADOS_INCOMPLETOS',
        observacoes: 'Faltam campos críticos (nome, categoria, especificações ou preço).'
      };
      
      const addedRow = outSheet.addRow(rowData);
      applyRowStyle(addedRow, 'DADOS_INCOMPLETOS');
      continue;
    }

    // Try to search and download the image
    const imgResult = await downloadProductImage(produto, categoria);
    
    if (!imgResult.success) {
      console.log(`  -> Não foi possível obter imagem: ${imgResult.error}`);
      countImageNotFound++;
      
      const rowData = {
        nome: produto,
        preco: precoFinal,
        categoria: categoria,
        especificacoes: especificacoes,
        url_imagem_original: '',
        url_publica_supabase: '',
        status: 'IMAGEM_NAO_ENCONTRADA',
        observacoes: `Imagem não localizada na web. Erro: ${imgResult.error}`
      };
      
      const addedRow = outSheet.addRow(rowData);
      applyRowStyle(addedRow, 'IMAGEM_NAO_ENCONTRADA');
      
      // Delay before next request
      await sleep(1000);
      continue;
    }

    // Upload to Supabase Storage
    console.log(`  -> Fazendo upload para o Supabase Storage...`);
    const safeName = produto
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]/g, '-')                     // replace non-alphanumeric with -
      .replace(/-+/g, '-')                            // collapse multiple -
      .replace(/^-|-$/g, '')                          // trim leading/trailing -
      + '-' + Math.floor(Math.random() * 100000)      // random suffix to avoid collisions
      + imgResult.ext;

    const mime = getMimeType(imgResult.ext);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(`imported/${safeName}`, imgResult.buffer, {
        contentType: mime,
        upsert: true
      });

    if (uploadError) {
      console.error(`  -> Erro no upload: ${uploadError.message}`);
      const rowData = {
        nome: produto,
        preco: precoFinal,
        categoria: categoria,
        especificacoes: especificacoes,
        url_imagem_original: imgResult.originalUrl,
        url_publica_supabase: '',
        status: 'NECESSITA_REVISAO',
        observacoes: `Erro no upload do Supabase: ${uploadError.message}`
      };
      
      const addedRow = outSheet.addRow(rowData);
      applyRowStyle(addedRow, 'NECESSITA_REVISAO');
    } else {
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`imported/${safeName}`);
      console.log(`  -> Upload concluído. URL Pública: ${publicUrl}`);
      countOk++;

      const rowData = {
        nome: produto,
        preco: precoFinal,
        categoria: categoria,
        especificacoes: especificacoes,
        url_imagem_original: imgResult.originalUrl,
        url_publica_supabase: publicUrl,
        status: 'OK',
        observacoes: 'Processado com sucesso.'
      };
      
      const addedRow = outSheet.addRow(rowData);
      applyRowStyle(addedRow, 'OK');
    }

    // Save interval sleep
    await sleep(1500);
  }

  // Save the final Excel sheet
  console.log(`\nGravando planilha final em: ${outputPath}`);
  await outputWorkbook.xlsx.writeFile(outputPath);
  
  console.log('=== PROCESSAMENTO FINALIZADO ===');
  console.log(`Total de produtos lidos: ${countProcessed}`);
  console.log(`Produtos OK (Imagem importada): ${countOk}`);
  console.log(`Imagens não encontradas: ${countImageNotFound}`);
  console.log(`Outros status: ${countProcessed - countOk - countImageNotFound}`);
}

function applyRowStyle(row, status) {
  row.height = 20;
  row.getCell('preco').numFmt = '"R$ " #,##0.00';
  
  // Alignments
  row.getCell('preco').alignment = { horizontal: 'right', vertical: 'middle' };
  row.getCell('status').alignment = { horizontal: 'center', vertical: 'middle' };

  // Common font
  row.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10 };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    };
  });

  const statusCell = row.getCell('status');
  if (status === 'OK') {
    statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E4620' } };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
  } else if (status === 'IMAGEM_NAO_ENCONTRADA') {
    statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB71C1C' } };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
  } else if (status === 'DADOS_INCOMPLETOS') {
    statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF5D4037' } };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEBE9' } };
  } else if (status === 'NECESSITA_REVISAO') {
    statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF4A148C' } };
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E5F5' } };
  }
}

startProcessing().catch(console.error);
