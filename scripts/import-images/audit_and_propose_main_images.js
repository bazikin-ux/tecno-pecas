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
  'seagate.com'
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
        return `Conflito de marca com concorrente: "${comp}"`;
      }
    }
  }
  return null;
}

async function main() {
  console.log('Fetching database products...');
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, brand, specs, image, image2, image3')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching database:', error.message);
    process.exit(1);
  }

  const catalogPath = path.join(__dirname, 'final_consolidated_catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const proposals = [];

  catalog.forEach(catItem => {
    const dbItem = dbProducts.find(db => db.id === catItem.id);
    if (!dbItem) return;

    const brand = catItem.brandFinal;
    const model = catItem.modelFinal;
    
    // Evaluate the main image currently in catalog (since we'll write catalog's main image to Supabase if updated)
    const mainImg = catItem.image || '';
    const img2 = catItem.image2 || '';
    const img3 = catItem.image3 || '';

    const isPlaceholder = !mainImg || mainImg === 'Não Encontrado' || mainImg.toLowerCase().includes('placeholder') || mainImg.toLowerCase().includes('exemplo_');
    const isSupabaseStorage = mainImg.includes('supabase.co'); // supabase storage holds legacy / original main images uploaded directly
    const hasDomainConflict = !isPlaceholder && !checkDomain(mainImg) && !mainImg.includes('supabase.co');
    const hasBrandConflict = detectConflict(brand, mainImg);

    let needsReplacement = false;
    let motivoStr = '';

    if (isPlaceholder) {
      needsReplacement = true;
      motivoStr = 'Imagem atual é vazia ou placeholder';
    } else if (hasDomainConflict) {
      needsReplacement = true;
      motivoStr = 'Domínio de imagem principal não permitido';
    } else if (hasBrandConflict) {
      needsReplacement = true;
      motivoStr = hasBrandConflict;
    } else if (isSupabaseStorage) {
      // It is a legacy Supabase storage image. Let's check if we have a better quality image in image2 or image3.
      // A high-quality image is one from KaBuM, Pichau, Terabyte or the official manufacturer that does not have brand conflicts.
      const isImg2HighQual = img2 && checkDomain(img2) && !detectConflict(brand, img2);
      const isImg3HighQual = img3 && checkDomain(img3) && !detectConflict(brand, img3);

      if (isImg2HighQual || isImg3HighQual) {
        needsReplacement = true;
        motivoStr = 'Promoção de imagem oficial homologada (Kabum/Pichau/Terabyte)';
      }
    }

    if (needsReplacement) {
      // Find the best replacement from image2 and image3
      let selectedReplacement = '';
      let sourceField = '';

      const isImg2Valid = img2 && checkDomain(img2) && !detectConflict(brand, img2);
      const isImg3Valid = img3 && checkDomain(img3) && !detectConflict(brand, img3);

      if (isImg2Valid) {
        selectedReplacement = img2;
        sourceField = 'image2';
      } else if (isImg3Valid) {
        selectedReplacement = img3;
        sourceField = 'image3';
      }

      // If we found a valid replacement and it is DIFFERENT from the current main image
      if (selectedReplacement && selectedReplacement !== mainImg) {
        proposals.push({
          id: catItem.id,
          name: catItem.name,
          brand: brand,
          oldImage: mainImg,
          newImage: selectedReplacement,
          sourceField,
          motivo: motivoStr
        });
      }
    }
  });

  console.log(`Found ${proposals.length} proposals for main image standardization.`);

  // Generate markdown report
  let md = `# Relatório de Simulação de Padronização da Imagem Principal (Dry-Run)\n\n`;
  md += `Este relatório simula a promoção de imagens secundárias homologadas (\`image2\` ou \`image3\`) para a imagem principal (\`image\`) \n`;
  md += `quando a imagem principal atual for genérica, desatualizada (como links legados do Supabase storage) ou incompatível.\n\n`;
  md += `* **Total de produtos analisados**: 100\n`;
  md += `* **Produtos a serem padronizados**: ${proposals.length}\n`;
  md += `* **Produtos sem necessidade de troca**: ${100 - proposals.length}\n\n`;

  md += `### Tabela de Padronização Sugerida\n\n`;
  md += `| ID | Produto (Marca) | Imagem Principal Atual | Nova Imagem Sugerida | Origem | Motivo da Troca |\n`;
  md += `| :-: | :--- | :--- | :--- | :---: | :--- |\n`;

  proposals.forEach(p => {
    const oldStr = p.oldImage.startsWith('http') ? `[Link](${p.oldImage})` : p.oldImage || '*(vazia)*';
    const newStr = `**[Nova Link](${p.newImage})**`;
    md += `| **${p.id}** | ${p.name} (${p.brand}) | ${oldStr} | ${newStr} | \`${p.sourceField}\` | ${p.motivo} |\n`;
  });

  const reportPath = path.join(__dirname, 'main_image_standardization_report.md');
  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`Dry-run report saved to ${reportPath}`);

  // Copy to brain artifacts
  const brainDir = 'C:\\Users\\Pichau\\.gemini\\antigravity-cli\\brain\\918f2158-db9c-4602-940c-5108adaa5bda';
  fs.writeFileSync(path.join(brainDir, 'main_image_standardization_report.md'), md, 'utf-8');
  console.log('Dry-run report copied to brain artifacts directory.');

  // Save proposals JSON for the next step execution
  fs.writeFileSync(path.join(__dirname, 'image_standardization_proposals.json'), JSON.stringify(proposals, null, 2), 'utf-8');
}

main().catch(console.error);
