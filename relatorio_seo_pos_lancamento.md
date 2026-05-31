# Relatório de Auditoria de SEO Pós-Lançamento — Tecno Peças

Este relatório apresenta os resultados da auditoria de SEO realizada no e-commerce **Tecno Peças** (domain oficial: `https://www.tecnopecaspc.com.br`) após a configuração do sitemap e do Google Search Console. 

A auditoria cobriu o status do sitemap, a estrutura de headings, metadados, Open Graph, tags JSON-LD estruturadas e a otimização de indexação de páginas estáticas e dinâmicas.

---

## 1. Verificação do Sitemap e Conexão com o Google
* **Sitemap XML**: Disponível em [https://www.tecnopecaspc.com.br/sitemap.xml](https://www.tecnopecaspc.com.br/sitemap.xml).
* **Validação de Status**: Verificamos individualmente as **107 URLs** listadas no sitemap do servidor. **Todas as 107 URLs retornaram Status 200 OK**, garantindo que não existem links quebrados no sitemap enviado ao Google.
* **Arquivo de Verificação**: O arquivo de autenticação do Google Search Console (`google73e3a7f8bfbb5406.html`) está corretamente configurado e acessível na raiz pública, atestando a propriedade do domínio.
* **Nota sobre Envio**: Como o Google desativou a API pública de ping para sitemaps, a confirmação do envio deve ser feita de forma direta pelo painel administrativo do **Google Search Console** > **Sitemaps** inserindo o caminho `sitemap.xml`.

---

## 2. Cronograma de Indexação Manual no Google Search Console
Para acelerar a exibição da loja nos resultados de pesquisa do Google, recomendamos solicitar a indexação manual das seguintes páginas chaves através da ferramenta de **Inspeção de URL** no Search Console:

### Páginas Principais da Loja
1. **Home Page**: [https://www.tecnopecaspc.com.br](https://www.tecnopecaspc.com.br)
2. **Promoções**: [https://www.tecnopecaspc.com.br/promocoes](https://www.tecnopecaspc.com.br/promocoes)
3. **Mais Vendidos**: [https://www.tecnopecaspc.com.br/mais-vendidos](https://www.tecnopecaspc.com.br/mais-vendidos)
4. **Monte seu PC**: [https://www.tecnopecaspc.com.br/monte-seu-pc](https://www.tecnopecaspc.com.br/monte-seu-pc)

### Top 10 Produtos Mais Relevantes (Indexação Prioritária)
Esses produtos foram selecionados com base no volume de vendas (`sold` no catálogo) e relevância estratégica por categoria:

1. **Processador Ryzen 5 5600** (Alta demanda - Custo-benefício)
   * URL: `https://www.tecnopecaspc.com.br/produto/ryzen-5-5600`
2. **Placa de Vídeo Geforce RTX 4060 8GB** (Líder em vendas de GPU)
   * URL: `https://www.tecnopecaspc.com.br/produto/geforce-rtx-4060-8gb`
3. **SSD NVMe 1TB PCIe 3.0** (Principal armazenamento vendido)
   * URL: `https://www.tecnopecaspc.com.br/produto/ssd-nvme-1tb-pcie-3-0`
4. **Processador Ryzen 7 5700X** (Alta demanda em CPUs AM4)
   * URL: `https://www.tecnopecaspc.com.br/produto/ryzen-7-5700x`
5. **Processador Ryzen 7 7800X3D** (Hardware Premium / Melhor para jogos)
   * URL: `https://www.tecnopecaspc.com.br/produto/ryzen-7-7800x3d`
6. **Placa de Vídeo Geforce RTX 4070 Super 12GB** (Segmento Premium gamer)
   * URL: `https://www.tecnopecaspc.com.br/produto/geforce-rtx-4070-super-12gb`
7. **PC Gamer Ryzen 5 5600 + RX 6600** (Computador montado mais vendido)
   * URL: `https://www.tecnopecaspc.com.br/produto/pc-gamer-ryzen-5-5600-rx-6600`
8. **Placa-mãe B550M AM4** (Componente essencial de plataforma)
   * URL: `https://www.tecnopecaspc.com.br/produto/placa-mae-b550m-am4`
9. **Memória RAM 16GB DDR4 3200MHz** (Líder em volume de acessórios)
   * URL: `https://www.tecnopecaspc.com.br/produto/memoria-16gb-ddr4-3200mhz`
10. **Monitor Gamer 24" 144Hz** (Periférico de alta saída)
    * URL: `https://www.tecnopecaspc.com.br/produto/monitor-gamer-24-144hz`

---

## 3. Diagnóstico e Auditoria Detalhada de SEO

Abaixo está o detalhamento dos problemas de SEO encontrados no código-fonte do Next.js da loja Tecno Peças:

### Problema 1: Domínio Incorreto Hardcoded em Metadados, Open Graph e JSON-LD
* **Onde ocorre**: `app/layout.tsx`, `app/page.tsx` e lógica de fallback no `app/produto/[slug]/page.tsx`.
* **Descrição**: O domínio `https://www.tecnopecas.com.br` está inserido de forma fixa no código (ex: OG URL, OG Image, JSON-LD SearchAction). No entanto, o domínio oficial ativo é `https://www.tecnopecaspc.com.br` (com "pc").
* **Impacto em SEO**: **Crítico**. Causa problemas de conteúdo duplicado ou não indexado devido a conflitos de canonicidade. Além disso, pré-visualizações de redes sociais (WhatsApp, Twitter, Facebook) falharão ou apontarão para links quebrados do domínio incorreto.
* **Correção recomendada**: Substituir as ocorrências hardcoded de `tecnopecas.com.br` pelo domínio de produção correto `tecnopecaspc.com.br` nos metadados globais e dinâmicos do Next.js.
* **Impacto Estimado**: Muito Alto
* **Prioridade**: **Urgente (Imediata)**

### Problema 2: Idioma da Página incorreto no HTML (`lang="en"`)
* **Onde ocorre**: `app/layout.tsx` (linha 43)
* **Descrição**: A tag HTML está definida com o atributo `lang="en"`.
* **Impacto em SEO**: **Alto**. Como a loja é 100% voltada ao mercado brasileiro e escrita em português, manter o atributo em inglês faz com que mecanismos de busca tenham dificuldade em determinar o mercado-alvo primário. Também faz com que navegadores exibam alertas invasivos oferecendo tradução do português para o inglês.
* **Correção recomendada**: Alterar o atributo no root layout para `lang="pt-BR"`.
* **Impacto Estimado**: Alto
* **Prioridade**: **Alta**

### Problema 3: Ausência de H1 em Dispositivos Móveis (Home, Promoções e Mais Vendidos)
* **Onde ocorre**: `app/page.tsx`, `app/promocoes/page.tsx` e `app/mais-vendidos/page.tsx`.
* **Descrição**: O único elemento `<h1>` ("Tecno Peças") dessas páginas está posicionado dentro da barra lateral desktop (`<aside className="hidden bg-[#2b2d31] p-4 md:block">`). No mobile, essa barra é omitida com `hidden`. O layout mobile inicia diretamente com títulos `<h2>` ("Menu" e o título da seção).
* **Impacto em SEO**: **Alto**. Devido ao indexamento do Google priorizar dispositivos móveis (mobile-first indexing), as páginas principais serão lidas pelo crawler como "sem título H1", reduzindo drasticamente a força de ranqueamento dos termos principais.
* **Correção recomendada**: Adicionar um elemento `<h1>` invisível para leitores visuais ou reestruturar o cabeçalho móvel para que a logo ou o título principal utilize a tag `<h1>` semanticamente correta, reservando os `<h2>` para subtítulos.
* **Impacto Estimado**: Médio-Alto
* **Prioridade**: **Alta**

### Problema 4: Inclusão de Rotas Privadas no Sitemap.xml
* **Onde ocorre**: `app/sitemap.ts` (linhas 18 a 23)
* **Descrição**: O sitemap dinâmico inclui as rotas `/carrinho`, `/cliente` e `/rastreamento`.
* **Impacto em SEO**: **Médio**. Rotas de carrinho de compras, painel de cliente e rastreamento de pedidos são restritas a sessões de usuários e não contêm conteúdo público útil para indexação. Tentar indexá-las gera desperdício de "Crawl Budget" (orçamento de rastreamento do Google) e gera alertas de indexação de páginas vazias ou com redirecionamento de login.
* **Correção recomendada**: Remover `/carrinho`, `/cliente` e `/rastreamento` da lista de rotas estáticas do sitemap dinâmico.
* **Impacto Estimado**: Médio
* **Prioridade**: **Média**

### Problema 5: Ausência de Arquivo de Configuração `robots.txt`
* **Onde ocorre**: Raiz da pasta `/public` ou arquivo `/app/robots.ts`.
* **Descrição**: Não existe uma diretriz de robôs configurada para instruir os rastreadores.
* **Impacto em SEO**: **Médio**. Sem o `robots.txt`, rastreadores indexarão APIs internas (`/api/shipping`, `/api/products`), áreas de checkout ou administrativas, o que pode expor rotas desnecessárias. Além disso, o robots.txt serve para declarar explicitamente o sitemap correto para outros buscadores (como Bing e DuckDuckGo).
* **Correção recomendada**: Criar um arquivo `app/robots.ts` no Next.js ou um `public/robots.txt` com as seguintes regras:
  ```text
  User-agent: *
  Allow: /
  Disallow: /carrinho
  Disallow: /cliente
  Disallow: /rastreamento
  Disallow: /api/

  Sitemap: https://www.tecnopecaspc.com.br/sitemap.xml
  ```
* **Impacto Estimado**: Médio
* **Prioridade**: **Média**

### Problema 6: Títulos e Descrições Estáticas Não Otimizados
* **Onde ocorre**: `/promocoes`, `/mais-vendidos` e `/monte-seu-pc`.
* **Descrição**: Essas rotas são Client Components e herdam o título padrão do layout global ("Tecno Peças | Loja de Hardware Gamer e Computadores"), sem customização para a sua finalidade específica.
* **Impacto em SEO**: **Médio**. Quando usuários pesquisarem por "promoções de hardware tecno peças" ou "monte seu computador tecno peças", o Google exibirá o snippet idêntico ao da Home. Isso reduz o CTR (Click-Through Rate) e impede o ranqueamento por palavras-chave específicas destas seções.
* **Correção recomendada**: Criar arquivos `layout.tsx` específicos dentro de `app/promocoes/`, `app/mais-vendidos/` e `app/monte-seu-pc/` para definir títulos e descrições apropriados (ex: `title: "Promoções e Ofertas de Hardware | Tecno Peças"`, `description: "Confira as melhores ofertas de processadores, placas de vídeo e memórias com desconto na Tecno Peças."`).
* **Impacto Estimado**: Médio-Alto
* **Prioridade**: **Média-Alta**

### Problema 7: Quebra de Hierarquia de Headings nas Páginas de Produto
* **Onde ocorre**: `app/produto/[slug]/page.tsx` (linhas 218 e 300)
* **Descrição**: O nome do produto usa a tag `<h1>`. A seção seguinte de relevância ("Produtos Relacionados") pula diretamente para a tag `<h3>`, omitindo a tag `<h2>`.
* **Impacto em SEO**: **Baixo**. Dificulta levemente o entendimento da hierarquia lógica da página por leitores de tela e motores de busca.
* **Correção recomendada**: Alterar o título "Produtos Relacionados" de `<h3>` para `<h2>`.
* **Impacto Estimado**: Baixo
* **Prioridade**: **Baixa**

---

## 4. Tabela Resumo de Implementação

| ID | SEO Issue | Impacto Estimado | Prioridade | Dificuldade |
| :--- | :--- | :--- | :--- | :--- |
| **01** | Domínio incorreto hardcoded (`tecnopecas.com.br`) | Muito Alto | **Urgente** | Muito Fácil |
| **02** | Atributo de idioma incorreto (`lang="en"`) | Alto | **Alta** | Muito Fácil |
| **03** | Falta de H1 no mobile (Home, Promoções e Mais Vendidos) | Alto | **Alta** | Fácil |
| **04** | Páginas privadas no Sitemap (`/carrinho`, `/cliente`, etc.) | Médio | **Média** | Muito Fácil |
| **05** | Ausência de arquivo `robots.txt` / disallow de rotas | Médio | **Média** | Fácil |
| **06** | Metadados duplicados / não otimizados em páginas secundárias | Médio-Alto | **Média-Alta**| Fácil |
| **07** | Salto de hierarquia de headings no Produto (H1 -> H3) | Baixo | **Baixa** | Muito Fácil |

*Apenas auditoria realizada. Nenhuma alteração de código ou banco de dados foi efetuada, respeitando integralmente as restrições impostas.*
