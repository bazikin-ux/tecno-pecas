const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runAnalysis() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, price, category, specs')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Loaded ${products.length} products.`);

  // Let's count categories
  const categories = {};
  const brands = {};
  
  products.forEach(p => {
    categories[p.category] = (categories[p.category] || 0) + 1;
    brands[p.brand] = (brands[p.brand] || 0) + 1;
  });

  console.log('Categories:', categories);
  console.log('Brands summary:', brands);
}

runAnalysis();
