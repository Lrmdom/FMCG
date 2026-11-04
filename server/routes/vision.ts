import { Hono } from 'hono';
import { CascadeEngine } from '../services/cascade-engine.ts';
import { PRESET_VISION_SCENARIOS } from '../../shared/constants.ts';
import type { VisionAnalysisResult, FmcgProduct, SimpleVisionResult, SimpleProduct } from '../../shared/types.ts';

function toSimpleProduct(p: FmcgProduct): SimpleProduct {
  return JSON.parse(JSON.stringify({
    sku: p.sku,
    name: p.name || p.title || '',
    imageUrl: p.imageUrl,
    basePrice: p.basePrice,
    unit: p.unit,
  }));
}

function simplifyVisionResult(result: VisionAnalysisResult): SimpleVisionResult {
  // Deep clone via JSON to strip non-enumerable properties and ensure pure JSON objects.
  // Cloudflare Workers Hono c.json() corrupts objects with non-enumerable props into flat arrays.
  return JSON.parse(JSON.stringify({
    scanId: result.scanId,
    timestamp: result.timestamp,
    detectedItems: result.detectedItems.map((item) => ({
      sku: item.sku,
      confidence: item.confidence,
      detectionMethod: item.detectionMethod,
      boundingBox: item.boundingBox,
      product: toSimpleProduct(item.product),
      alternativeSuggestions: (item.alternativeSuggestions || []).map(toSimpleProduct),
    })),
    cascadeTelemetry: result.cascadeTelemetry,
    totalLatencyMs: result.totalLatencyMs,
    totalCostUsd: result.totalCostUsd,
    gdprCompliant: result.gdprCompliant,
  }));
}

export const visionRouter = new Hono();

visionRouter.get('/presets', (c) => {
  return c.json({ presets: PRESET_VISION_SCENARIOS });
});

visionRouter.post('/analyze', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    let imageBase64: string | undefined;
    let imageUrl: string | undefined;
    let eanBarcode: string | undefined;
    let presetScenarioId: string | undefined;
    let forceMethod: string | undefined;
    let blurFaces: boolean = false;
    let lang: string | undefined;

    let imageInput: any;
    if (contentType.includes('application/json')) {
      const body = await c.req.json();
      imageInput = body.image || body.imageBase64;
      imageUrl = body.imageUrl;
      eanBarcode = body.eanBarcode;
      presetScenarioId = body.presetScenarioId;
      forceMethod = body.forceMethod;
      blurFaces = !!body.blurFaces;
      lang = body.lang;
    } else {
      const formData = await c.req.formData();
      imageInput = formData.get('image') || formData.get('imageBase64');
      imageUrl = formData.get('imageUrl') as string | undefined;
      eanBarcode = formData.get('eanBarcode') as string | undefined;
      presetScenarioId = formData.get('presetScenarioId') as string | undefined;
      forceMethod = formData.get('forceMethod') as string | undefined;
      blurFaces = formData.get('blurFaces') === 'true';
      //lang = formData.get('lang') as string | undefined;
      lang = "en"
    }

    if (imageInput && typeof imageInput !== 'string' && typeof (imageInput as any).arrayBuffer === 'function') {
      const buffer = await (imageInput as any).arrayBuffer();
      imageInput = Buffer.from(buffer).toString('base64');
    }

    const envBindings = (c.env && typeof c.env === 'object' && 'AI' in (c.env as object)) ? c.env : process.env;
    const result = await CascadeEngine.analyzeImage({
      image: typeof imageInput === 'string' ? imageInput : undefined,
      imageBase64: typeof imageInput === 'string' ? imageInput : undefined,
      imageUrl,
      eanBarcode,
      presetScenarioId,
      forceMethod: forceMethod as any,
      blurFaces,
      lang,
    }, envBindings);
    const simplified = simplifyVisionResult(result);
    console.log('[Vision] Simplified result:', JSON.stringify(simplified, null, 2).substring(0, 500));
    return c.json(simplified);
  } catch (error: any) {
    console.log('Erro ao processar imagem', error);
    return c.json({ error: error.message || 'Erro ao processar imagem' }, 500);
  }
});
