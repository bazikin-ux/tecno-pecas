const fs = require('fs');
const path = require('path');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const allowedDomains = [
  'kabum.com.br',
  'images.kabum.com.br',
  'images2.kabum.com.br',
  'images3.kabum.com.br',
  'images4.kabum.com.br',
  'images5.kabum.com.br',
  'images6.kabum.com.br',
  'images7.kabum.com.br',
  'images8.kabum.com.br',
  'images9.kabum.com.br',
  'images0.kabum.com.br',
  'pichau.com.br',
  'media.pichau.com.br',
  'terabyteshop.com.br',
  'img.terabyteshop.com.br',
  'amd.com',
  'intel.com',
  'asus.com',
  'dlcdnwebimgs.asus.com',
  'dlcdnimgs.asus.com',
  'gigabyte.com',
  'static.gigabyte.com',
  'msi.com',
  'asset.msi.com',
  'storage-asset.msi.com',
  'corsair.com',
  'nvidia.com',
  'kingston.com',
  'logitech.com',
  'logitechg.com',
  'hyperx.com',
  'razer.com',
  'redragon.com',
  'redragon.com.br',
  'crucial.com',
  'wd.com',
  'westerndigital.com',
  'husky.com.br',
  'dt3.com.br',
  'dt3sports.com.br',
  'thunderx3.com',
  'risemode.com.br',
  'coolermaster.com',
  'lg.com',
  'seagate.com',
  'supabase.co'
];

const competingKeywords = {
  'asus': ['gigabyte', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'galax'],
  'gigabyte': ['asus', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'galax'],
  'msi': ['asus', 'gigabyte', 'asrock', 'biostar', 'maxsun', 'duex', 'galax'],
  'asrock': ['asus', 'gigabyte', 'msi', 'biostar', 'maxsun', 'duex', 'galax'],
  'galax': ['asus', 'gigabyte', 'msi', 'asrock', 'biostar', 'maxsun', 'duex'],
  'kingston': ['corsair', 'xpg', 'crucial', 'gskill'],
  'corsair': ['kingston', 'xpg', 'crucial', 'gskill'],
  'xpg': ['kingston', 'corsair', 'crucial', 'gskill'],
  'crucial': ['kingston', 'corsair', 'xpg', 'gskill']
};

function checkDomain(url) {
  if (!url) return false;
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return allowedDomains.some(d => domain === d || domain.endsWith('.' + d));
  } catch (e) {
    return false;
  }
}

function detectConflict(brand, url) {
  if (!url || !brand) return false;
  const b = brand.toLowerCase().trim();
  const u = url.toLowerCase();
  
  const competitors = competingKeywords[b];
  if (competitors) {
    for (const comp of competitors) {
      if (u.includes(comp)) {
        return `Conflito de marca: imagem contém referência à marca concorrente "${comp}" mas o produto é "${brand}".`;
      }
    }
  }
  return null;
}

function getBrandDomain(brand) {
  const b = (brand || '').toLowerCase();
  if (b.includes('amd')) return 'amd.com';
  if (b.includes('intel')) return 'intel.com';
  if (b.includes('asus')) return 'asus.com';
  if (b.includes('gigabyte')) return 'gigabyte.com';
  if (b.includes('msi')) return 'msi.com';
  if (b.includes('corsair')) return 'corsair.com';
  if (b.includes('nvidia')) return 'nvidia.com';
  if (b.includes('kingston')) return 'kingston.com';
  if (b.includes('logitech')) return 'logitech.com';
  if (b.includes('hyperx')) return 'hyperx.com';
  if (b.includes('razer')) return 'razer.com';
  if (b.includes('redragon')) return 'redragon.com.br';
  if (b.includes('crucial')) return 'crucial.com';
  if (b.includes('wd') || b.includes('western')) return 'wd.com';
  if (b.includes('seagate')) return 'seagate.com';
  if (b.includes('cooler master')) return 'coolermaster.com';
  if (b.includes('lg')) return 'lg.com';
  if (b.includes('husky')) return 'kabum.com.br';
  if (b.includes('dt3')) return 'dt3.com.br';
  if (b.includes('thunderx3')) return 'thunderx3.com';
  if (b.includes('rise mode')) return 'risemode.com.br';
  if (b.includes('mancer')) return 'pichau.com.br';
  return '';
}

async function searchImages(query) {
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
    return data.results || [];
  } catch (error) {
    return [];
  }
}

