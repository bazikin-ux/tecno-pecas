const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function integrate() {
  const catalogPath = 'C:\\Users\\Pichau\\OneDrive\\tecno-pecas\\scripts\\import-images\\final_consolidated_catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, image')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  catalog.forEach(item => {
    const dbItem = dbProducts.find(x => x.id === item.id);
    if (dbItem) {
      item.image = dbItem.image || '';
    }
  });

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log('Successfully integrated main images into final_consolidated_catalog.json.');
}

integrate().catch(console.error);
