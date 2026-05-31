const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, 'final_consolidated_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

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
  'asus': ['gigabyte', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx'],
  'gigabyte': ['asus', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx'],
  'msi': ['asus', 'gigabyte', 'asrock', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx'],
  'asrock': ['asus', 'gigabyte', 'msi', 'biostar', 'maxsun', 'duex', 'galax', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx'],
  'galax': ['asus', 'gigabyte', 'msi', 'asrock', 'biostar', 'maxsun', 'duex', 'pny', 'zotac', 'powercolor', 'sapphire', 'xfx'],
  'kingston': ['corsair', 'xpg', 'crucial', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'corsair': ['kingston', 'xpg', 'crucial', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'xpg': ['kingston', 'corsair', 'crucial', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'crucial': ['kingston', 'corsair', 'xpg', 'gskill', 'adata', 'teamgroup', 'lexar', 'patriot'],
  'redragon': ['mancer', 'logitech', 'hyperx', 'razer', 'corsair', 'steelseries'],
  'logitech': ['redragon', 'razer', 'hyperx', 'steelseries', 'corsair'],
  'hyperx': ['redragon', 'logitech', 'razer', 'steelseries', 'corsair'],
  'razer': ['redragon', 'logitech', 'hyperx', 'steelseries', 'corsair']
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

const reports = [];

catalog.forEach(item => {
  const imgs = [
    { field: 'image', url: item.image },
    { field: 'image2', url: item.image2 },
    { field: 'image3', url: item.image3 }
  ];

  imgs.forEach(img => {
    if (!img.url) return;
    const isPlaceholder = img.url === 'Não Encontrado' || img.url.toLowerCase().includes('exemplo_') || img.url.toLowerCase().includes('placeholder');
    const isAllowedDomain = checkDomain(img.url);
    const conflictMsg = detectConflict(item.brandFinal, img.url);

    if (isPlaceholder || !isAllowedDomain || conflictMsg) {
      let motivo = [];
      if (isPlaceholder) motivo.push('Placeholder / Inexistente');
      if (!isPlaceholder && !isAllowedDomain) motivo.push('Domínio não permitido (' + new URL(img.url).hostname + ')');
      if (conflictMsg) motivo.push(conflictMsg);

      reports.push({
        id: item.id,
        name: item.name,
        brand: item.brandFinal,
        field: img.field,
        url: img.url,
        motivo: motivo.join(' | ')
      });
    }
  });
});

console.log(`=== LOCAL CATALOG IMAGE AUDIT ===`);
console.log(`Found ${reports.length} image issues in local catalog.`);
console.log(JSON.stringify(reports, null, 2));

fs.writeFileSync(path.join(__dirname, 'local_image_audit_issues.json'), JSON.stringify(reports, null, 2), 'utf-8');
