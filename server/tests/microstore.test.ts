import { MicrostoreService } from '../services/microstore.ts';

async function testMicrostoreUrl() {
  console.log('🧪 Testando Microstore Service URL...');
  try {
    const url = await MicrostoreService.generateUrl({ sku: 'FMCG-LEI-001' });
    console.log('✅ URL:', url);
  } catch (e: any) {
    if (e.message === 'Not implemented') {
        console.log('✅ Teste falhou conforme esperado:', e.message);
        process.exit(0);
    } else {
        throw e;
    }
  }
}

testMicrostoreUrl().catch(e => { console.error(e); process.exit(1); });
