import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CartEngine } from '../services/cart-engine.ts';
import { PantryEngine } from '../services/pantry-engine.ts';
import { VectorSearchService } from '../services/vector-search.ts';
import { CascadeEngine } from '../services/cascade-engine.ts';
import { FMCG_CATALOG } from '../../shared/catalog.ts';
import type { McpToolLog } from '../../shared/types.ts';

export const mcpExecutionLogs: McpToolLog[] = [];

export function recordMcpLog(
  toolName: string, 
  params: Record<string, any>, 
  result: any, 
  durationMs: number, 
  status: 'success' | 'error' = 'success'
) {
  mcpExecutionLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    toolName,
    params,
    result,
    durationMs,
    status,
  });

  if (mcpExecutionLogs.length > 50) {
    mcpExecutionLogs.pop();
  }
}

/**
 * Servidor MCP Integrado com Commerce Layer Core MCP (https://docs.commercelayer.io/ai/mcp/servers/core)
 * e SDK Oficial @modelcontextprotocol/sdk
 */
export const fmcgMcpServer = new McpServer({
  name: 'commercelayer-fmcg-core-mcp',
  version: '1.0.0',
});

// Tool 1: add_item_to_cart (Mapeado para Commerce Layer line_items.create)
fmcgMcpServer.tool(
  'add_item_to_cart',
  'Adiciona um SKU ao carrinho ativo através do Commerce Layer Core MCP (line_items.create)',
  {
    cartId: z.string().describe('ID da Order/Carrinho no Commerce Layer'),
    sku: z.string().describe('Código SKU validado pela cascata visual (ex: FMCG-LEI-001)'),
    quantity: z.number().default(1).describe('Quantidade a adicionar'),
    supermarket: z.enum(['Continente', 'Pingo Doce', 'Auchan', 'Mercadona']).optional().describe('Supermercado parceiro'),
  },
  async ({ cartId, sku, quantity, supermarket }) => {
    const t0 = Date.now();
    try {
      const res = CartEngine.addItem({
        sku,
        quantity: quantity || 1,
        addedBy: 'mcp_tool',
        supermarket,
      });
      const resultObj = {
        success: true,
        commerceLayerEndpoint: 'https://docs.commercelayer.io/ai/mcp/servers/core',
        orderId: cartId,
        lineItemId: res.lineItem.id,
        sku: res.lineItem.sku,
        productName: res.lineItem.product.name,
        quantity: res.lineItem.quantity,
        unitPrice: res.lineItem.unitPrice,
        cartTotal: res.cart.total,
        timestamp: Date.now(),
      };
      recordMcpLog('add_item_to_cart', { cartId, sku, quantity, supermarket }, resultObj, Date.now() - t0, 'success');
      return {
        content: [{ type: 'text', text: JSON.stringify(resultObj, null, 2) }],
      };
    } catch (err: any) {
      const errObj = { success: false, error: err.message };
      recordMcpLog('add_item_to_cart', { cartId, sku, quantity, supermarket }, errObj, Date.now() - t0, 'error');
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(errObj, null, 2) }],
      };
    }
  }
);

// Tool 2: get_product_details (Mapeado para Commerce Layer skus.retrieve / prices)
fmcgMcpServer.tool(
  'get_product_details',
  'Obtém informações detalhadas e preços através do Commerce Layer Core MCP (skus.retrieve)',
  {
    sku: z.string().describe('Código SKU ou Código de barras EAN'),
  },
  async ({ sku }) => {
    const t0 = Date.now();
    const product = FMCG_CATALOG.find(p => p.sku === sku || p.ean === sku);
    if (!product) {
      const res = { found: false, error: `Produto ${sku} não encontrado` };
      recordMcpLog('get_product_details', { sku }, res, Date.now() - t0, 'error');
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
      };
    }
    const equivalents = await VectorSearchService.findEquivalents(product.sku, 3);
    const resultObj = {
      found: true,
      product,
      equivalents,
      commerceLayerResource: 'skus',
    };
    recordMcpLog('get_product_details', { sku }, resultObj, Date.now() - t0, 'success');
    return {
      content: [{ type: 'text', text: JSON.stringify(resultObj, null, 2) }],
    };
  }
);

