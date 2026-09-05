import { FMCG_CATALOG } from '../../shared/catalog.ts';
import type { FmcgProduct } from '../../shared/types.ts';

export interface VectorSearchEnv {
  AI?: Ai;
  VECTORIZE?: VectorizeIndex;
  FILESYSTEM_BUCKET?: R2Bucket;
}

export class VectorSearchService {
  private static async getCatalog(env?: VectorSearchEnv, locale: string = 'pt'): Promise<FmcgProduct[]> {
    if (!env?.FILESYSTEM_BUCKET) {
      // Fallback para o catálogo estático se o R2 não estiver disponível
      return FMCG_CATALOG;
    }
    const object = await env.FILESYSTEM_BUCKET.get(`asualoja-sanity-data-${locale}.json`);
    if (!object) return FMCG_CATALOG;
    return await object.json<FmcgProduct[]>();
  }

  public static async findEquivalents(targetSku: string, limit?: number): Promise<any[]>;
  public static async findEquivalents(env: VectorSearchEnv | undefined, targetSku: string, limit?: number): Promise<any[]>;
  public static async findEquivalents(
    envOrSku?: VectorSearchEnv | string,
    targetSkuOrLimit?: string | number,
    limit: number = 3
  ): Promise<any[]> {
    let env: VectorSearchEnv | undefined;
    let targetSku: string;
    let maxLimit = limit;

    if (typeof envOrSku === 'string') {
      env = undefined;
      targetSku = envOrSku;
      maxLimit = typeof targetSkuOrLimit === 'number' ? targetSkuOrLimit : 3;
    } else {
      env = envOrSku;
      targetSku = (typeof targetSkuOrLimit === 'string' ? targetSkuOrLimit : '') || '';
      maxLimit = limit;
    }

    const catalog = await this.getCatalog(env);
    const target = catalog.find(p => p.sku === targetSku);
    if (!target) return [];

    const candidates = catalog.filter(p => p.sku !== targetSku);
    const results = candidates
      .map(candidate => {
        let similarity = 0.4;

        if (candidate.category === target.category) {
          similarity += 0.35;
        }

        if (target.equivalentSkus?.includes(candidate.sku) || candidate.equivalentSkus?.includes(target.sku)) {
          similarity += 0.22;
        }

        if (candidate.packageType === target.packageType) {
          similarity += 0.05;
        }

        const priceSavings = Math.max(0, target.basePrice - candidate.basePrice);
        const percentSavings = target.basePrice > 0 ? (priceSavings / target.basePrice) * 100 : 0;

        return {
          product: candidate,
          similarityScore: Math.min(0.99, Number(similarity.toFixed(2))),
          priceSavingsEur: Number(priceSavings.toFixed(2)),
          priceSavingsPercent: Number(percentSavings.toFixed(1)),
        };
      })
      .filter(item => item.similarityScore >= 0.70)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, maxLimit);

    return results;
  }

  public static async searchByQuery(query: string, limit?: number): Promise<FmcgProduct[]>;
  public static async searchByQuery(env: VectorSearchEnv | undefined, query: string, limit?: number): Promise<FmcgProduct[]>;
  public static async searchByQuery(
    envOrQuery?: VectorSearchEnv | string,
    queryOrLimit?: string | number,
    limit: number = 5
  ): Promise<FmcgProduct[]> {
    let env: VectorSearchEnv | undefined;
    let query: string;
    let maxLimit = limit;

    if (typeof envOrQuery === 'string') {
      env = undefined;
      query = envOrQuery;
      maxLimit = typeof queryOrLimit === 'number' ? queryOrLimit : 5;
    } else {
      env = envOrQuery;
      query = typeof queryOrLimit === 'string' ? queryOrLimit : '';
      maxLimit = limit;
    }

    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const catalog = await this.getCatalog(env);
    
    return catalog.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.title && typeof p.title === 'string' && p.title.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.ean && p.ean.includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    ).slice(0, maxLimit);
  }

  public static async vectorSearch(env: VectorSearchEnv, query: string, locale?: string, topK: number = 5): Promise<FmcgProduct[]> {
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: query });
    const matches = await env.VECTORIZE.query(embedding.data[0], { 
      topK, 
      filter: locale ? { locale: { $eq: locale } } : undefined 
    });

    const skus = matches.matches.map((m: any) => m.id);
    const catalog = await this.getCatalog(env, locale || 'pt');
    return catalog.filter(p => skus.includes(p.sku));
  }
}
