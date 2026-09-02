import { Hono } from 'hono';
import { CascadeEngine } from '../services/cascade-engine.ts';
import { PRESET_VISION_SCENARIOS } from '../../shared/constants.ts';

export const visionRouter = new Hono();

visionRouter.get('/presets', (c) => {
  return c.json({ presets: PRESET_VISION_SCENARIOS });
});

visionRouter.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const result = await CascadeEngine.analyzeImage({
      imageBase64: body.imageBase64,
      imageUrl: body.imageUrl,
      eanBarcode: body.eanBarcode,
      presetScenarioId: body.presetScenarioId,
      forceMethod: body.forceMethod,
      blurFaces: body.blurFaces,
    });
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message || 'Erro ao processar imagem' }, 500);
  }
});
