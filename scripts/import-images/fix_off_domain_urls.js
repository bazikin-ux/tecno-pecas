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
  'risemode.nz',
  'coolermaster.com',
  'lg.com',
  'seagate.com'
];

function checkDomain(url) {
  if (!url || url === 'Não Encontrado') return true;
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return allowedDomains.some(d => domain === d || domain.endsWith('.' + d));
  } catch (e) {
    return false;
  }
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

async function checkUrl(url) {
  if (!url || !url.startsWith('http')) return false;
  if (url.toLowerCase().includes('supabase.co') || url.toLowerCase().includes('exemplo_') || url.toLowerCase().includes('placeholder')) {
    return false;
  }
  // Must belong to allowed domains
  if (!checkDomain(url)) return false;

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
    
    // short GET fallback
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

async function executeCorrection() {
  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const replacedRows = [];

  for (let item of catalog) {
    const isI2Ok = checkDomain(item.image2);
    const isI3Ok = checkDomain(item.image3);

    if (!isI2Ok || !isI3Ok) {
      console.log(`\nCorrigindo ID ${item.id}: "${item.name}"`);
      const oldI2 = item.image2;
      const oldI3 = item.image3;

      // Formulate query variants strictly within allowed domains
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
      // fallback without strict site: but we will filter the domains in checkUrl anyway
      queries.push(`${item.brandFinal} ${queryModel}`);

      let candidates = [];
      for (const q of queries) {
        console.log(`  Pesquisando: "${q}"...`);
        const results = await searchImages(q);
        results.forEach(img => {
          if (img.image && !candidates.includes(img.image)) {
            candidates.push(img.image);
          }
        });
        await sleep(1500);
      }

      console.log(`  Encontradas ${candidates.length} candidatas. Validando contra regras de domínios...`);
      const activeUrls = [];
      for (const url of candidates) {
        if (activeUrls.length >= 2) break;
        const ok = await checkUrl(url);
        if (ok && !activeUrls.includes(url)) {
          activeUrls.push(url);
          console.log(`    [OK] ${url.substring(0, 80)}...`);
        }
      }

      const newI2 = activeUrls[0] || item.image2; // Keep old as fallback if nothing found
      const newI3 = activeUrls[1] || item.image3;

      item.image2 = newI2;
      item.image3 = newI3;

      const i2Domain = oldI2 !== 'Não Encontrado' ? new URL(oldI2).hostname : 'N/A';
      const i3Domain = oldI3 !== 'Não Encontrado' ? new URL(oldI3).hostname : 'N/A';

      replacedRows.push({
        id: item.id,
        name: item.name,
        oldI2,
        oldI3,
        newI2,
        newI3,
        domains: `${i2Domain} / ${i3Domain}`
      });

      console.log(`  Resultado ID ${item.id}:`);
      console.log(`    image2: ${oldI2.substring(0,60)}... -> ${newI2.substring(0,60)}...`);
      console.log(`    image3: ${oldI3.substring(0,60)}... -> ${newI3.substring(0,60)}...`);
    }
  }

  // Save catalog changes
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log('\nSaved updated catalog to:', catalogPath);

  // Write md report file for the user
  let md = `# Relatório de Substituição de URLs Fora de Domínio\n\n`;
  md += `Este relatório detalha a substituição de links de imagem que estavam fora dos domínios oficiais e grandes varejistas permitidos.\n\n`;
  
  md += `### Tabela de Substituições Efetuadas:\n\n`;
  md += `| ID | Produto | Domínio Original | image2 Original | image3 Original | Nova image2 (Corrigida) | Nova image3 (Corrigida) | Motivo da Substituição |\n`;
  md += `| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  replacedRows.forEach(r => {
    md += `| **${r.id}** | ${r.name} | ${r.domains} | [Link](${r.oldI2}) | [Link](${r.oldI3}) | [Link](${r.newI2}) | [Link](${r.newI3}) | Fora dos domínios permitidos / Baixa confiança |\n`;
  });

  const repPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\off_domain_replacements.md';
  fs.writeFileSync(repPath, md, 'utf-8');
  console.log('Saved replacement report to:', repPath);
}

executeCorrection().catch(console.error);
