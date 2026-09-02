import { SubscriptionService } from '../services/subscription.ts';

async function testCreateSubscriptionModel() {
  console.log('🧪 Testando criação de Subscription Model (Green phase)...');
  
  const frequency = 'weekly';
  const result = await SubscriptionService.createSubscriptionModel({
    frequency: frequency,
    skuList: [{ sku_code: 'TEST-SKU', quantity: 1 }],
    customerEmail: 'test@example.com'
  });
  
  if (!result.id) {
    throw new Error('Falha na criação de subscrição');
  }
  
  // Verify if it is the mock or a real object
  if (result.name !== `FMCG Subscription ${frequency}`) {
    throw new Error(`Nome incorreto: ${result.name}`);
  }

  console.log('✅ Subscription model criada ok:', result.id);
}

testCreateSubscriptionModel().catch(e => { console.error(e); process.exit(1); });
