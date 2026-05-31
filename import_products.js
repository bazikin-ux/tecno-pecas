const { createClient } = require("@supabase/supabase-js");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// 1. Load Supabase Environment Credentials
const envPath = path.join(__dirname, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("ERRO: Arquivo .env.local não encontrado.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[match[1]] = val;
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 2. Load and Parse XLSX File
const xlsxPath = path.join(__dirname, "novos_produtos_sugeridos.xlsx");
if (!fs.existsSync(xlsxPath)) {
  console.error("ERRO: Planilha de importação não encontrada em:", xlsxPath);
  process.exit(1);
}

async function importCatalog() {
  console.log("Iniciando importação de catálogo a partir de:", xlsxPath);
  
  const workbook = XLSX.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Carregados ${data.length} registros para importação.`);

  // 3. Map Row Properties to Supabase Table Columns
  const mappedProducts = data.map((row, idx) => {
    // Determine dynamic tag based on characteristics
    let tag = "Produto";
    if (row["Preço antigo"] && Number(row["Preço antigo"]) > Number(row["Preço"])) {
      tag = "Oferta";
    } else if (Number(row["Preço"]) < 300) {
      tag = "Barato";
    }

    return {
      name: row["Nome"],
      category: row["Categoria"],
      brand: row["Marca"],
      price: Number(row["Preço"]),
      old_price: row["Preço antigo"] ? Number(row["Preço antigo"]) : null,
      stock: Number(row["Estoque"]),
      specs: row["Especificações"],
      tag: tag,
      image: row["URL da imagem principal"],
      image2: row["image2"],
      image3: row["image3"],
      active: true // Força active = true
    };
  });

  // 4. Perform Insert into Supabase 'products' Table
  console.log("Enviando produtos para a tabela 'products' no Supabase...");
  const { data: result, error } = await supabase
    .from("products")
    .insert(mappedProducts)
    .select("id, name");

  if (error) {
    console.error("Erro crítico na importação do Supabase:", error.message);
    process.exit(1);
  }

  console.log("\n=== IMPORTAÇÃO CONCLUÍDA COM SUCESSO ===");
  console.log(`Foram importados ${result.length} novos produtos.`);
  result.forEach(p => {
    console.log(`- ID: ${p.id} | Nome: ${p.name}`);
  });
}

// Para prevenir execuções acidentais antes da aprovação expressa:
if (process.argv.includes("--confirm")) {
  importCatalog();
} else {
  console.log("-----------------------------------------------------------------");
  console.log("ALERTA DE SEGURANÇA: Script carregado no modo de simulação.");
  console.log("Nenhuma alteração foi realizada no Supabase.");
  console.log("Para rodar a importação de verdade, execute com a flag --confirm:");
  console.log("node import_products.js --confirm");
  console.log("-----------------------------------------------------------------");
}
