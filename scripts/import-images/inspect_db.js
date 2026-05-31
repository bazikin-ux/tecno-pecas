const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTable() {
  console.log('Fetching products table metadata from Supabase...');
  
  // Fetch one row to see columns and structure
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching table schema:', error.message);
    process.exit(1);
  }

  if (data.length === 0) {
    console.log('The table "products" is currently empty.');
    // Let's check table columns by doing a descriptive query or query db definitions if possible
    // But usually there are some items. Let's see if there are any.
    return;
  }

  const sample = data[0];
  console.log('Sample Row structure:');
  console.log(JSON.stringify(sample, null, 2));

  // Let's also check total count of products
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`Total products currently in database: ${count}`);
  }
}

inspectTable().catch(console.error);
