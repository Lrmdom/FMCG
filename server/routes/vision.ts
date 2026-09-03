import { Hono } from 'hono';
import { CascadeEngine } from '../services/cascade-engine.ts';
import { PRESET_VISION_SCENARIOS } from '../../shared/constants.ts';

export const visionRouter = new Hono();

visionRouter.get('/presets', (c) => {
  return c.json({ presets: PRESET_VISION_SCENARIOS });
});

visionRouter.post('/analyze', async (c) => {
  try {
    const formData = await c.req.formData();
    const result = await CascadeEngine.analyzeImage({
      imageBase64: formData.get('imageBase64') as string | undefined,
      imageUrl: formData.get('imageUrl') as string | undefined,
      eanBarcode: formData.get('eanBarcode') as string | undefined,
      presetScenarioId: formData.get('presetScenarioId') as string | undefined,
      forceMethod: formData.get('forceMethod') as string | undefined,
      blurFaces: formData.get('blurFaces') === 'true',
    });
    return c.json(result);
  } catch (error: any) {
    console.log('Erro ao processar imagem', error);
    return c.json({ error: error.message || 'Erro ao processar imagem' }, 500);
  }
});
