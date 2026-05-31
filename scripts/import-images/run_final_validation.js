const fs = require('fs');
const path = require('path');

const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

function validateCatalog() {
  const totalProducts = catalog.length;
  
  let semMarcaCount = 0;
  let semModeloCount = 0;
  let semPrecoCount = 0;
  let semImage2Count = 0;
  let semImage3Count = 0;
  let confiancaBaixaCount = 0;
  
  let invalidUrlsCount = 0;
  let duplicateUrlsCount = 0;

  const allUrls = new Set();
  const duplicateList = [];
  const semMarcaList = [];
  const semModeloList = [];
  const semPrecoList = [];
  const semImage2List = [];
  const semImage3List = [];
  const invalidUrlsList = [];
  const confiancaBaixaList = [];

  catalog.forEach(item => {
    // 1. Check Brand
    const brand = (item.brandFinal || '').trim();
    if (!brand || brand === 'GENERICA' || brand === 'Necessita Revisão' || brand === 'Não Identificado') {
      semMarcaCount++;
      semMarcaList.push(item.id);
    }

    // 2. Check Model
    const model = (item.modelFinal || '').trim();
    if (!model || model === 'Modelo Não Identificado' || model === 'Necessita Revisão' || model === '') {
      semModeloCount++;
      semModeloList.push(item.id);
    }

    // 3. Check Price
    const price = item.priceFinal;
    if (price === null || price === undefined || isNaN(price) || price <= 0) {
      semPrecoCount++;
      semPrecoList.push(item.id);
    }

    // 4. Check image2
    const img2 = (item.image2 || '').trim();
    const isImg2Placeholder = img2.toLowerCase().includes('exemplo_') || img2.toLowerCase().includes('placeholder');
    if (!img2 || img2 === 'Não Encontrado' || isImg2Placeholder) {
      semImage2Count++;
      semImage2List.push(item.id);
    }

    // 5. Check image3
    const img3 = (item.image3 || '').trim();
    const isImg3Placeholder = img3.toLowerCase().includes('exemplo_') || img3.toLowerCase().includes('placeholder');
    if (!img3 || img3 === 'Não Encontrado' || isImg3Placeholder) {
      semImage3Count++;
      semImage3List.push(item.id);
    }

    // 6. Check Confidence
    if (item.confidence === 'Baixa') {
      confiancaBaixaCount++;
      confiancaBaixaList.push(item.id);
    }

    // 7. Check URL validity (format check)
    if (img2 && img2 !== 'Não Encontrado') {
      if (!img2.startsWith('http://') && !img2.startsWith('https://')) {
        invalidUrlsCount++;
        invalidUrlsList.push({ id: item.id, field: 'image2', url: img2 });
      }
    }
    if (img3 && img3 !== 'Não Encontrado') {
      if (!img3.startsWith('http://') && !img3.startsWith('https://')) {
        invalidUrlsCount++;
        invalidUrlsList.push({ id: item.id, field: 'image3', url: img3 });
      }
    }

    // 8. Check Duplicate URLs within the same product
    if (img2 && img3 && img2 !== 'Não Encontrado' && img3 !== 'Não Encontrado' && img2 === img3) {
      duplicateUrlsCount++;
      duplicateList.push({ id: item.id, type: 'Same product image2 and image3 identical', url: img2 });
    }

    // 9. Check Duplicate URLs across different products
    if (img2 && img2 !== 'Não Encontrado' && !isImg2Placeholder) {
      if (allUrls.has(img2)) {
        duplicateUrlsCount++;
        duplicateList.push({ id: item.id, type: 'Cross-product duplicate image2', url: img2 });
      } else {
        allUrls.add(img2);
      }
    }
    if (img3 && img3 !== 'Não Encontrado' && !isImg3Placeholder) {
      if (allUrls.has(img3)) {
        duplicateUrlsCount++;
        duplicateList.push({ id: item.id, type: 'Cross-product duplicate image3', url: img3 });
      } else {
        allUrls.add(img3);
      }
    }
  });

  console.log('=== RESULTADO DA VALIDAÇÃO FINAL ===');
  console.log(`Total de Produtos : ${totalProducts}`);
  console.log(`Sem Marca         : ${semMarcaCount} ${semMarcaList.length ? '(IDs: ' + semMarcaList.join(',') + ')' : ''}`);
  console.log(`Sem Modelo        : ${semModeloCount} ${semModeloList.length ? '(IDs: ' + semModeloList.join(',') + ')' : ''}`);
  console.log(`Sem Preço         : ${semPrecoCount} ${semPrecoList.length ? '(IDs: ' + semPrecoList.join(',') + ')' : ''}`);
  console.log(`Sem image2        : ${semImage2Count} ${semImage2List.length ? '(IDs: ' + semImage2List.join(',') + ')' : ''}`);
  console.log(`Sem image3        : ${semImage3Count} ${semImage3List.length ? '(IDs: ' + semImage3List.join(',') + ')' : ''}`);
  console.log(`URLs Inválidas    : ${invalidUrlsCount}`);
  if (invalidUrlsList.length) console.log('Detalhes URLs Inválidas:', invalidUrlsList);
  console.log(`URLs Duplicadas   : ${duplicateUrlsCount}`);
  if (duplicateList.length) console.log('Detalhes Duplicatas:', duplicateList);
  console.log(`Confiança Baixa   : ${confiancaBaixaCount} ${confiancaBaixaList.length ? '(IDs: ' + confiancaBaixaList.join(',') + ')' : ''}`);
  
  // Format markdown table for output
  let mdTable = `| Verificação       | Quantidade |\n`;
  mdTable += `| ----------------- | ---------- |\n`;
  mdTable += `| Total de Produtos | ${totalProducts} |\n`;
  mdTable += `| Sem Marca         | ${semMarcaCount} |\n`;
  mdTable += `| Sem Modelo        | ${semModeloCount} |\n`;
  mdTable += `| Sem Preço         | ${semPrecoCount} |\n`;
  mdTable += `| Sem image2        | ${semImage2Count} |\n`;
  mdTable += `| Sem image3        | ${semImage3Count} |\n`;
  mdTable += `| URLs Inválidas    | ${invalidUrlsCount + duplicateUrlsCount} |\n`;
  mdTable += `| Confiança Baixa   | ${confiancaBaixaCount} |\n`;

  console.log('\n--- MARKDOWN TABLE ---');
  console.log(mdTable);
}

validateCatalog();
