const fs = require('fs');
const path = require('path');

const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
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

const offDomainProducts = [];

catalog.forEach(item => {
  const isI2Ok = checkDomain(item.image2);
  const isI3Ok = checkDomain(item.image3);
  
  if (!isI2Ok || !isI3Ok) {
    offDomainProducts.push({
      id: item.id,
      name: item.name,
      image2: item.image2,
      image3: item.image3,
      i2Domain: item.image2 !== 'Não Encontrado' ? new URL(item.image2).hostname : 'N/A',
      i3Domain: item.image3 !== 'Não Encontrado' ? new URL(item.image3).hostname : 'N/A',
      i2Ok: isI2Ok,
      i3Ok: isI3Ok
    });
  }
});

console.log(`Found ${offDomainProducts.length} products with off-domain URLs.`);
console.log(JSON.stringify(offDomainProducts, null, 2));
