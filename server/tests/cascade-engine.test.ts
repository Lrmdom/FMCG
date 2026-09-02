import { CascadeEngine } from '../services/cascade-engine.ts';

async function testBarcodeLookup() {
  console.log('🧪 Testando Barcode Lookup...');
  const result = await CascadeEngine.analyzeImage({
    eanBarcode: '5601009901015' // Leite Meio Gordo Mimosa 1L
  });
  
  if (result.inputMethod !== 'barcode_reader') {
    throw new Error('Falha no barcode reader');
  }
  console.log('✅ Barcode lookup ok.');
}

async function runAll() {
  try {
    await testBarcodeLookup();
    console.log('🎉 Todos os testes de CascadeEngine passaram!');
  } catch (e) {
    console.error('❌ Falha:', e);
    process.exit(1);
  }
}

runAll();
