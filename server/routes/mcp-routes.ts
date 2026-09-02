import { Hono } from 'hono';
import { mcpExecutionLogs, recordMcpLog } from '../mcp/server.ts';
import { CartEngine } from '../services/cart-engine.ts';
import { PantryEngine } from '../services/pantry-engine.ts';
import { VectorSearchService } from '../services/vector-search.ts';
import { CascadeEngine } from '../services/cascade-engine.ts';
import { FMCG_CATALOG } from '../../shared/catalog.ts';

export const mcpRouter = new Hono();

const REGISTERED_TOOLS = [
  {
    name: 'add_item_to_cart',
    description: 'Adiciona um SKU validado ao carrinho ativo do utilizador na Storefront',
    parameters: {
      type: 'object',
      properties: {
        cartId: { type: 'string', description: 'ID do carrinho de compras ativo' },
        sku: { type: 'string', description: 'Código SKU do produto FMCG' },
        quantity: { type: 'number', default: 1, description: 'Quantidade a adicionar' },
        supermarket: { type: 'string', enum: ['Continente', 'Pingo Doce', 'Auchan', 'Mercadona'], description: 'Supermercado' },
      },
      required: ['cartId', 'sku'],
    },
  },
  {
    name: 'get_product_details',
    description: 'Obtém informações detalhadas, preços e equivalências de um produto FMCG',
    parameters: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'Código SKU ou EAN' },
      },
      required: ['sku'],
    },
  },
  {
    name: 'suggest_equivalent_products',
    description: 'Pesquisa semântica vetorial (pgvector) para encontrar alternativas mais económicas ou marcas brancas',
    parameters: {
      type: 'object',
      properties: {
        skuOrQuery: { type: 'string', description: 'Código SKU alvo ou termo' },
        limit: { type: 'number', default: 3, description: 'Limite de sugestões' },
      },
      required: ['skuOrQuery'],
    },
  },
  {
    name: 'scan_pantry_items',
    description: 'Processa uma fotografia de despensa/frigorífico através da cascata visual de IA e deteta SKUs',
    parameters: {
      type: 'object',
      properties: {
        presetScenarioId: { type: 'string', description: 'Cenário de teste' },
        eanBarcode: { type: 'string', description: 'Código de barras EAN' },
        forceMethod: { type: 'string', enum: ['barcode', 'edge_ai', 'gemini_fallback'] },
      },
    },
  },
  {
    name: 'get_pantry_inventory',
    description: 'Consulta o inventário da despensa inteligente e identifica produtos em fim de vida',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', enum: ['pantry', 'fridge', 'freezer', 'cleaning'] },
      },
    },
  },
  {
    name: 'trigger_predictive_restock',
    description: 'Gera reposição preditiva automática no carrinho da Storefront para itens com esgotamento iminente',
    parameters: {
      type: 'object',
      properties: {
        daysThreshold: { type: 'number', default: 3, description: 'Limiar de dias' },
        supermarket: { type: 'string', enum: ['Continente', 'Pingo Doce', 'Auchan', 'Mercadona'] },
      },
    },
  },
];

mcpRouter.get('/tools', (c) => {
  return c.json({
    sdk: '@modelcontextprotocol/sdk v1.30.0',
    serverName: 'fmcg-cart-mcp',
    version: '1.0.0',
    tools: REGISTERED_TOOLS,
  });
});

mcpRouter.get('/logs', (c) => {
  return c.json({ logs: mcpExecutionLogs });
});

mcpRouter.post('/tools/:toolName', async (c) => {
  const toolName = c.req.param('toolName');
  const params = await c.req.json().catch(() => ({}));
  const t0 = Date.now();

  try {
    let result: any;
    if (toolName === 'add_item_to_cart') {
      const res = CartEngine.addItem({
        sku: params.sku,
        quantity: params.quantity || 1,
        addedBy: 'mcp_tool',
        supermarket: params.supermarket,
      });
      result = {
        success: true,
        cartId: params.cartId || 'cart-session-001',
        lineItemId: res.lineItem.id,
        sku: res.lineItem.sku,
        productName: res.lineItem.product.name,
        quantity: res.lineItem.quantity,
        unitPrice: res.lineItem.unitPrice,
        cartTotal: res.cart.total,
        timestamp: Date.now(),
      };
    } else if (toolName === 'get_product_details') {
      const product = FMCG_CATALOG.find(p => p.sku === params.sku || p.ean === params.sku);
      if (!product) {
        throw new Error(`Produto ${params.sku} não encontrado`);
      }
      const equivalents = VectorSearchService.findEquivalents(product.sku, 3);
      result = { found: true, product, equivalents };
    } else if (toolName === 'suggest_equivalent_products') {
      const isSku = FMCG_CATALOG.some(p => p.sku === params.skuOrQuery);
      if (isSku) {
        result = { suggestions: VectorSearchService.findEquivalents(params.skuOrQuery, params.limit || 3) };
      } else {
        result = {
          suggestions: VectorSearchService.searchByQuery(params.skuOrQuery, params.limit || 5).map(p => ({
            product: p,
            similarityScore: 0.85,
            priceSavingsEur: 0,
            priceSavingsPercent: 0,
          })),
        };
      }
    } else if (toolName === 'scan_pantry_items') {
      result = await CascadeEngine.analyzeImage({
        presetScenarioId: params.presetScenarioId,
        eanBarcode: params.eanBarcode,
        forceMethod: params.forceMethod,
      });
    } else if (toolName === 'get_pantry_inventory') {
      const inventory = PantryEngine.getInventory(params.location);
      const restockCandidates = PantryEngine.getRestockCandidates(3);
      result = {
        totalItems: inventory.length,
        itemsAtRiskCount: restockCandidates.length,
        inventory,
        urgentRestock: restockCandidates,
      };
    } else if (toolName === 'trigger_predictive_restock') {
      const candidates = PantryEngine.getRestockCandidates(params.daysThreshold || 3);
      const addedItems = [];
      for (const cand of candidates) {
        CartEngine.addItem({
          sku: cand.item.sku,
          quantity: cand.recommendedQuantity,
          addedBy: 'predictive_restock',
          supermarket: params.supermarket,
        });
        addedItems.push({
          sku: cand.item.sku,
          name: cand.item.product.name,
          quantity: cand.recommendedQuantity,
          daysUntilEmpty: cand.item.daysUntilEmpty,
        });
      }
      result = {
        success: true,
        restockedCount: addedItems.length,
        items: addedItems,
        cart: CartEngine.getCart(),
      };
    } else {
      return c.json({ error: `Tool ${toolName} desconhecida` }, 404);
    }

    recordMcpLog(toolName, params, result, Date.now() - t0, 'success');
    return c.json({
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      result,
    });
  } catch (err: any) {
    const errObj = { error: err.message };
    recordMcpLog(toolName, params, errObj, Date.now() - t0, 'error');
    return c.json({ error: err.message }, 500);
  }
});
