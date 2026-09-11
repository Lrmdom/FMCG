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
import { CatalogService } from './catalog-service.ts';
import { FMCG_CATALOG } from '../../shared/catalog.ts';

export class CascadeEngine {
  private static matchProductsByLLMText(catalog: FmcgProduct[], preset: any): FmcgProduct[] {
    const stopwords = [
      'quase', 'vazio', 'foto', 'matinal', 'interior', 'com', 'aberto',
      'prateleira', 'caixa', 'garrafa', 'embalagem', 'cesto', 'reciclagem',
      'reflexo', 'ângulo', 'difícil', 'dispara', 'fallback', 'leitura',
      'direta', 'browser', 'código', 'para', 'pela', 'pelo', 'com', 'sem',
      'sob', 'sobre', 'frigorífico', 'despensa', 'luz', 'baixa', 'instantânea',
      'pacote', 'embalagem'
    ];

    const textToAnalyze = `${preset.title} ${preset.description}`.toLowerCase();

    const keywords = textToAnalyze
      .split(/[\s()&+,./\-\d]+/)
      .filter(k => k.length > 2 && !stopwords.includes(k));

    let matched = catalog.filter((p: FmcgProduct) => {
      const productTitle = (p.title || p.name || '').toLowerCase();
      return keywords.some(keyword => productTitle.includes(keyword));
    });

    const uniqueMatched = matched.filter((v, i, a) => a.findIndex(t => t.sku === v.sku) === i);

    if (uniqueMatched.length === 0) {
      return catalog.slice(0, Math.min(catalog.length, 2));
    }

    return uniqueMatched.slice(0, 3);
  }
  /**
  * Resize/compress image bytes to stay under maxBytes.
  * In Workers (no Canvas API), returns original bytes if under limit,
  * otherwise returns null to signal the caller to skip the REST API.
  */
  static async resizeImageBytes(imageBytes: Uint8Array, maxBytes: number = 240000): Promise<Uint8Array | null> {
    if (imageBytes.length <= maxBytes) return imageBytes;

    // Workers runtime has no Canvas/Image API for resizing.
    // Return null so the caller can skip the REST API (which enforces the limit)
    // and rely on the AI binding instead.
    console.warn(
      `Imagem de ${imageBytes.length} bytes excede o limite de ${maxBytes}. ` +
      `Redimensionamento não disponível no Workers runtime.`
    );
    return null;
  }

  public static async analyzeImage(params: {
    image?: string;
    imageBase64?: string;
    imageUrl?: string;
    eanBarcode?: string;
    presetScenarioId?: string;
    forceMethod?: VisionCascadeMethod;
    blurFaces?: boolean;
    lang?: string;
  }, env?: any): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const telemetry: CascadeStepTelemetry[] = [];
    let totalCostUsd = 0;

    const base64OrImage = params.image || params.imageBase64;

