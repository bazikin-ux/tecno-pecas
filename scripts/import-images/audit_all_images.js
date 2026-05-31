const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  // Supabase storage domains are allowed for main image
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
  
  // Find competing keywords for this brand
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

async function runAudit() {
  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  // Fetch db to get main image
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, image')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching from Supabase:', error.message);
    process.exit(1);
  }

  const reports = [];

  catalog.forEach(item => {
    const dbItem = dbProducts.find(x => x.id === item.id);
    const mainImg = dbItem ? dbItem.image : '';

    const imgs = [
      { field: 'image', url: mainImg },
      { field: 'image2', url: item.image2 },
      { field: 'image3', url: item.image3 }
    ];

    imgs.forEach(img => {
      const isPlaceholder = !img.url || img.url === 'Não Encontrado' || img.url.toLowerCase().includes('exemplo_') || img.url.toLowerCase().includes('placeholder');
      const isAllowedDomain = checkDomain(img.url);
      const conflictMsg = detectConflict(item.brandFinal, img.url);

      if (isPlaceholder || !isAllowedDomain || conflictMsg) {
        let motivo = [];
        if (isPlaceholder) motivo.push('Placeholder / Inexistente');
        if (!isPlaceholder && !isAllowedDomain) motivo.push('Domínio não permitido');
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

  console.log(`=== IMAGE AUDIT COMPLETED ===`);
  console.log(`Found ${reports.length} image issues.`);
  console.log(JSON.stringify(reports, null, 2));
  
  // Save issues to a local json
  fs.writeFileSync('C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\image_audit_issues.json', JSON.stringify(reports, null, 2), 'utf-8');
}

runAudit().catch(console.error);
