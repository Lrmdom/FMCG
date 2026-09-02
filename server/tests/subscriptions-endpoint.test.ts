import { Hono } from 'hono';
import { subscriptionsRouter } from '../routes/subscriptions.ts';

const app = new Hono();
app.route('/api/subscriptions', subscriptionsRouter);

async function testSubscriptionEndpoint() {
  console.log('🧪 Testando Endpoint POST /api/subscriptions/send-microstore...');
  
  const res = await app.request('/api/subscriptions/send-microstore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: 'FMCG-LEI-001',
      frequency: 'weekly',
      email: 'test@example.com'
    }),
  });

  const json = await res.json();

  if (res.status === 200 && json.subscriptionId && json.microstoreUrl) {
    console.log('✅ Endpoint retornou 200 e dados corretos.');
    process.exit(0);
  } else {
    console.error('❌ Endpoint retornou status/dados inesperados:', res.status, json);
    process.exit(1);
  }
}

testSubscriptionEndpoint().catch(e => { console.error(e); process.exit(1); });
