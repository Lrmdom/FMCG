import { CascadeEngine } from '../services/cascade-engine.ts';

async function testGeminiFallback() {
  console.log('🧪 Testando Gemini Fallback...');
  const result = await CascadeEngine.analyzeImage({
    presetScenarioId: 'complex_fridge_cluttered', // Assume-se que este cenário força o fallback no CascadeEngine
    forceMethod: 'gemini_fallback'
  });
  
  if (result.detectedItems.length === 0) {
    throw new Error('Falha no Gemini Fallback: Nenhum item detetado');
  }
  
  const step3 = result.cascadeTelemetry.find(t => t.name === 'LLM Fallback (Gemini 2.5 Flash)');
  if (step3?.status !== 'passed') {
     throw new Error('Falha no Gemini Fallback: Passo não passou');
  }
  
  console.log('✅ Gemini Fallback ok.');
}

async function runAll() {
  try {
    await testGeminiFallback();
    console.log('🎉 Testes de IA passaram!');
  } catch (e) {
    console.error('❌ Falha:', e);
    process.exit(1);
  }
}

runAll();