async function checkUrl(url, brand) {
  if (!url || !url.startsWith('http')) return false;
  if (url.toLowerCase().includes('supabase.co') || url.toLowerCase().includes('exemplo_') || url.toLowerCase().includes('placeholder')) {
    return false;
  }
  // Must belong to allowed domains
  if (!checkDomain(url)) return false;
  // Must not conflict with the brand
  if (detectConflict(brand, url)) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const mime = res.headers.get('content-type') || '';
      if (mime.startsWith('image/') || mime.length === 0) {
        return true;
      }
    }
    
    // GET fallback
    const getController = new AbortController();
    const getTimeoutId = setTimeout(() => getController.abort(), 6000);
    const getRes = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': userAgent, 'Range': 'bytes=0-1023' },
      signal: getController.signal
    });
    clearTimeout(getTimeoutId);
    return getRes.ok;
  } catch (e) {
    return false;
  }
}

async function runCorrection() {
  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const issuesPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\image_audit_issues.json';
  const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf-8'));

  console.log(`Carregando ${issues.length} problemas de imagem para corrigir...`);

  const reportRows = [];

  for (let issue of issues) {
    console.log(`\nResolvendo ID ${issue.id} - ${issue.name} (${issue.field})`);
    console.log(`  Motivo do erro: ${issue.motivo}`);
    console.log(`  URL incorreta: ${issue.url.substring(0, 80)}...`);

    const item = catalog.find(x => x.id === issue.id);
    if (!item) continue;

    // Formulate queries
    const brandDomain = getBrandDomain(item.brandFinal);
    const queryModel = item.modelFinal || item.name;
    const queries = [
      `"${item.brandFinal} ${queryModel}" site:kabum.com.br`,
      `"${item.brandFinal} ${queryModel}" site:pichau.com.br`,
      `"${item.brandFinal} ${queryModel}" site:terabyteshop.com.br`
    ];
    if (brandDomain) {
      queries.push(`"${queryModel}" site:${brandDomain}`);
    }
    queries.push(`${item.brandFinal} ${queryModel} produto`);

    let candidates = [];
    for (const q of queries) {
      console.log(`    Pesquisando: "${q}"...`);
      const results = await searchImages(q);
      results.forEach(img => {
        if (img.image && !candidates.includes(img.image)) {
          candidates.push(img.image);
        }
      });
      await sleep(1500);
    }

    console.log(`    Encontradas ${candidates.length} candidatas. Validando contra regras...`);
    let foundUrl = '';
    
    // We want to avoid duplicates. Get existing urls in item
    const existingUrls = [item.image, item.image2, item.image3].filter(Boolean);

    for (const url of candidates) {
      const isAlreadyUsed = existingUrls.some(u => u === url);
      if (isAlreadyUsed) continue;

      const ok = await checkUrl(url, item.brandFinal);
      if (ok) {
        foundUrl = url;
        console.log(`      [OK] Escolhida: ${url}`);
        break;
      }
    }

    if (!foundUrl) {
      console.log(`      [AVISO] Não foi possível encontrar nova imagem compatível. Mantendo a atual ou escolhendo primeira válida.`);
      // Try to find any valid image of the brand even if not exact model
      for (const url of candidates) {
        if (await checkUrl(url, item.brandFinal)) {
          foundUrl = url;
          break;
        }
      }
    }

    if (foundUrl) {
      // Update catalog
      item[issue.field] = foundUrl;
      reportRows.push({
        id: issue.id,
        name: issue.name,
        campo: issue.field,
        oldUrl: issue.url,
        newUrl: foundUrl,
        motivo: issue.motivo
      });
    }
  }

  // Save the updated catalog
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log('\n[Sucesso] Catálogo atualizado localmente.');

  // Generate markdown report
  let md = `# Relatório de Auditoria e Correção de Imagens Incompatíveis\n\n`;
  md += `Este relatório detalha a auditoria final de imagens e a correção das URLs identificadas com problemas (placeholders, domínios não permitidos ou conflitos de marcas concorrentes).\n\n`;
  md += `| ID | Produto | Campo | image Atual (Incorreta) | Nova image Sugerida | Motivo da Substituição |\n`;
  md += `| :-: | :--- | :---: | :--- | :--- | :--- |\n`;

  reportRows.forEach(r => {
    let oldStr = r.oldUrl === 'Não Encontrado' ? 'Não Encontrado' : `[Link](${r.oldUrl})`;
    let newStr = `**[Nova Link](${r.newUrl})**`;
    md += `| **${r.id}** | ${r.name} | \`${r.campo}\` | ${oldStr} | ${newStr} | ${r.motivo} |\n`;
  });

  const repPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\image_audit_correction_report.md';
  fs.writeFileSync(repPath, md, 'utf-8');
  console.log('Saved image correction report to:', repPath);
}

runCorrection().catch(console.error);
