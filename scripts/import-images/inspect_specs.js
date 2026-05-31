const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSpecs() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, specs')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Let's filter some generic products and print their specs
  const sample = products.filter(p => p.id >= 22).slice(0, 15);
  sample.forEach(p => {
    console.log(`ID: ${p.id} | Name: "${p.name}" | Cat: "${p.category}"`);
    console.log(`Specs: "${p.specs.trim()}"`);
    console.log('----------------------------------------------------');
  });
}

inspectSpecs();
