const fs = require('fs');
const path = require('path');

const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

const repPath = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda\\off_domain_replacements.md';
let replacedCount = 0;
if (fs.existsSync(repPath)) {
  const repContent = fs.readFileSync(repPath, 'utf-8');
  // Count table rows minus headers
  const lines = repContent.split('\n').filter(line => line.includes('|') && !line.includes('ID | Produto') && !line.includes(':-:'));
  replacedCount = lines.length * 2; // Each row had image2 and image3 checked/replaced
}

const officialRetailers = ['kabum.com.br', 'pichau.com.br', 'terabyteshop.com.br'];

const manufacturers = [
  'amd.com', 'intel.com', 'asus.com', 'gigabyte.com', 'msi.com', 'corsair.com',
  'nvidia.com', 'kingston.com', 'logitech.com', 'logitechg.com', 'hyperx.com', 'razer.com',
  'redragon.com', 'redragon.com.br', 'crucial.com', 'wd.com', 'westerndigital.com',
  'husky.com.br', 'dt3.com.br', 'dt3sports.com.br', 'thunderx3.com', 'risemode.com.br',
  'coolermaster.com', 'lg.com', 'seagate.com'
];

let retailCount = 0;
let mfgCount = 0;
let remainingReviewCount = 0;

function classifyUrl(url) {
  if (!url || url === 'Não Encontrado') return;
  try {
    const domain = new URL(url).hostname.toLowerCase();
    const isRetail = officialRetailers.some(d => domain === d || domain.endsWith('.' + d));
    if (isRetail) {
      retailCount++;
      return;
    }
    const isMfg = manufacturers.some(d => domain === d || domain.endsWith('.' + d));
    if (isMfg) {
      mfgCount++;
      return;
    }
    remainingReviewCount++;
  } catch (e) {
    remainingReviewCount++;
  }
}

catalog.forEach(item => {
  classifyUrl(item.image2);
  classifyUrl(item.image3);
});

console.log('=== METRICS RESULT ===');
console.log(`Replaced URLs           : ${replacedCount}`);
console.log(`Official Retailer URLs  : ${retailCount}`);
console.log(`Manufacturer URLs       : ${mfgCount}`);
console.log(`Remaining Needs Review  : ${remainingReviewCount}`);
