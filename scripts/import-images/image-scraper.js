const fs = require('fs');
const path = require('path');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getExtensionFromMime(mimeType) {
  if (!mimeType) return '.jpg';
  const type = mimeType.toLowerCase();
  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  if (type.includes('gif')) return '.gif';
  if (type.includes('svg')) return '.svg';
  return '.jpg';
}

async function searchImages(query) {
  try {
    const initialUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const initRes = await fetch(initialUrl, {
      headers: { 'User-Agent': userAgent }
    });
    
    if (!initRes.ok) {
      throw new Error(`DDG initial fetch failed with status ${initRes.status}`);
    }
    
    const html = await initRes.text();
    const vqdMatch = html.match(/vqd=([^&'"]+)/) || html.match(/vqd\s*=\s*['"]([^'"]+)['"]/);
    if (!vqdMatch) {
      throw new Error('VQD token not found in HTML');
    }
    const vqd = vqdMatch[1];

    const imagesUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const imgRes = await fetch(imagesUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': 'https://duckduckgo.com/'
      }
    });

    if (!imgRes.ok) {
      throw new Error(`DDG images endpoint failed with status ${imgRes.status}`);
    }

    const data = await imgRes.json();
    return data.results || [];
  } catch (error) {
    console.error(`  [Search Error] For query "${query}":`, error.message);
    return [];
  }
}

async function downloadProductImage(productName, categoryName) {
  const query = `${productName} ${categoryName || ''} produto ecommerce`.trim();
  console.log(`  Pesquisando imagem para: "${query}"...`);
  
  const results = await searchImages(query);
  if (results.length === 0) {
    return { success: false, status: 'IMAGEM_NAO_ENCONTRADA', error: 'No search results found' };
  }

  const prioritizedDomains = [
    'kabum.com.br', 'pichau.com.br', 'terabyteshop.com.br',
    'asus.com', 'gigabyte.com', 'msi.com', 'corsair.com',
    'nvidia.com', 'intel.com', 'amd.com', 'kingston.com',
    'logitech.com', 'hyperx.com', 'razer.com', 'redragon.com'
  ];

  const sortedResults = [...results].sort((a, b) => {
    const aUrl = (a.image || '').toLowerCase();
    const bUrl = (b.image || '').toLowerCase();

    const aHasPriority = prioritizedDomains.some((domain) => aUrl.includes(domain));
    const bHasPriority = prioritizedDomains.some((domain) => bUrl.includes(domain));

    if (aHasPriority && !bHasPriority) return -1;
    if (!aHasPriority && bHasPriority) return 1;
    return 0;
  });

  const maxAttempts = Math.min(10, sortedResults.length);
  for (let i = 0; i < maxAttempts; i++) {
    const imgInfo = sortedResults[i];
    const imageUrl = imgInfo.image;
    
    if (!imageUrl || !imageUrl.startsWith('http')) continue;

    console.log(`    Tentativa ${i + 1}/${maxAttempts}: Baixando de ${imageUrl.substring(0, 80)}...`);

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

      if (nodeBuffer.length < 5000) continue;

      const ext = getExtensionFromMime(mimeType);
      return {
        success: true,
        buffer: nodeBuffer,
        ext: ext,
        originalUrl: imageUrl
      };
    } catch (err) {
      // Silent fail to try next
    }

    await sleep(500);
  }

  return { success: false, status: 'IMAGEM_NAO_ENCONTRADA', error: 'Failed to download any candidate image' };
}

/**
 * Downloads multiple extra images for a product, ensuring they are different from the main image URL
 */
async function downloadExtraImages(productName, categoryName, mainImageUrl, countNeeded = 2) {
  const query = `${productName} ${categoryName || ''} detalhes especificações`.trim();
  console.log(`  Pesquisando imagens extras para: "${query}"...`);
  
  const results = await searchImages(query);
  if (results.length === 0) {
    return [];
  }

  const downloadedImages = [];
  
  // Clean main image URL for comparison
  const cleanMainUrl = (mainImageUrl || '').split('?')[0].toLowerCase();

  const maxCandidates = Math.min(20, results.length);
  for (let i = 0; i < maxCandidates; i++) {
    if (downloadedImages.length >= countNeeded) break;

    const imgInfo = results[i];
    const imageUrl = imgInfo.image;

    if (!imageUrl || !imageUrl.startsWith('http')) continue;

    // Check if it's the main image URL to prevent duplicate image association
    const cleanImageUrl = imageUrl.split('?')[0].toLowerCase();
    if (cleanImageUrl === cleanMainUrl || downloadedImages.some(d => d.originalUrl.split('?')[0].toLowerCase() === cleanImageUrl)) {
      continue;
    }

    console.log(`    Baixando imagem extra ${downloadedImages.length + 1}/${countNeeded} de: ${imageUrl.substring(0, 80)}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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

      if (nodeBuffer.length < 8000) continue; // Slightly larger size threshold for extra images to ensure quality

      const ext = getExtensionFromMime(mimeType);
      downloadedImages.push({
        buffer: nodeBuffer,
        ext: ext,
        originalUrl: imageUrl
      });

      console.log(`    -> Sucesso no download da imagem extra!`);
    } catch (err) {
      // Silent retry next
    }

    await sleep(400);
  }

  return downloadedImages;
}

module.exports = {
  downloadProductImage,
  downloadExtraImages,
  sleep
};
