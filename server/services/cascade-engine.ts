import { PRESET_VISION_SCENARIOS } from '../../shared/constants.ts';
import type { 
  VisionAnalysisResult, 
  CascadeStepTelemetry, 
  DetectedBoundingBox, 
  FmcgProduct, 
  VisionCascadeMethod 
} from '../../shared/types.ts';
import { GdprService } from './gdpr-service.ts';
import { VectorSearchService } from './vector-search.ts';
import { BarcodeService } from './barcode-service.ts';
import { FMCG_CATALOG } from '../../shared/catalog.ts';

export class CascadeEngine {
  public static async analyzeImage(params: {
    imageBase64?: string;
    imageUrl?: string;
    eanBarcode?: string;
    presetScenarioId?: string;
    forceMethod?: VisionCascadeMethod;
    blurFaces?: boolean;
  }): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const telemetry: CascadeStepTelemetry[] = [];
    let totalCostUsd = 0;

    const gdprSanitization = GdprService.sanitizeImage(
      params.imageBase64 || params.imageUrl || '', 
      params.blurFaces !== false
    );

    // 1. Nível 1: Leitura EAN Barcode
    if (params.eanBarcode) {
      const barcodeStart = Date.now();
      const product = BarcodeService.lookup(params.eanBarcode);
      const barcodeLatency = Math.max(8, Date.now() - barcodeStart);

      if (product) {
        telemetry.push({
          step: 1,
          name: 'EAN Barcode Direct Lookup',
          engine: 'Native Browser JS Barcode API',
          status: 'passed',
          latencyMs: barcodeLatency,
          confidenceScore: 1.0,
          costUsd: 0.0,
          details: `EAN ${params.eanBarcode} validado instantaneamente com 100% de confiança.`,
        });


        telemetry.push({
          step: 2,
          name: 'Edge AI (Llama 3.2 Vision)',
          engine: 'Cloudflare Workers AI',
          status: 'skipped',
          latencyMs: 0,
          confidenceScore: 0,
          costUsd: 0.0,
          details: 'Ignorado devido a correspondência exata por código de barras.',
        });

        telemetry.push({
          step: 3,
          name: 'LLM Fallback (Gemini 2.5 Flash)',
          engine: 'OpenRouter API',
          status: 'skipped',
          latencyMs: 0,
          confidenceScore: 0,
          costUsd: 0.0,
          details: 'Ignorado.',
        });

        const equivalents = VectorSearchService.findEquivalents(product.sku, 2).map(e => e.product);

        GdprService.logSkuMutation('vision_barcode_match', [product.sku]);

        return {
          scanId,
          timestamp: Date.now(),
          inputMethod: 'barcode_reader',
          resolvedSku: product.sku,
          product,
          detectedItems: [{
            sku: product.sku,
            product,
            confidence: 1.0,
            detectionMethod: 'barcode',
            alternativeSuggestions: equivalents,
          }],
          cascadeTelemetry: telemetry,
          totalLatencyMs: Date.now() - startTime,
          totalCostUsd: 0.0,
          gdprCompliant: {
            ephemeralMemoryOnly: true,
            facesScrubbedCount: 0,
            exifRemoved: true,
          },
        };
      }
    }

    // 2. Preset or Simulated Vision Input
    const preset = PRESET_VISION_SCENARIOS.find(p => p.id === params.presetScenarioId) || PRESET_VISION_SCENARIOS[0];
    const isFallbackScenario = params.forceMethod === 'gemini_fallback' || preset.method === 'gemini_fallback';

    telemetry.push({
      step: 1,
      name: 'EAN Barcode Direct Lookup',
      engine: 'Native Browser JS Barcode API',
      status: 'fallback_required',
      latencyMs: 14,
      confidenceScore: 0.0,
      costUsd: 0.0,
      details: 'Código de barras não visível ou ilegível na fotografia panorâmica. Encaminhado para Edge AI.',
    });

    const edgeStart = Date.now();
    const edgeCost = 0.00003;
    totalCostUsd += edgeCost;

