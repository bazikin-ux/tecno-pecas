const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('Verificando colunas "brand", "image2" e "image3" na tabela "products"...');
  
  // Try selecting these columns
  const { data, error } = await supabase
    .from('products')
    .select('id, brand, image2, image3')
    .limit(1);

  if (error) {
    console.log('\n[INFO] As colunas não existem ou não puderam ser acessadas.');
    console.log('Mensagem de Erro:', error.message);
  } else {
    console.log('\n[INFO] Colunas verificadas com sucesso! Elas já existem no banco.');
    console.log('Exemplo de retorno:', data);
  }
}

checkColumns().catch(console.error);