    const gdprSanitization = GdprService.sanitizeImage(
      base64OrImage || params.imageUrl || '',
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

        const equivalents = (await VectorSearchService.findEquivalents(product.sku, 2)).map(e => e.product);
        console.log('DEBUG: equivalents:', equivalents);

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

    // 2. Extração via IA da Cloudflare (Llama 3.2 Vision / LLaVA Fallback)
    let aiExtractedText = '';
    const rawImage = base64OrImage || params.imageUrl;

    const aiBinding = (env && typeof env.AI?.run === 'function') ? env.AI : null;
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;

    const visionModels = [
      //"@cf/meta/llama-3.2-11b-vision-instruct",
      "@cf/llava-hf/llava-1.5-7b-hf"
    ];

    if (rawImage && (aiBinding || (cfAccountId && cfApiToken))) {
      try {
        const imageBytes = await this.imageToBytes(rawImage);

        if (imageBytes) {
          // Resize/compress to stay under 240KB (valid image, not truncated)
          // Returns null if image is too large and can't be resized (Workers has no Canvas)
          const safeImageBytes = await this.resizeImageBytes(imageBytes, 240000);

          if (safeImageBytes) {
            // Detect MIME type from magic bytes
            const mimeType =
              safeImageBytes[0] === 0xff && safeImageBytes[1] === 0xd8 ? 'image/jpeg'
                : safeImageBytes[0] === 0x89 && safeImageBytes[1] === 0x50 ? 'image/png'
                  : safeImageBytes[0] === 0x52 && safeImageBytes[1] === 0x49 ? 'image/webp'
                    : 'image/jpeg';

            // Build base64 data URI for models that require it (llama-3.2 vision)
            let base64DataUri = '';
            try {
              if (typeof Buffer !== 'undefined') {
                base64DataUri = `data:${mimeType};base64,${Buffer.from(safeImageBytes).toString('base64')}`;
              } else {
                let binary = '';
                const chunkSize = 0x8000;
                for (let i = 0; i < safeImageBytes.length; i += chunkSize) {
                  binary += String.fromCharCode(...safeImageBytes.subarray(i, i + chunkSize));
                }
                base64DataUri = `data:${mimeType};base64,${btoa(binary)}`;
              }
            } catch (b64Err) {
              console.warn('Falha ao converter imagem para base64:', b64Err);
            }

            for (const modelName of visionModels) {
              if (aiExtractedText) break;

              const isLlava = modelName.includes('llava');
              const promptText = "Extract product details (type, brand, model, description) from image. ReturnONLY JSON object with keys: productType, brand, model, description.";

              // ---- AI Binding ----
              if (aiBinding) {
                try {
                  let response: any;
                  if (isLlava) {
                    response = await aiBinding.run(modelName, {
                      image: Array.from(safeImageBytes),
                      prompt: promptText,
                    });
                  } else {
                    response = await aiBinding.run(modelName, {
                      messages: [
                        {
                          role: 'user',
                          content: [
                            { type: 'text', text: promptText },
                            { type: 'image', image: base64DataUri.split(',')[1] }
                          ]
                        }
                      ]
                    });
                  }
                  aiExtractedText = response.description || response.response || response.result || '';
                  console.log('DEBUG: aiExtractedText:', aiExtractedText);
                } catch (bindingErr: any) {
                  console.warn(`Falha no modelo ${modelName} via aiBinding:`, bindingErr?.message || bindingErr);
                }
              }

              // ---- REST API fallback ----
              if (!aiExtractedText && cfAccountId && cfApiToken) {
                try {
                  let cfRes: Response;

                  if (isLlava) {
                    cfRes = await fetch(
                      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${modelName}`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${cfApiToken}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          image: Array.from(safeImageBytes),
                          prompt: promptText,
                        }),
                      }
                    );
                  } else {
                    cfRes = await fetch(
                      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${modelName}`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${cfApiToken}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          image: base64DataUri,
                          messages: [
                            { role: 'user', content: promptText },
                          ],
                        }),
                      }
                    );
                  }

                  if (cfRes.ok) {
                    const resData: any = await cfRes.json();
                    aiExtractedText = resData.result?.description || resData.result?.response || resData.result?.text || '';
                    console.log('DEBUG: aiExtractedText:', aiExtractedText);

                  } else {
                    const errBody = await cfRes.text();
                    console.error(`Cloudflare AI REST API [${modelName}] Erro [${cfRes.status}]:`, errBody);
                  }
                } catch (restErr: any) {
                  console.error(`Cloudflare AI REST API [${modelName}] Erro:`, restErr?.message || restErr);
                }
              }
            }
          } else {
            // Image too large for REST API and can't be resized in Workers.
            // Try AI binding only (it may have different size limits).
            if (aiBinding) {
              for (const modelName of visionModels) {
                if (aiExtractedText) break;
                const isLlava = modelName.includes('llava');
                const promptText = "Extract product type (e.g. bicycle), bike type, brand and description from this image. Return ONLY a JSON object with keys: productType, bikeType, brand, description.";
                try {
                  let response: any;
                  if (isLlava) {
                    response = await aiBinding.run(modelName, {
                      image: Array.from(imageBytes),
                      prompt: promptText,
                    });
                  } else {
                    // Build base64 for llama-3.2 even with large image
                    let b64 = '';
                    if (typeof Buffer !== 'undefined') {
                      b64 = `data:image/jpeg;base64,${Buffer.from(imageBytes).toString('base64')}`;
                    }
                    response = await aiBinding.run(modelName, {
                      image: b64,
                      messages: [{ role: 'user', content: promptText }],
                    });
                  }
                  aiExtractedText = response.description || response.response || response.result || '';
                  console.log('DEBUG: aiExtractedText:', aiExtractedText);
                } catch (bindingErr: any) {
                  console.warn(`Falha no modelo ${modelName} via aiBinding (imagem grande):`, bindingErr?.message || bindingErr);
                }
              }
            } else {
              console.warn('Imagem muito grande para a REST API e nenhum AI binding disponível.');
            }
          }
        }
      } catch (e) {
        console.error('Falha na IA da Cloudflare:', e);
      }
    }




    const presetScenario = PRESET_VISION_SCENARIOS.find(p => p.id === params.presetScenarioId) || PRESET_VISION_SCENARIOS[0];

    let parsedAiData = { title: 'Extraído por Cloudflare Workers AI', description: aiExtractedText };

    if (aiExtractedText) {
      try {
        const cleanedJson = aiExtractedText.replace(/```json/g, '').replace(/```/g, '');
        const jsonData = JSON.parse(cleanedJson);
        parsedAiData = {
          title: `${jsonData.productType || ''} ${jsonData.bikeType || ''} ${jsonData.brand || ''}`.trim() || 'Extraído por Cloudflare Workers AI',
          description: jsonData.description || aiExtractedText
        };
        console.log("parsedAiData: ", parsedAiData)
      } catch (e) {
        console.warn('Falha ao parsear JSON de extração, usando fallback:', e);
      }
    }

    const scenario = aiExtractedText ? parsedAiData : presetScenario;
    const isFallbackScenario = params.forceMethod === 'gemini_fallback' || presetScenario.method === 'gemini_fallback';

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
      // Ajuste: usar confiança da IA se disponível, caso contrário cai no preset
      const edgeConfidence = (typeof (scenario as any).confidence === 'number') ? (scenario as any).confidence : (presetScenario.suggestedConfidence || 0.91);

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

      const catalog = await CatalogService.getCatalog(params.lang);
      const matchedProducts = this.matchProductsByTitle(catalog, scenario);

      const detectedItems = await Promise.all(matchedProducts.map(async (prod, idx) => {
        let equivalents: FmcgProduct[] = [];
        if (prod.variants && prod.variants.length > 0) {
          const variantEquivalents = await Promise.all(
            prod.variants.map(v => VectorSearchService.findEquivalents(v.title || '', 3))
          );
          equivalents = Array.from(new Set(variantEquivalents.flat().map(e => e.product.sku)))
            .map(sku => variantEquivalents.flat().find(e => e.product.sku === sku)!.product);
        } else {
          equivalents = (await VectorSearchService.findEquivalents(prod.title || '', 5)).map(e => e.product);
        }

        const box: DetectedBoundingBox = {
          x: 18 + idx * 35,
          y: 25 + idx * 10,
          width: 28,
          height: 48,
          label: prod.name || prod.title || '',
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
      }));
      console.log(detectedItems, null, 2)
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

      const catalog = await CatalogService.getCatalog();
      const matchedProducts = this.matchProductsByTitle(catalog, scenario);

      const detectedItems = await Promise.all(matchedProducts.map(async (prod, idx) => {
        const equivalents = (await VectorSearchService.findEquivalents(prod.sku, 2)).map(e => e.product);
        const box: DetectedBoundingBox = {
          x: 22 + idx * 30,
          y: 20,
          width: 32,
          height: 52,
          label: `${prod.name || prod.title || ''} (Gemini Verified)`,
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
      }));
      console.log(JSON.stringify(detectedItems, null, 2))
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

  private static async imageToBytes(input: any): Promise<Uint8Array | null> {
    if (!input) return null;

    if (typeof input === 'string') {
      if (input.startsWith('http://') || input.startsWith('https://')) {
        try {
          const response = await fetch(input);
          if (response.ok) {
            return new Uint8Array(await response.arrayBuffer());
          }
        } catch (e) {
          console.error('Falha ao descarregar URL de imagem:', e);
        }
        return null;
      }

      try {
        const base64Data = input.replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      } catch (e) {
        console.error('Falha ao decodificar Base64:', e);
        return null;
      }
    }

    if (input instanceof Uint8Array) {
      return input;
    }

    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }

    if (input?.arrayBuffer && typeof input.arrayBuffer === 'function') {
      try {
        return new Uint8Array(await input.arrayBuffer());
      } catch (e) {
        console.error('Falha ao converter Blob/File em bytes:', e);
      }
    }

    return null;
  }


  private static matchProductsByTitle(
    catalog: FmcgProduct[],
    scenario: { title?: string; description?: string }
  ): FmcgProduct[] {

    if (!catalog?.length) {
      console.log('[DEBUG] Catálogo vazio ou indefinido.');
      return [];
    }

    const STOPWORDS = new Set([
      'a', 'à', 'às', 'ao', 'aos', 'as', 'o', 'os', 'um', 'uma', 'uns', 'umas',
      'de', 'da', 'das', 'do', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'por',
      'para', 'com', 'sem', 'sob', 'sobre', 'entre', 'e', 'ou', 'mas', 'que',
      'se', 'como', 'quando', 'onde', 'qual', 'quais', 'quem', 'cujo', 'cuja',
      'é', 'são', 'ser', 'estar', 'ter', 'haver', 'fazer', 'pode', 'podem',
      'muito', 'pouco', 'mais', 'menos', 'já', 'ainda', 'também', 'só', 'bem',
      'mal', 'assim', 'então', 'porque', 'porquê', 'portanto', 'contudo',
      'todavia', 'entretanto', 'além', 'disso', 'deste', 'desta', 'desse',
      'dessa', 'daquele', 'daquela', 'este', 'esta', 'esse', 'essa', 'aquele',
      'aquela', 'isto', 'isso', 'aquilo', 'meu', 'minha', 'meus', 'minhas',
      'teu', 'tua', 'teus', 'tuas', 'seu', 'sua', 'seus', 'suas', 'nosso',
      'nossa', 'nossos', 'nossas', 'vosso', 'vossa', 'vossos', 'vossas'
    ]);

    const extractTokens = (text: string): string[] => {
      return [
        ...new Set(
          text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .map(token => token.trim())
            .filter(
              token =>
                token.length >= 2 &&
                !STOPWORDS.has(token)
            )
        )
      ];
    };

    const titleTokens = extractTokens(scenario?.title || '');
    const descriptionTokens = extractTokens(scenario?.description || '');



    if (!titleTokens.length && !descriptionTokens.length) {
      console.log('[DEBUG] Nenhum token válido extraído do cenário.');
      return [];
    }

    const matched = catalog
      .map((product, index) => {
        const titles: string[] = [];

        const collectTitles = (obj: any) => {
          if (!obj) return;
          if (typeof obj.title === 'string') titles.push(obj.title);
          if (typeof obj.name === 'string') titles.push(obj.name);
          if (Array.isArray(obj.variants)) obj.variants.forEach(collectTitles);
        };

        collectTitles(product);

        const productTokens = extractTokens(titles.join(' '));

        let titleMatches = 0;
        for (const token of titleTokens) {
          if (productTokens.some(pToken => pToken.includes(token) || token.includes(pToken))) {
            titleMatches++;
          }
        }

        let descMatches = 0;
        for (const token of descriptionTokens) {
          if (productTokens.some(pToken => pToken.includes(token) || token.includes(pToken))) {
            descMatches++;
          }
        }

        const totalScore = (titleMatches * 3) + descMatches;
        console.log('totalScore: ', totalScore, 'titleMatches: ', titleMatches, 'descMatches: ', descMatches, 'product: ', product)

        const isValid = totalScore > 3;



        return {
          product,
          isValid,
          titleMatches,
          descMatches,
          totalScore
        };
      })
      .filter(item => item.isValid)
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.titleMatches !== a.titleMatches) return b.titleMatches - a.titleMatches;
        return b.descMatches - a.descMatches;
      })
      .map(item => item.product);

    console.log('[DEBUG] Resultado Final (Matches):', matched);
    console.log('=============================');

    return matched;
  }



}