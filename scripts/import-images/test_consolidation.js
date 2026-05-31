const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseImageList(value) {
  if (!value) return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function main() {
  const targetIds = [2, 13, 90];
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image, image2, image3')
    .in('id', targetIds);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  products.forEach(product => {
    const list = [
      ...parseImageList(product.image),
      product.image2,
      product.image3
    ].filter(Boolean);
    const unique = Array.from(new Set(list));
    console.log(`Product ID ${product.id} - ${product.name}:`);
    console.log(`  DB image : ${product.image}`);
    console.log(`  DB image2: ${product.image2}`);
    console.log(`  DB image3: ${product.image3}`);
    console.log(`  Consolidated array:`, list);
    console.log(`  Unique array (as built in gallery):`, unique);
    console.log('--------------------------------------------------');
  });
}

main().catch(console.error);
