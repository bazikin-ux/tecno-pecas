const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateImport() {
  console.log('==================================================');
  console.log('       INICIANDO VALIDAÇÃO PÓS-IMPORTAÇÃO        ');
  console.log('==================================================\n');

  // 1. Fetch all products from database
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Erro ao buscar dados pós-importação:', error.message);
    process.exit(1);
  }

  const totalCount = products.length;
  console.log(`1. Total de produtos cadastrados na tabela "products": ${totalCount}`);

  // We had 19 original products + 83 imported products = 102 total products
  const expectedTotal = 19 + 83;
  console.log(`   - Esperado: ${expectedTotal}`);
  if (totalCount === expectedTotal) {
    console.log('   - [OK] A contagem de produtos bate com o esperado (102 produtos).\n');
  } else {
    console.warn(`   - [AVISO] Contagem divergente! Encontrados ${totalCount}, esperado ${expectedTotal}.\n`);
  }

  // 2. Validate imported products properties
  // Let's filter products that were inserted (by matching the new ones, or checking those with stock = 22)
  // Let's check how many have stock = 22, image URL from supabase storage, price > 0
  let countWithImage = 0;
  let countWithPrice = 0;
  let countWithStock22 = 0;
  let countActive = 0;

  products.forEach((p) => {
    if (p.image && p.image.includes('supabase.co')) {
      countWithImage++;
    }
    if (p.price && p.price > 0) {
      countWithPrice++;
    }
    if (p.stock === 22) {
      countWithStock22++;
    }
    if (p.active) {
      countActive++;
    }
  });

  console.log('2. Validação de Propriedades:');
  console.log(`   - Produtos com image_url preenchido (via Supabase Storage): ${countWithImage}`);
  console.log(`   - Produtos com preço válido (> 0): ${countWithPrice}`);
  console.log(`   - Produtos com estoque exatamente igual a 22: ${countWithStock22}`);
  console.log(`   - Produtos marcados como ativos (active = true): ${countActive}`);

  // Failures check
  const hasFailures = products.some(p => {
    // If it's one of the 83 new ones, check properties
    // We can assume if stock is 22 it is one of the imported ones
    if (p.stock === 22) {
      return !p.image || !p.price || p.price <= 0 || !p.name || !p.category;
    }
    return false;
  });

  if (!hasFailures) {
    console.log('\n   - [OK] Todos os produtos importados possuem nome, preço, categoria, imagem e estoque = 22.');
  } else {
    console.warn('\n   - [ALERTA] Alguns produtos importados possuem dados incorretos ou ausentes!');
  }
}

validateImport().catch(console.error);