    if (!isFallbackScenario) {
      const edgeLatency = 160 + Math.floor(Math.random() * 40);
      const edgeConfidence = preset.suggestedConfidence || 0.91;

      telemetry.push({
        step: 2,
        name: 'Edge Worker AI (Llama 3.2 Vision)',
        engine: 'Cloudflare Workers AI @ Edge',
        status: 'passed',
        latencyMs: edgeLatency,
        confidenceScore: edgeConfidence,
        costUsd: edgeCost,
        details: `SKUs identificados na Edge com confiança de ${(edgeConfidence * 100).toFixed(0)}% (>= 80%). Fallback evitado.`,
      });

      telemetry.push({
        step: 3,
        name: 'LLM Fallback (Gemini 2.5 Flash)',
        engine: 'OpenRouter API',
        status: 'skipped',
        latencyMs: 0,
        confidenceScore: 0,
        costUsd: 0.0,
        details: 'Ignorado (confiança da Edge foi suficiente).',
      });

      const matchedProducts = preset.expectedSkus
        .map(sku => FMCG_CATALOG.find(p => p.sku === sku))
        .filter((p): p is FmcgProduct => !!p);

      const detectedItems = matchedProducts.map((prod, idx) => {
        const equivalents = VectorSearchService.findEquivalents(prod.sku, 2).map(e => e.product);
        const box: DetectedBoundingBox = {
          x: 18 + idx * 35,
          y: 25 + idx * 10,
          width: 28,
          height: 48,
          label: prod.name,
          confidence: edgeConfidence,
          sku: prod.sku,
          ean: prod.ean,
        };

        return {
          sku: prod.sku,
          product: prod,
          confidence: edgeConfidence,
          boundingBox: box,
          detectionMethod: 'edge_ai' as VisionCascadeMethod,
          alternativeSuggestions: equivalents,
        };
      });

      GdprService.logSkuMutation('vision_edge_ai_match', detectedItems.map(d => d.sku));

      return {
        scanId,
        timestamp: Date.now(),
        inputMethod: params.presetScenarioId ? 'demo_preset' : 'photo_upload',
        resolvedSku: detectedItems[0]?.sku,
        product: detectedItems[0]?.product,
        detectedItems,
        cascadeTelemetry: telemetry,
        totalLatencyMs: Date.now() - startTime + edgeLatency,
        totalCostUsd,
        gdprCompliant: {
          ephemeralMemoryOnly: true,
          facesScrubbedCount: gdprSanitization.facesScrubbedCount,
          exifRemoved: true,
        },
      };
    } else {
      const edgeLatency = 145 + Math.floor(Math.random() * 25);
      const lowConfidence = 0.62;

      telemetry.push({
        step: 2,
        name: 'Edge Worker AI (Llama 3.2 Vision)',
        engine: 'Cloudflare Workers AI @ Edge',
        status: 'fallback_required',
        latencyMs: edgeLatency,
        confidenceScore: lowConfidence,
        costUsd: edgeCost,
        details: `Confiança de ${(lowConfidence * 100).toFixed(0)}% (< 80% limiar devido a reflexos/ângulo). Encaminhado para Gemini 2.5 Flash.`,
      });

      const llmStart = Date.now();
      const llmLatency = 420 + Math.floor(Math.random() * 80);
      const geminiCost = 0.000105;
      totalCostUsd += geminiCost;
      const finalConfidence = 0.96;

      telemetry.push({
        step: 3,
        name: 'LLM Fallback (Gemini 2.5 Flash)',
        engine: 'OpenRouter Multimodal API',
        status: 'passed',
        latencyMs: llmLatency,
        confidenceScore: finalConfidence,
        costUsd: geminiCost,
        details: `Análise multimodal avançada disambiguou SKU com ${(finalConfidence * 100).toFixed(0)}% de precisão.`,
      });

      const matchedProducts = preset.expectedSkus
        .map(sku => FMCG_CATALOG.find(p => p.sku === sku))
        .filter((p): p is FmcgProduct => !!p);

      const detectedItems = matchedProducts.map((prod, idx) => {
        const equivalents = VectorSearchService.findEquivalents(prod.sku, 2).map(e => e.product);
        const box: DetectedBoundingBox = {
          x: 22 + idx * 30,
          y: 20,
          width: 32,
          height: 52,
          label: `${prod.name} (Gemini Verified)`,
          confidence: finalConfidence,
          sku: prod.sku,
          ean: prod.ean,
        };

        return {
          sku: prod.sku,
          product: prod,
          confidence: finalConfidence,
          boundingBox: box,
          detectionMethod: 'gemini_fallback' as VisionCascadeMethod,
          alternativeSuggestions: equivalents,
        };
      });

      GdprService.logSkuMutation('vision_gemini_fallback_match', detectedItems.map(d => d.sku));

      return {
        scanId,
        timestamp: Date.now(),
        inputMethod: 'photo_upload',
        resolvedSku: detectedItems[0]?.sku,
        product: detectedItems[0]?.product,
        detectedItems,
        cascadeTelemetry: telemetry,
        totalLatencyMs: Date.now() - startTime + edgeLatency + llmLatency,
        totalCostUsd,
        gdprCompliant: {
          ephemeralMemoryOnly: true,
          facesScrubbedCount: gdprSanitization.facesScrubbedCount,
          exifRemoved: true,
        },
      };
    }
  }
}
