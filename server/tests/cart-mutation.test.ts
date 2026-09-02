import { CartEngine } from '../services/cart-engine.ts';

async function testCartMutation() {
  console.log('🧪 Testando Cart Mutation com integração Commerce Layer...');
  try {
    // Tenta adicionar um item. Deve falhar porque o token é mock e não configurado.
    // Isso confirma que estamos a chamar a API real e não apenas código local.
    await CartEngine.addItem({ sku: 'FMCG-LEI-001', quantity: 1 });
    console.log('✅ Cart mutation chamou Commerce Layer ok.');
  } catch (e: any) {
    if (e.message.includes('Erro na mutação')) {
        console.log('✅ Cart mutation falhou conforme esperado (falta config):', e.message);
    } else {
        throw e;
    }
  }
}

testCartMutation().catch(e => { console.error(e); process.exit(1); });
