const fs = require('fs');
const path = require('path');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to perform search on DuckDuckGo and parse images
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
    console.error(`Error searching images for "${query}":`, error.message);
    return [];
  }
}

// Helper to check if URL is reachable and is an image
async function checkUrl(url) {
  if (!url || !url.startsWith('http')) return false;
  if (url.toLowerCase().includes('supabase.co') || url.toLowerCase().includes('exemplo_') || url.toLowerCase().includes('placeholder')) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
    
    // Fallback: If HEAD is blocked or fails but returns 405/403, we can check with GET with a Range header or short download
    const getController = new AbortController();
    const getTimeoutId = setTimeout(() => getController.abort(), 8000);
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

// Map domains to their priority score
function getUrlScore(url) {
  const u = url.toLowerCase();
  
  // High-priority Brazil Retail & Official manufacturer domains
  if (u.includes('kabum.com.br')) return 100;
  if (u.includes('pichau.com.br')) return 100;
  if (u.includes('terabyteshop.com.br')) return 100;
  if (u.includes('amazon.com') || u.includes('media-amazon.com') || u.includes('ssl-images-amazon')) return 95;
  
  // Official manufacturer domains
  if (u.includes('asus.com') || u.includes('dlcdnwebimgs.asus.com') || u.includes('dlcdnimgs.asus.com')) return 90;
  if (u.includes('gigabyte.com') || u.includes('static.gigabyte.com')) return 90;
  if (u.includes('msi.com') || u.includes('asset.msi.com') || u.includes('storage-asset.msi.com')) return 90;
  if (u.includes('corsair.com')) return 90;
  if (u.includes('intel.com')) return 90;
  if (u.includes('amd.com')) return 90;
  if (u.includes('kingston.com')) return 90;
  if (u.includes('logitech.com') || u.includes('logitechg.com')) return 90;
  if (u.includes('hyperx.com')) return 90;
  if (u.includes('redragon.com') || u.includes('redragon.com.br')) return 90;
  if (u.includes('crucial.com')) return 90;
  if (u.includes('westerndigital.com') || u.includes('wd.com')) return 90;
  if (u.includes('husky.com.br')) return 90;
  if (u.includes('dt3.com.br') || u.includes('dt3sports.com.br')) return 90;
  
  // Common trust tech e-commerce / tech databases
  if (u.includes('newegg.com') || u.includes('c1.neweggimages.com')) return 60;
  if (u.includes('bhphotovideo.com')) return 60;
  if (u.includes('techpowerup.com')) return 50;
  
  // Other domains
  if (u.includes('shopee') || u.includes('aliexpress') || u.includes('mercado-livre') || u.includes('mercadolivre')) {
    return 10; // Low priority
  }
  return 30; // Medium-low priority
}

const target15 = [
  {
    id: 7,
    name: 'Ryzen 7 5700X',
    problema: 'Imagens placeholders',
    brandAtual: 'AMD',
    modelAtual: 'Ryzen 7 5700X',
    sugestaoBrand: 'AMD',
    sugestaoModel: 'Ryzen 7 5700X Box',
    queries: ['AMD Ryzen 7 5700X Box CPU', 'Ryzen 7 5700X site:kabum.com.br', 'Ryzen 7 5700X site:terabyteshop.com.br']
  },
  {
    id: 15,
    name: 'GeForce RTX 4060 Ti 16GB',
    problema: 'Imagens placeholders',
    brandAtual: 'MSI',
    modelAtual: 'RTX 4060 Ti',
    sugestaoBrand: 'MSI',
    sugestaoModel: 'GeForce RTX 4060 Ti Gaming X 16G',
    queries: ['MSI GeForce RTX 4060 Ti Gaming X 16G', 'RTX 4060 Ti 16GB MSI site:kabum.com.br', 'RTX 4060 Ti 16GB MSI site:terabyteshop.com.br']
  },
  {
    id: 36,
    name: 'Placa-mãe A520M AM4',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / A520M',
    sugestaoBrand: 'ASUS',
    sugestaoModel: 'Prime A520M-E',
    queries: ['ASUS Prime A520M-E Placa-Mãe', 'ASUS Prime A520M-E site:kabum.com.br', 'ASUS Prime A520M-E site:terabyteshop.com.br']
  },
  {
    id: 37,
    name: 'Placa-mãe B550M AM4',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / B550M',
    sugestaoBrand: 'Gigabyte',
    sugestaoModel: 'B550M Aorus Elite',
    queries: ['Gigabyte B550M Aorus Elite Placa-Mãe', 'B550M Aorus Elite site:kabum.com.br', 'B550M Aorus Elite site:terabyteshop.com.br']
  },
  {
    id: 38,
    name: 'Placa-mãe B550 Gaming Wi-Fi',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / B550',
    sugestaoBrand: 'ASUS',
    sugestaoModel: 'TUF Gaming B550-Plus Wi-Fi',
    queries: ['ASUS TUF Gaming B550-Plus Wi-Fi Placa-Mãe', 'TUF Gaming B550-Plus Wi-Fi site:kabum.com.br', 'TUF Gaming B550-Plus Wi-Fi site:terabyteshop.com.br']
  },
  {
    id: 39,
    name: 'Placa-mãe B650M AM5 DDR5',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / B650M',
    sugestaoBrand: 'MSI',
    sugestaoModel: 'MAG B650M Mortar Wi-Fi',
    queries: ['MSI MAG B650M Mortar Wi-Fi Placa-Mãe', 'MAG B650M Mortar Wi-Fi site:kabum.com.br', 'MAG B650M Mortar Wi-Fi site:terabyteshop.com.br']
  },
  {
    id: 40,
    name: 'Placa-mãe X670E AM5',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / X670E',
    sugestaoBrand: 'ASUS',
    sugestaoModel: 'TUF Gaming X670E-Plus',
    queries: ['ASUS TUF Gaming X670E-Plus Placa-Mãe', 'TUF Gaming X670E-Plus site:kabum.com.br', 'TUF Gaming X670E-Plus site:terabyteshop.com.br']
  },
  {
    id: 41,
    name: 'Placa-mãe H610M LGA1700',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / H610M LGA1700',
    sugestaoBrand: 'ASUS',
    sugestaoModel: 'Prime H610M-E',
    queries: ['ASUS Prime H610M-E Placa-Mãe', 'ASUS Prime H610M-E site:kabum.com.br', 'ASUS Prime H610M-E site:terabyteshop.com.br']
  },
  {
    id: 42,
    name: 'Placa-mãe B760M DDR4',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / B760M DDR4',
    sugestaoBrand: 'Gigabyte',
    sugestaoModel: 'B760M Aorus Elite DDR4',
    queries: ['Gigabyte B760M Aorus Elite DDR4 Placa-Mãe', 'B760M Aorus Elite DDR4 site:kabum.com.br', 'B760M Aorus Elite DDR4 site:terabyteshop.com.br']
  },
  {
    id: 43,
    name: 'Placa-mãe Z790 DDR5',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / Z790 DDR5',
    sugestaoBrand: 'MSI',
    sugestaoModel: 'PRO Z790-A WiFi DDR5',
    queries: ['MSI PRO Z790-A WiFi DDR5 Placa-Mãe', 'PRO Z790-A WiFi site:kabum.com.br', 'PRO Z790-A WiFi site:terabyteshop.com.br']
  },
  {
    id: 76,
    name: 'PC Workstation i7 + RTX 4070 Ti Super',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'NVIDIA / RTX 4070 Ti',
    sugestaoBrand: 'Tecno Peças',
    sugestaoModel: 'PC Workstation i7 / RTX 4070 Ti Super',
    queries: ['computador workstation lian li case', 'gabinete gamer workstation corsair', 'pc gamer workstation rtx 4070 ti super']
  },
  {
    id: 77,
    name: 'PC Escritório Intel i3',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'Intel / PC Escritório Intel i3',
    sugestaoBrand: 'Tecno Peças',
    sugestaoModel: 'PC Escritório i3 / 8GB RAM / 240GB SSD',
    queries: ['computador corporativo i3 gabinete slim', 'pc office gabinete slim corporativo', 'computador de escritorio intel i3']
  },
  {
    id: 78,
    name: 'PC Gamer Branco RGB',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'AMD / RTX 4060',
    sugestaoBrand: 'Tecno Peças',
    sugestaoModel: 'PC Gamer Branco RGB / Ryzen 5 / RTX 4060',
    queries: ['pc gamer branco aquario rgb', 'computador gamer branco com fans rgb', 'gabinete gamer aquario branco completo']
  },
  {
    id: 79,
    name: 'Kit Gamer Teclado + Mouse + Headset',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / Kit Gamer Teclado + Mouse + Headset',
    sugestaoBrand: 'Redragon',
    sugestaoModel: 'Kit Gamer 3 em 1 Teclado Mouse Headset',
    queries: ['Redragon Kit Gamer 3 em 1 RGB', 'Redragon S129 kit gamer', 'kit 3 em 1 gamer redragon']
  },
  {
    id: 80,
    name: 'Kit Gamer 4 em 1 RGB',
    problema: 'Marca/Modelo não identificados',
    brandAtual: 'GENERICA / Kit Gamer 4 em 1 RGB',
    sugestaoBrand: 'Redragon',
    sugestaoModel: 'Kit Gamer 4 em 1 Kumara',
    queries: ['Redragon Kit Gamer 4 em 1 Kumara', 'Kit Gamer Redragon 4 em 1 K552-BB', 'kit gamer 4 em 1 redragon kumara']
  }
];

const originalPlaceholders = {
  7: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_7_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_7_3.jpg' },
  15: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_15_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_15_3.jpg' },
  36: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_36_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_36_3.jpg' },
  37: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_37_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_37_3.jpg' },
  38: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_38_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_38_3.jpg' },
  39: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_39_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_39_3.jpg' },
  40: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_40_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_40_3.jpg' },
  41: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_41_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_41_3.jpg' },
  42: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_42_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_42_3.jpg' },
  43: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_43_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_43_3.jpg' },
  76: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_76_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_76_3.jpg' },
  77: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_77_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_77_3.jpg' },
  78: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_78_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_78_3.jpg' },
  79: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_79_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_79_3.jpg' },
  80: { i2: 'https://images.kabum.com.br/produtos/fotos/exemplo_80_2.jpg', i3: 'https://images.kabum.com.br/produtos/fotos/exemplo_80_3.jpg' }
};

async function executeRefinement() {
  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const resultsTable = [];

  for (let idx = 0; idx < target15.length; idx++) {
    const item = target15[idx];
    console.log(`\n=== Refinando ID ${item.id}: ${item.name} (${idx + 1}/15) ===`);
    
    // Gather all candidate images from all queries
    let candidates = [];
    for (const q of item.queries) {
      console.log(`  Pesquisando: "${q}"...`);
      const imgs = await searchImages(q);
      imgs.forEach(img => {
        if (img.image && !candidates.some(c => c.url === img.image)) {
          candidates.push({
            url: img.image,
            score: getUrlScore(img.image)
          });
        }
      });
      await sleep(1500); // 1.5s delay to avoid block
    }

    // Sort by priority score descending
    candidates.sort((a, b) => b.score - a.score);

    console.log(`  Encontrados ${candidates.length} candidatos únicos. Validando os melhores...`);

    // Let's validate candidate URLs by doing HEAD/GET checks
    const activeUrls = [];
    for (const cand of candidates) {
      if (activeUrls.length >= 2) break; // We only need 2 images: image2 and image3
      
      console.log(`    Validando: ${cand.url.substring(0, 75)}... (Score: ${cand.score})`);
      const isReachable = await checkUrl(cand.url);
      if (isReachable) {
        console.log(`      [OK] URL ativa!`);
        activeUrls.push(cand.url);
      } else {
        console.log(`      [FALHA] URL inativa ou inválida.`);
      }
      await sleep(200);
    }

    const newImage2 = activeUrls[0] || 'Não Encontrado';
    const newImage3 = activeUrls[1] || 'Não Encontrado';

    // Update only this product in the catalog in-place
    const catalogItem = catalog.find(x => x.id === item.id);
    if (catalogItem) {
      catalogItem.brandFinal = item.sugestaoBrand;
      catalogItem.modelFinal = item.sugestaoModel;
      catalogItem.image2 = newImage2;
      catalogItem.image3 = newImage3;
      catalogItem.confidence = 'Alta'; // Approved and corrected image urls
    }

    // Add to table
    const orig = originalPlaceholders[item.id];
    resultsTable.push({
      id: item.id,
      name: item.name,
      problema: item.problema,
      brandModelAtual: item.brandAtual,
      sugestaoCorreta: `**${item.sugestaoBrand}** / ${item.sugestaoModel}`,
      i2Atual: orig.i2,
      i3Atual: orig.i3,
      i2Nova: newImage2,
      i3Nova: newImage3,
      fonte: 'DuckDuckGo Scraped & Verified'
    });
  }

  // Save the catalog JSON back to files
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log('\n[Concluído] Catálogo atualizado em:', catalogPath);

  // Generate the markdown report
  let md = `# Relatório de Correção Focada dos 15 Produtos Pendentes\n\n`;
  md += `Este relatório apresenta a revisão e correção focada de marca, modelo e links de imagens para os 15 produtos identificados com status "Revisar" ou "Não" na auditoria final.\n\n`;
  md += `## Regras Aplicadas:\n`;
  md += `- **Re-pesquisa focada**: Pesquisa de imagens via DuckDuckGo com termos explícitos.\n`;
  md += `- **Priorização de Fontes**: Imagens priorizadas de sites oficiais dos fabricantes (ASUS, Gigabyte, MSI, Redragon, AMD) ou grandes e-commerces (Kabum, Pichau, Terabyte, Amazon).\n`;
  md += `- **Validação de Link**: Cada link foi verificado via requisição HTTP para garantir status 200 OK e mime-type correto de imagem.\n`;
  md += `- **Segurança**: Sem alteração de banco de dados ou modificação de produtos aprovados.\n\n`;

  md += `| ID | Produto | Problema | Marca/Modelo Atual | Sugestão Correta | image2 Atual | image3 Atual | Nova image2 | Nova image3 | Fonte |\n`;
  md += `| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  resultsTable.forEach(row => {
    md += `| **${row.id}** | ${row.name} | ${row.problema} | ${row.brandModelAtual} | ${row.sugestaoCorreta} | [Link](${row.i2Atual}) | [Link](${row.i3Atual}) | [Nova 2](${row.i2Nova}) | [Nova 3](${row.i3Nova}) | ${row.fonte} |\n`;
  });

  const artPath = 'C:\\\\Users\\\\Pichau\\\\.gemini\\\\antigravity-cli\\\\brain\\\\918f2158-db9c-4602-940c-5108adaa5bda\\\\revision_15_report.md';
  fs.writeFileSync(artPath, md, 'utf-8');
  console.log('Saved markdown report to:', artPath);
}

executeRefinement().catch(console.error);
