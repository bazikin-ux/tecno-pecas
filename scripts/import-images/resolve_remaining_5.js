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
  'asus': ['gigabyte', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx', 'palit'],
  'gigabyte': ['asus', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx', 'palit'],
  'msi': ['asus', 'gigabyte', 'asrock', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx', 'palit'],
  'asrock': ['asus', 'gigabyte', 'msi', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx', 'palit'],
  'galax': ['asus', 'gigabyte', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx', 'palit'],
  'kingston': ['corsair', 'xpg', 'crucial', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'corsair': ['kingston', 'xpg', 'crucial', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'xpg': ['kingston', 'corsair', 'crucial', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'crucial': ['kingston', 'corsair', 'xpg', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'redragon': ['mancer', 'logitech', 'hyperx', 'razer', 'corsair', 'steelseries', 'keychron'],
  'logitech': ['redragon', 'razer', 'hyperx', 'steelseries', 'corsair', 'keychron', 'mancer']
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
    console.error('Error searching DDG:', error);
    return [];
  }
}

async function checkUrl(url, brand) {
  if (!url || !url.startsWith('http')) return false;
  if (url.toLowerCase().includes('supabase.co') || url.toLowerCase().includes('exemplo_') || url.toLowerCase().includes('placeholder')) {
    return false;
  }
  if (!checkDomain(url)) return false;
  if (detectConflict(brand, url)) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
    return false;
  } catch (e) {
    return false;
  }
}

async function main() {
  const catalogPath = path.join(__dirname, 'final_consolidated_catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const targets = [
    { id: 2, field: 'image3', queries: ['"Galax RTX 4060 1-Click OC" site:kabum.com.br', '"Galax RTX 4060" site:terabyteshop.com.br', '"Galax GeForce RTX 4060" site:pichau.com.br'] },
    { id: 19, field: 'image2', queries: ['"Gigabyte RX 7700 XT" site:kabum.com.br', '"Gigabyte RX 7700 XT" site:terabyteshop.com.br', '"Gigabyte Radeon RX 7700 XT" site:pichau.com.br'] },
    { id: 19, field: 'image3', queries: ['"Gigabyte RX 7700 XT" site:kabum.com.br', '"Gigabyte RX 7700 XT" site:terabyteshop.com.br', '"Gigabyte Radeon RX 7700 XT" site:pichau.com.br'] },
    { id: 21, field: 'image3', queries: ['"Gigabyte RTX 4070 Super Windforce" site:kabum.com.br', '"Gigabyte RTX 4070 Super" site:terabyteshop.com.br', '"Gigabyte GeForce RTX 4070 Super" site:pichau.com.br'] },
    { id: 90, field: 'image2', queries: ['"Logitech G Pro X Superlight" site:kabum.com.br', '"Logitech G Pro X Superlight" site:terabyteshop.com.br', '"Logitech G Pro X Superlight" site:pichau.com.br'] },
    { id: 90, field: 'image3', queries: ['"Logitech G Pro X Superlight" site:kabum.com.br', '"Logitech G Pro X Superlight" site:terabyteshop.com.br', '"Logitech G Pro X Superlight" site:pichau.com.br'] }
  ];

  const report = [];

  for (const t of targets) {
    const item = catalog.find(p => p.id === t.id);
    if (!item) continue;
    console.log(`\nResolving Product ID ${t.id} - ${item.name} (${t.field})`);
    const oldUrl = item[t.field];
    let foundUrl = '';

    // Search and test candidates
    for (const q of t.queries) {
      console.log(`  Searching: "${q}"`);
      const results = await searchImages(q);
      console.log(`    Found ${results.length} search results.`);
      
      const usedUrls = [item.image, item.image2, item.image3, foundUrl].filter(Boolean);
      for (const res of results) {
        const candidate = res.image;
        if (usedUrls.includes(candidate)) continue;

        const isOk = await checkUrl(candidate, item.brandFinal);
        if (isOk) {
          foundUrl = candidate;
          break;
        }
      }
      if (foundUrl) break;
      await sleep(1500);
    }

    if (foundUrl) {
      console.log(`  ✔ Selected: ${foundUrl}`);
      item[t.field] = foundUrl;
      report.push({
        id: item.id,
        name: item.name,
        brand: item.brandFinal,
        field: t.field,
        oldUrl: oldUrl,
        newUrl: foundUrl,
        status: 'Substituída com sucesso'
      });
    } else {
      console.log(`  ❌ Failed to find a valid replacement for field ${t.field}.`);
      report.push({
        id: item.id,
        name: item.name,
        brand: item.brandFinal,
        field: t.field,
        oldUrl: oldUrl,
        newUrl: '',
        status: 'FALHA: Nenhuma imagem válida encontrada'
      });
    }
  }

  // Save changes
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log('\n✔ Catalog updated locally.');

  console.log('\n--- REPORT ---');
  console.log(JSON.stringify(report, null, 2));

  fs.writeFileSync(path.join(__dirname, 'remaining_5_resolution_report.json'), JSON.stringify(report, null, 2), 'utf-8');
}

main().catch(console.error);
