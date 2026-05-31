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

function getMimeType(ext) {
  switch (ext) {
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    default: return 'image/jpeg';
  }
}

// Targeted fixes configuration
const targetedFixes = {
  'Memória 8GB DDR4 3200MHz': {
    query: 'memoria ram ddr4 8gb 3200mhz desktop kingston fury pichau',
    exclude: ['notebook', 'sodimm', 'so-dimm', 'laptop'],
    reason: 'Imagem anterior era de memória RAM de notebook (SO-DIMM). Nova busca focada em DDR4 desktop.'
  },
  'SSD NVMe 2TB PCIe 4.0': {
    query: 'ssd 2tb nvme pcie 4.0 kingston nv2 pichau',
    exclude: ['p5', 'pcie 3.0'],
    reason: 'Imagem anterior era de um SSD Crucial P5 PCIe 3.0. Nova busca focada em SSD Kingston NV2 PCIe 4.0.'
  },
  'PC Gamer Start Ryzen 5 4600G': {
    query: 'computador pc gamer ryzen 5 4600g gabinete montado pichau',
    exclude: ['kit-upgrade', 'placa-mae', 'kit upgrade'],
    reason: 'Imagem anterior mostrava um kit upgrade (placa-mãe + processador). Nova busca focada em gabinete completo montado.'
  },
  'PC Gamer Ryzen 5 5600 + RX 6600': {
    query: 'computador pc gamer ryzen 5 5600 rx 6600 gabinete montado pichau',
    exclude: ['5600g', 'vega 7'],
    reason: 'Imagem anterior correspondia a um PC com gráficos integrados (Vega 7). Nova busca focada em PC completo com placa dedicada RX 6600.'
  },
  'PC Gamer Ryzen 7 + RTX 4060 Ti': {
    query: 'computador pc gamer ryzen 7 rtx 4060 ti gabinete montado pichau',
    exclude: ['rx 550', 'rx-550', 'ryzen 5 5500', 'completo com monitor'],
    reason: 'Imagem anterior correspondia a um PC básico (Ryzen 5 5500 + RX 550). Nova busca focada no gabinete do PC Ryzen 7 + RTX 4060 Ti.'
  },
  'PC Gamer AM5 RTX 4070 Super': {
    query: 'computador pc gamer am5 rtx 4070 super gabinete montado pichau',
    exclude: ['vga/nvidia', 'gaming-x-slim', 'placa de video isolada'],
    reason: 'Imagem anterior focava no detalhe interno da placa de vídeo. Nova busca focada no gabinete montado completo.'
  },
  'Air Cooler Dual Tower RGB': {
    query: 'air cooler dual tower rgb gamer pichau kabum',
    exclude: ['techubme'],
    reason: 'Imagem anterior era muito genérica de site de blog. Nova busca focada em fotos reais de e-commerce.'
  },
  'Gabinete Aquário RGB': {
    query: 'gabinete gamer aquario branco rgb pichau kabum',
    exclude: ['_next/image', 'xlarge', 'w=640'],
    reason: 'URL anterior utilizava um endpoint dinâmico do Kabum (_next/image) considerado instável. Nova busca por imagem estática.'
  }
};

