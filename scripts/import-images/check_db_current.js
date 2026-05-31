const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Querying current state from Supabase database directly...');
  const targetIds = [2, 13, 19, 90, 101, 102];
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image, image2, image3, brand, specs')
    .in('id', targetIds)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error querying Supabase:', error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