// Tool 3: suggest_equivalent_products
fmcgMcpServer.tool(
  'suggest_equivalent_products',
  'Pesquisa semântica vetorial (pgvector) para encontrar marcas brancas ou alternativas mais económicas',
  {
    skuOrQuery: z.string().describe('Código SKU alvo ou termo de pesquisa'),
    limit: z.number().default(3).describe('Número máximo de sugestões'),
  },
  async ({ skuOrQuery, limit }) => {
    const t0 = Date.now();
    const isSku = FMCG_CATALOG.some(p => p.sku === skuOrQuery);
    let results;
    if (isSku) {
      results = await VectorSearchService.findEquivalents(skuOrQuery, limit || 3);
    } else {
      results = (await VectorSearchService.searchByQuery(skuOrQuery, limit || 5)).map(p => ({
        product: p,
        similarityScore: 0.85,
        priceSavingsEur: 0,
        priceSavingsPercent: 0,
      }));
    }
    const res = { count: results.length, suggestions: results };
    recordMcpLog('suggest_equivalent_products', { skuOrQuery, limit }, res, Date.now() - t0, 'success');
    return {
      content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
    };
  }
);

// Tool 4: scan_pantry_items
fmcgMcpServer.tool(
  'scan_pantry_items',
  'Processa uma fotografia de despensa através da cascata visual de IA e deteta SKUs para o Commerce Layer',
  {
    presetScenarioId: z.string().optional().describe('Cenário de teste (ex: fridge_morning, pantry_breakfast, empty_box_blur)'),
    eanBarcode: z.string().optional().describe('Código de barras EAN se lido diretamente'),
    forceMethod: z.enum(['barcode', 'edge_ai', 'gemini_fallback']).optional().describe('Forçar nível da cascata'),
  },
  async ({ presetScenarioId, eanBarcode, forceMethod }) => {
    const t0 = Date.now();
    const result = await CascadeEngine.analyzeImage({
      presetScenarioId,
      eanBarcode,
      forceMethod,
    }, {});
    recordMcpLog('scan_pantry_items', { presetScenarioId, eanBarcode, forceMethod }, result, Date.now() - t0, 'success');
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Tool 5: get_pantry_inventory
fmcgMcpServer.tool(
  'get_pantry_inventory',
  'Consulta o inventário da despensa inteligente e identifica produtos com esgotamento iminente',
  {
    location: z.enum(['pantry', 'fridge', 'freezer', 'cleaning']).optional().describe('Filtrar por divisão'),
  },
  async ({ location }) => {
    const t0 = Date.now();
    const inventory = PantryEngine.getInventory(location);
    const restockCandidates = PantryEngine.getRestockCandidates(3);
    const result = {
      totalItems: inventory.length,
      itemsAtRiskCount: restockCandidates.length,
      inventory,
      urgentRestock: restockCandidates,
    };
    recordMcpLog('get_pantry_inventory', { location }, result, Date.now() - t0, 'success');
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Tool 6: trigger_predictive_restock (Commerce Layer Orders / Subscriptions)
fmcgMcpServer.tool(
  'trigger_predictive_restock',
  'Cria itens de reposição no Commerce Layer Core MCP para produtos abaixo do limiar de dias',
  {
    daysThreshold: z.number().default(3).describe('Limiar de dias restantes para reposição'),
    supermarket: z.enum(['Continente', 'Pingo Doce', 'Auchan', 'Mercadona']).optional().describe('Supermercado de preferência'),
  },
  async ({ daysThreshold, supermarket }) => {
    const t0 = Date.now();
    const candidates = PantryEngine.getRestockCandidates(daysThreshold || 3);
    const addedItems = [];

    for (const cand of candidates) {
      const res = CartEngine.addItem({
        sku: cand.item.sku,
        quantity: cand.recommendedQuantity,
        addedBy: 'predictive_restock',
        supermarket,
      });
      addedItems.push({
        sku: cand.item.sku,
        name: cand.item.product.name,
        quantity: cand.recommendedQuantity,
        daysUntilEmpty: cand.item.daysUntilEmpty,
      });
    }

    const result = {
      success: true,
      commerceLayerCore: 'https://docs.commercelayer.io/ai/mcp/servers/core',
      restockedCount: addedItems.length,
      items: addedItems,
      cart: CartEngine.getCart(),
      timestamp: Date.now(),
    };
    recordMcpLog('trigger_predictive_restock', { daysThreshold, supermarket }, result, Date.now() - t0, 'success');
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);