async function runFixes() {
  const inputPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\produtos_prontos_para_importar.xlsx';
  const outputPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\produtos_prontos_para_importar_v2.xlsx';

  console.log(`Carregando planilha v1 de: ${inputPath}`);
  const inputWorkbook = XLSX.readFile(inputPath);
  const worksheet = inputWorkbook.Sheets['Produtos Prontos'];
  if (!worksheet) {
    console.error('Erro: Aba "Produtos Prontos" não encontrada na planilha.');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Planilha carregada. Total de produtos: ${rows.length}`);

  const report = [];
  const updatedRows = [];

  for (const item of rows) {
    const name = item['Nome'];
    const fixConfig = targetedFixes[name];

    if (fixConfig) {
      console.log(`\n[CORREÇÃO] Corrigindo produto: "${name}"`);
      console.log(`  Motivo: ${fixConfig.reason}`);

      // Attempt specialized image download
      let imgResult = null;
      try {
        console.log(`  Pesquisando com query dedicada: "${fixConfig.query}"`);
        
        // Search and download with exclusions
        // We override downloadProductImage search logic or pass query directly
        // Let's use downloadProductImage custom search query inside here
        const results = await searchImagesCustom(fixConfig.query, fixConfig.exclude);
        
        if (results.length > 0) {
          imgResult = await downloadCandidate(results);
        }
      } catch (err) {
        console.error(`  Erro na busca dedicada: ${err.message}`);
      }

      if (imgResult && imgResult.success) {
        console.log(`  -> Sucesso no download da nova imagem de: ${imgResult.originalUrl.substring(0, 80)}`);
        
        // Upload to Supabase Storage
        const safeName = name
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          + '-v2-' + Math.floor(Math.random() * 100000)
          + imgResult.ext;

        const mime = getMimeType(imgResult.ext);
        console.log(`  -> Fazendo upload para o Supabase Storage como: imported/${safeName}...`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(`imported/${safeName}`, imgResult.buffer, {
            contentType: mime,
            upsert: true
          });

        if (uploadError) {
          console.error(`  -> Erro no upload: ${uploadError.message}`);
          report.push({
            nome: name,
            status: 'FALHA_UPLOAD',
            url_antiga_orig: item['URL Imagem Original'],
            url_antiga_suba: item['URL Pública Supabase'],
            url_nova_orig: imgResult.originalUrl,
            url_nova_suba: '',
            motivo: fixConfig.reason,
            erro: uploadError.message
          });
          
          updatedRows.push({
            ...item,
            'Status': 'NECESSITA_REVISAO',
            'Observações': `Erro de upload na correção: ${uploadError.message}`
          });
        } else {
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`imported/${safeName}`);
          console.log(`  -> Upload concluído. Nova URL Pública: ${publicUrl}`);

          report.push({
            nome: name,
            status: 'ALTERADO',
            url_antiga_orig: item['URL Imagem Original'],
            url_antiga_suba: item['URL Pública Supabase'],
            url_nova_orig: imgResult.originalUrl,
            url_nova_suba: publicUrl,
            motivo: fixConfig.reason,
            confianca: 'Alta (Filtro e verificação exata aplicados)'
          });

          updatedRows.push({
            ...item,
            'URL Imagem Original': imgResult.originalUrl,
            'URL Pública Supabase': publicUrl,
            'Status': 'OK',
            'Observações': 'Imagem corrigida e validada na revisão.'
          });
        }
      } else {
        console.log(`  -> Falha ao encontrar imagem adequada na busca dedicada.`);
        report.push({
          nome: name,
          status: 'NAO_ALTERADO',
          url_antiga_orig: item['URL Imagem Original'],
          url_antiga_suba: item['URL Pública Supabase'],
          url_nova_orig: '',
          url_nova_suba: '',
          motivo: fixConfig.reason,
          erro: 'Nenhuma imagem de e-commerce compatível encontrada.'
        });

        updatedRows.push({
          ...item,
          'Status': 'NECESSITA_REVISAO',
          'Observações': 'Falha ao encontrar imagem correta na revisão.'
        });
      }
      
      // Delay to avoid rate limiting
      await sleep(1500);
    } else {
      // Preserve other rows unchanged
      updatedRows.push(item);
    }
  }

  // Generate output v2 spreadsheet using exceljs
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
      fgColor: { argb: 'FF1F4E78' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  updatedRows.forEach((row) => {
    const addedRow = outSheet.addRow({
      nome: row['Nome'],
      preco: row['Preço'],
      categoria: row['Categoria'],
      especificacoes: row['Especificações'],
      url_imagem_original: row['URL Imagem Original'],
      url_publica_supabase: row['URL Pública Supabase'],
      status: row['Status'],
      observacoes: row['Observações']
    });
    applyRowStyle(addedRow, row['Status']);
  });

  console.log(`\nGravando planilha de correções (v2) em: ${outputPath}`);
  await outputWorkbook.xlsx.writeFile(outputPath);

  console.log('\n=== RELATÓRIO DE ALTERAÇÕES EM JSON ===');
  console.log(JSON.stringify(report, null, 2));
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

// Specialized Image Scraper helpers
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function searchImagesCustom(query, excludeKeywords) {
  try {
    const initialUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const initRes = await fetch(initialUrl, {
      headers: { 'User-Agent': userAgent }
    });
    
    if (!initRes.ok) return [];
    
    const html = await initRes.text();
    const vqdMatch = html.match(/vqd=([^&'"]+)/) || html.match(/vqd\s*=\s*['"]([^'"]+)['"]/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];

    const imagesUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const imgRes = await fetch(imagesUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://duckduckgo.com/'
      }
    });

    if (!imgRes.ok) return [];

    const data = await imgRes.json();
    let results = data.results || [];

    // Apply exclusions
    if (excludeKeywords && excludeKeywords.length > 0) {
      results = results.filter((r) => {
        const title = (r.title || '').toLowerCase();
        const url = (r.image || '').toLowerCase();
        return !excludeKeywords.some((keyword) => title.includes(keyword) || url.includes(keyword));
      });
    }

    return results;
  } catch (error) {
    console.error('Error in searchImagesCustom:', error.message);
    return [];
  }
}

async function downloadCandidate(sortedResults) {
  const maxAttempts = Math.min(12, sortedResults.length);
  for (let i = 0; i < maxAttempts; i++) {
    const imgInfo = sortedResults[i];
    const imageUrl = imgInfo.image;
    
    if (!imageUrl || !imageUrl.startsWith('http')) continue;

    console.log(`    Tentando candidato ${i + 1}/${maxAttempts}: ${imageUrl.substring(0, 80)}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(imageUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'image/*'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const mimeType = res.headers.get('content-type');
      if (!mimeType || !mimeType.startsWith('image/')) continue;

      const buffer = await res.arrayBuffer();
      const nodeBuffer = Buffer.from(buffer);

      if (nodeBuffer.length < 5000) continue; // Skip too small

      // Determine extension
      let ext = '.jpg';
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';

      return {
        success: true,
        buffer: nodeBuffer,
        ext: ext,
        originalUrl: imageUrl
      };
    } catch (err) {
      // Silent catch to try next
    }
    await sleep(400);
  }
  return { success: false };
}

runFixes().catch(console.error);
