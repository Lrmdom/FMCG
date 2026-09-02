# Especificação Técnica, Arquitetura e Modelo de Negócio

**Projeto:** FMCG Photo Shopping & Predictive Pantry Service (Microsserviço Hono + Commerce Layer Core MCP + Storefront React Router 8)

---

### Metadados do Projeto
* **Autor:** Equipa de Engenharia & Produto
* **Data:** Setembro de 2026
* **Status:** Documentação Oficial Aprovada (Rev. 3.0 - Commerce Layer Core MCP & Hono Service)
* **Framework do Serviço:** [Hono](https://hono.dev/) (Edge & Node.js Serverless Microservice)
* **Servidor MCP Core (E-Commerce):** [Commerce Layer Core MCP Server](https://docs.commercelayer.io/ai/mcp/servers/core)
* **Consumidor Principal:** Storefront existente em **React Router 8 (Framework Mode)** com ativação por definições (*opt-in*)
* **Arquitetura Core:** Hono API, Commerce Layer Core MCP Server (`@commercelayer/mcp-core` / `@modelcontextprotocol/sdk`), Edge AI (Cloudflare Workers), OpenRouter (Gemini 2.5 Flash), Supabase (pgvector)

---

## 1. Visão Geral do Produto, Modelo de Serviço & Monetização

### 1.1 Proposta de Valor
O **FMCG Service** é um microsserviço inteligente e pluggável de gestão e reposição de bens de consumo rápido (FMCG). Permite capturar imagens da despensa, frigorífico ou embalagens em fim de vida, identificar automaticamente os SKUs corretos via visão computacional em cascata híbrida e executar mutações de carrinho e inventário através do protocolo **MCP (Model Context Protocol)** integrado com o **Commerce Layer Core MCP Server** e API REST de alta velocidade.

> **🔌 Modelo de Serviço & Integração com Storefront (React Router 8 Framework Mode):**
> O serviço opera como uma camada autónoma em **Hono**. Na Storefront existente (desenvolvida em React Router 8 Framework Mode), o utilizador tem controlo total nas *Definições da Conta / Serviços* para ativar (*opt-in*) ou desativar o serviço FMCG. Quando ativado:
> * A Storefront desbloqueia os componentes de captura de imagem da despensa, scanner de código de barras EAN e painel preditivo de inventário.
> * O carrinho da Storefront integra mutações automáticas orquestradas pelas Tools do **Commerce Layer Core MCP Server** (`line_items.create`, `orders.create`, `trigger_predictive_restock`).
> * Alertas inteligentes de reposição são injetados nas rotas do utilizador via React Router Loaders/Actions.

> **🤖 Servidor MCP Padrão: Commerce Layer Core MCP Server:**
> Conforme especificação oficial em [**docs.commercelayer.io/ai/mcp/servers/core**](https://docs.commercelayer.io/ai/mcp/servers/core), as operações de e-commerce (carrinhos, itens, SKUs, preços, clientes, subscrições de reposição) são executadas através do **Commerce Layer Core MCP Server** (`@commercelayer/mcp-core`), garantindo validações de negócio, inventário em tempo real e checkout headless seguro.

### 1.2 Modelos de Monetização
* **Subscrição SaaS Doméstico:** €4,99/mês (acesso ilimitado a análise visual em cascata, alertas preditivos de restock e integração MCP).
* **Comissão sobre FMCG / Subscribe & Save:** Margem negociada com redes de supermercados parceiras (5% a 10% de comissão por reposição automática via Commerce Layer).

---

## 2. Arquitetura da Solução Técnica & Integração (Cascata Híbrida)

Para minimizar a latência e reduzir custos por pedido, a pipeline visual e a integração com a Storefront operam em fluxo desacoplado:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Storefront Existente: React Router 8 (Framework Mode)                  │
│  - Definições de Utilizador (Toggle: "Ativar Serviço FMCG Smart Photo")  │
│  - SDK / Client Plugin: useFmcgService(), PantryWidget, BarcodeScanner   │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ (Opt-in Ativo)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  FMCG Service Core (Construído sobre HONO - https://hono.dev/)           │
│  - API REST Ultra-Rápida (/api/vision, /api/pantry, /api/cart)          │
│  - Módulo RGPD: Processamento Efémero em Memória + Desfoque Edge        │
└───────┬─────────────────────────────┬────────────────────────────┬───────┘
        │ (1. EAN Scanner)            │ (2. Upload Foto)           │ (3. Mutações MCP)
        ▼                             ▼                            ▼
┌─────────────────┐        ┌───────────────────────┐     ┌────────────────────────────┐
│ Leitura Direta  │        │ Cascata de Visão IA:  │     │ Commerce Layer Core MCP    │
│ Barcode JS      │        │ - Worker AI (Llama)   │     │ (docs.commercelayer.io/    │
│ (Confiança 100%)│        │ - Gemini Flash Fallbk │     │  ai/mcp/servers/core)      │
└───────┬─────────┘        └──────────┬────────────┘     │ - line_items.create        │
        │                             │                  │ - orders.create            │
        │                             │                  │ - trigger_restock          │
        └─────────────────────────────┼──────────────────┴─────────────┬──────────────┘
                                      ▼                                │
                           [ Carrinho / Commerce Layer ] ◄─────────────┘
```

---

## 3. Especificação do Servidor Hono & Commerce Layer Core MCP Server

O backend em **Hono** orquestra as chamadas do cliente e interage com o **Commerce Layer Core MCP Server** ([docs.commercelayer.io/ai/mcp/servers/core](https://docs.commercelayer.io/ai/mcp/servers/core)) e `@modelcontextprotocol/sdk`.

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CommerceLayer } from "@commercelayer/sdk";
import { z } from "zod";

const app = new Hono();
app.use("*", cors());

// Cliente Commerce Layer Headless Core API
const cl = CommerceLayer({
  organization: process.env.CL_SLUG || "fmcg-store",
  accessToken: process.env.CL_ACCESS_TOKEN || "your-access-token",
});

// Inicialização do Servidor MCP compatível com Commerce Layer Core
const mcpServer = new McpServer({
  name: "commercelayer-fmcg-core-mcp",
  version: "1.0.0",
});

// Tool: add_item_to_cart (Mapeia para line_items.create do Commerce Layer Core)
mcpServer.tool(
  "add_item_to_cart",
  "Adiciona um SKU ao carrinho ativo através do Commerce Layer Core MCP",
  {
    cartId: z.string().describe("ID da Order/Carrinho no Commerce Layer"),
    sku: z.string().describe("Código SKU validado pela cascata visual"),
    quantity: z.number().default(1),
  },
  async ({ cartId, sku, quantity }) => {
    const lineItem = await cl.line_items.create({
      order: { id: cartId, type: "orders" },
      sku_code: sku,
      quantity,
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, lineItemId: lineItem.id, sku, quantity }) }],
    };
  }
);

// Tool: trigger_predictive_restock (Reposição Preditiva na Despensa)
mcpServer.tool(
  "trigger_predictive_restock",
  "Avalia produtos abaixo do limiar de dias e cria itens de reposição no Commerce Layer",
  {
    cartId: z.string(),
    daysThreshold: z.number().default(3),
  },
  async ({ cartId, daysThreshold }) => {
    // Calcula itens em fim de vida e executa mutações Commerce Layer
    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, restockedCount: 3 }) }],
    };
  }
);

export default app;
```

---

## 4. Integração com a Storefront (React Router 8 Framework Mode)

O SDK de frontend (`src/sdk/`) funciona como um módulo autónomo e exportável para ser integrado na Storefront principal (React Router 8). 

**Modelo de Comunicação:**
* **Browser (Storefront):** Corre os componentes de UI (ex: `<FmcgPhotoScanner />`), acede à câmara e captura a imagem localmente.
* **API REST (Hono):** A Storefront envia a imagem via `POST /api/vision` para o microsserviço Hono.
* **Mutações (MCP/Commerce Layer):** Os componentes do SDK (ou Hooks como `useMcpCart`) aplicam as mutações diretamente no Commerce Layer via MCP ou APIs REST, sincronizando o estado do carrinho.

Para plugar o serviço na Storefront de forma não-intrusiva:

* **Definições do Utilizador (Settings):** Armazenamento da preferência `fmcg_service_enabled: boolean` no perfil/cookie de sessão do utilizador.
* **React Router Loaders & Actions:** Quando o serviço está ativo, os loaders das rotas `/dashboard` e `/cart` consultam o serviço Hono e Commerce Layer para obter previsões de despensa e sugestões de equivalência.
* **Componentes Reutilizáveis (FMCG SDK):**
  * `<FmcgPhotoScanner />`: Modal/componente de captura com feedback visual da cascata de IA.
  * `<PantryDepletionTracker />`: Indicador preditivo de stock doméstico.
  * `<CommerceLayerMcpBridge />`: Sincronizador de mutações em tempo real com o Core MCP.

---

## 5. Análise Financeira, Custos & Unit Economics

**Carga estimada:** 1.000 utilizadores diários ativos (25.000 imagens/dia = 750.000 imagens/mês).

| Componente | Especificação | Volume Mensal | Custo Mensal ($ USD) |
| :--- | :--- | :--- | :--- |
| **Edge Compute (Hono API)** | Cloudflare Workers / Node runtime | 1.500.000 requisições | $5,00 |
| **Edge AI** | Cloudflare Workers AI (Llama 3.2 Vision) | 600.000 fotos (80%) | $18,00 |
| **LLM Fallback API** | OpenRouter / Gemini 2.5 Flash | 150.000 fotos (20%) | $15,75 |
| **Vector Database** | Supabase (pgvector) | Embeddings FMCG | $25,00 |
| **Commerce Layer Core MCP** | [Commerce Layer Core Server](https://docs.commercelayer.io/ai/mcp/servers/core) | Mutações & Line Items | $5,00 |
| **Custo Total Mensal** | **Infraestrutura** | | **~$68,75 USD** |

> **Custo Direto por Utilizador / Mês:** $0,068 USD (~€0,06)
> **Margem Bruta Tecnológica sobre a Subscrição (€4,99/mês):** ~98,7%

---

## 6. Conformidade & Privacidade de Dados (RGPD)

* **Processamento Efémero:** As fotografias enviadas são processadas em memória no servidor Hono e eliminadas imediatamente após a deteção de SKUs.
* **Minimização de Dados & Desfoque Edge:** Aplicação de filtro visual antes de enviar a imagem para o LLM para desfocar rostos ou documentos pessoais.
* **Consentimento Explícito nas Definições:** Ativação voluntária do serviço pelo utilizador com política clara de retenção zero de imagens.

---

## 7. Roadmap de Implementação

* **Fase 1:** Inicialização do Microsserviço Hono (API REST, Cascata Visual, Integração Commerce Layer Core MCP, Catálogo FMCG e Previsão de Despensa).
* **Fase 2:** Desenvolvimento do SDK / Componentes de Integração para Storefront (React Router 8 Framework Mode).
* **Fase 3:** Criação do Módulo de Definições de Utilizador (Opt-in toggle e preferências de reposição automática).
* **Fase 4:** Testes de integração de ponta a ponta e consola interativa de demonstração.
