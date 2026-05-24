# Deploy e dominio

## Dominio proprio

Para usar `www.tecnopecas.com.br` em producao:

1. Adicione o dominio no projeto da Vercel em `Settings > Domains`.
2. No painel do registrador, crie os registros DNS indicados pela Vercel.
3. Configure a variavel de ambiente:

```bash
NEXT_PUBLIC_SITE_URL=https://www.tecnopecas.com.br
```

O checkout, webhook, rastreamento e links enviados por WhatsApp usam essa URL publica.

## Frete real

O projeto ja tenta cotar frete pelo Melhor Envio quando estas variaveis existem:

```bash
MELHOR_ENVIO_TOKEN=
MELHOR_ENVIO_SANDBOX=true
SHIPPING_FROM_CEP=00000000
```

Sem essas credenciais, a API `/api/shipping` usa uma tabela automatica por CEP como fallback para manter a loja funcionando.

## Painel financeiro

O lucro estimado usa margem percentual configuravel:

```bash
PROFIT_MARGIN_PERCENT=22
```
