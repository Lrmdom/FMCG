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
    products:result.product,
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
    try {
      if (contentType.includes('application/json')) {
        const body = await c.req.json();
        imageInput = body.image || body.imageBase64 || body.file;
        imageUrl = body.imageUrl;
        eanBarcode = body.eanBarcode;
        presetScenarioId = body.presetScenarioId;
        forceMethod = body.forceMethod;
        blurFaces = !!body.blurFaces;
        lang = body.lang || 'en';
      } else {
        const formData = await c.req.formData();
        imageInput = formData.get('image') || formData.get('imageBase64') || formData.get('file') || formData.get('img');
        imageUrl = formData.get('imageUrl') as string | undefined;
        eanBarcode = formData.get('eanBarcode') as string | undefined;
        presetScenarioId = formData.get('presetScenarioId') as string | undefined;
        forceMethod = formData.get('forceMethod') as string | undefined;
        blurFaces = formData.get('blurFaces') === 'true';
        lang = (formData.get('lang') as string | undefined) || 'en';
      }
    } catch (parseErr: any) {
      console.error('Erro ao parsear requisição (JSON/FormData):', parseErr);
      return c.json({ error: 'Formato de requisição inválido: ' + (parseErr.message || parseErr) }, 400);
    }

    if (imageInput && typeof imageInput !== 'string' && typeof (imageInput as any).arrayBuffer === 'function') {
      try {
        const buffer = await (imageInput as any).arrayBuffer();
        imageInput = Buffer.from(buffer).toString('base64');
      } catch (bufErr: any) {
        console.error('Erro ao converter arquivo de imagem para buffer/base64:', bufErr);
        return c.json({ error: 'Falha ao processar arquivo de imagem anexado' }, 400);
      }
    }

    const envBindings = (c.env && typeof c.env === 'object' && ('AI' in (c.env as object) || 'FILESYSTEM_BUCKET' in (c.env as object))) ? c.env : process.env;

    let result;
    try {
      result = await CascadeEngine.analyzeImage({
        image: typeof imageInput === 'string' ? imageInput : undefined,
        imageBase64: typeof imageInput === 'string' ? imageInput : undefined,
        imageUrl,
        eanBarcode,
        presetScenarioId,
        forceMethod: forceMethod as any,
        blurFaces,
        lang,
      }, envBindings);
    } catch (aiErr: any) {
      console.error('Erro na execução do CascadeEngine / AI.run:', aiErr);
      return c.json({ error: aiErr.message || 'Erro na execução da inteligência artificial' }, 500);
    }

    if (!result) {
      return c.json({ error: 'Nenhum resultado obtido da análise visual' }, 500);
    }

    const simplified = simplifyVisionResult(result);
    console.log('[Vision] Simplified result:', JSON.stringify(simplified, null, 2).substring(0, 500));
    return c.json(simplified);
  } catch (error: any) {
    console.error('Erro crítico em POST /api/vision/analyze:', error);
    return c.json({ error: error.message || 'Erro interno ao processar análise visual' }, 500);
  }
});
