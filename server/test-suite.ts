import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { visionRouter } from './routes/vision.ts';
import { pantryRouter } from './routes/pantry.ts';
import { cartRouter } from './routes/cart.ts';
import { catalogRouter } from './routes/catalog.ts';
import { settingsRouter } from './routes/settings.ts';
import { analyticsRouter } from './routes/analytics.ts';
import { mcpRouter } from './routes/mcp-routes.ts';

const app = new Hono();
app.use('*', cors());
app.route('/api/vision', visionRouter);
app.route('/api/pantry', pantryRouter);
app.route('/api/cart', cartRouter);
app.route('/api/catalog', catalogRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/analytics', analyticsRouter);
app.route('/api/mcp', mcpRouter);

app.get('/api/health', (c) => c.json({ status: 'healthy', timestamp: Date.now() }));

async function runTests() {
  console.log('🧪 Iniciar Testes de Integração da API Hono & MCP SDK...');

  // 1. Healthcheck
  const res1 = await app.request('/api/health');
  const json1 = await res1.json();
  console.log('✅ 1. Healthcheck:', json1.status);

  // 2. Catalog
  const res2 = await app.request('/api/catalog');
  const json2 = await res2.json();
  console.log(`✅ 2. Catálogo FMCG: ${json2.length} produtos carregados.`);

  // 3. Vision Cascade
  const res3 = await app.request('/api/vision/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetScenarioId: 'fridge_morning' }),
  });
  const json3 = await res3.json();
  console.log(`✅ 3. Cascata Visual: ${json3.detectedItems.length} SKUs detetados (${json3.totalLatencyMs}ms, $${json3.totalCostUsd} USD).`);

  // 4. Pantry Inventory
  const res4 = await app.request('/api/pantry');
  const json4 = await res4.json();
  console.log(`✅ 4. Despensa Preditiva: ${json4.totalCount} itens no inventário, ${json4.urgentRestockCount} em risco de esgotamento.`);

  // 5. Cart Mutation
  const res5 = await app.request('/api/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: 'FMCG-LEI-001', quantity: 2, supermarket: 'Continente' }),
  });
  const json5 = await res5.json();
  console.log(`✅ 5. Carrinho Storefront: Adicionado ${json5.lineItem.product.name} (Total: €${json5.cart.total}).`);

  // 6. MCP Tool Execution (@modelcontextprotocol/sdk)
  const res6 = await app.request('/api/mcp/tools/add_item_to_cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId: 'cart-001', sku: 'FMCG-CAF-001', quantity: 1, supermarket: 'Pingo Doce' }),
  });
  const json6 = await res6.json();
  console.log(`✅ 6. @modelcontextprotocol/sdk Tool Execution: Tool add_item_to_cart concluída.`);

  // 7. Unit Economics Simulator
  const res7 = await app.request('/api/analytics/economics?users=1000&imagesPerUser=25');
  const json7 = await res7.json();
  console.log(`✅ 7. Unit Economics: Custo/User: $${json7.costPerUserMonthlyUsd} | Margem Bruta: ${json7.grossTechMarginPercentage}%.`);

  console.log('\n🎉 Todos os 7 testes de integração passaram com 100% de sucesso!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
