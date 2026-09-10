import { FMCG_CATALOG } from '../../shared/catalog.ts';
import type { FmcgProduct } from '../../shared/types.ts';

export interface VectorSearchEnv {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  FILESYSTEM_BUCKET?: R2Bucket;
}

export class VectorSearchService {
  /**
   * Obtém o catálogo estático. Se o bucket R2 contiver o JSON, extrai e achata a árvore de taxons.
   */
  private static async getCatalog(env?: VectorSearchEnv, locale: string = 'pt'): Promise<FmcgProduct[]> {
    if (!env?.FILESYSTEM_BUCKET) {
      return FMCG_CATALOG;
    }

    try {
      const object = await env.FILESYSTEM_BUCKET.get(`asualoja-sanity-data-${locale}.json`);
      if (!object) return FMCG_CATALOG;

      const rawData = await object.json<any>();

      // Se já for uma lista flat de produtos
      if (Array.isArray(rawData) && rawData[0]?.sku) {
        return rawData as FmcgProduct[];
      }

      // Se for a estrutura de categorias/taxons do Sanity, achata a árvore
      const flattenedProducts: FmcgProduct[] = [];
      const extractProducts = (node: any) => {
        if (!node) return;
        if (Array.isArray(node.products)) {
          flattenedProducts.push(...node.products);
        }
        if (Array.isArray(node.taxons)) {
          node.taxons.forEach(extractProducts);
        }
        if (Array.isArray(node)) {
          node.forEach(extractProducts);
        }
      };

      extractProducts(rawData);
      return flattenedProducts.length ? flattenedProducts : FMCG_CATALOG;
    } catch (e) {
      console.warn('[VectorSearch] Falha ao carregar catálogo do R2, utilizando fallback estático.', e);
      return FMCG_CATALOG;
    }
  }

  /**
   * Gera o embedding de forma segura usando o modelo BGE-M3 (Multilíngue)
   */
  private static async generateEmbedding(ai: Ai, text: string): Promise<number[]> {
    const response = await ai.run('@cf/bge-m3', { text: [text] }) as { data?: number[][] };
    if (!response?.data?.[0]) {
      throw new Error('Falha na geração do embedding via Workers AI');
    }
    return response.data[0];
  }

  /**
   * Busca vetorial principal consumindo o Cloudflare Vectorize
   */
  public static async vectorSearch(
    env: VectorSearchEnv,
    query: string,
    locale: string = 'pt',
    topK: number = 5
  ): Promise<FmcgProduct[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      // 1. Gera embedding com o modelo multilíngue
      const queryVector = await this.generateEmbedding(env.AI, q);

      // 2. Consulta no Cloudflare Vectorize
      const matches = await env.VECTORIZE.query(queryVector, {
        topK,
        returnMetadata: 'indexed',
        filter: locale ? { locale: { $eq: locale } } : undefined
      });

      if (!matches.matches?.length) return [];

      const catalog = await this.getCatalog(env, locale);

      // 3. Mapeia os resultados suportando busca por SKU no metadata ou por título/slug
      const matchedProducts = matches.matches
        .map(match => {
          const meta = match.metadata as Record<string, any> | undefined;
          
          return catalog.find(p => 
            (meta?.sku && p.sku === meta.sku) ||
            p.sku === match.id ||
            p.title === meta?.title ||
            p.name === meta?.title
          );
        })
        .filter((p): p is FmcgProduct => Boolean(p));

      return matchedProducts;
    } catch (e) {
      console.error('[VectorSearch] Erro ao executar busca vetorial:', e);
      // Fallback para busca por palavras-chave se o Vectorize falhar
      return this.searchByQuery(env, query, topK);
    }
  }

  /**
   * Encontra produtos equivalentes/similares
   */
  public static async findEquivalents(
    envOrTitle?: VectorSearchEnv | string,
    targetSkuOrLimit?: string | number,
    limit: number = 3
  ): Promise<any[]> {
    let env: VectorSearchEnv | undefined;
    let targetSku: string;
    let maxLimit = limit;

    if (typeof envOrTitle === 'string') {
      env = undefined;
      targetSku = envOrTitle;
      maxLimit = typeof targetSkuOrLimit === 'number' ? targetSkuOrLimit : 3;
    } else {
      env = envOrTitle;
      targetSku = typeof targetSkuOrLimit === 'string' ? targetSkuOrLimit : '';
      maxLimit = limit;
    }

    const catalog = await this.getCatalog(env);
    const target = catalog.find(p => p.sku === targetSku);
    if (!target) return [];

    if (env?.VECTORIZE && env?.AI) {
      try {
        const queryText = `${target.title || target.name || ''} ${target.category || ''}`.trim();
        const queryVector = await this.generateEmbedding(env.AI, queryText);

        const matches = await env.VECTORIZE.query(queryVector, {
          topK: maxLimit + 5,
          returnMetadata: 'indexed'
        });

        const results = matches.matches
          .map(m => {
            const meta = m.metadata as Record<string, any> | undefined;
            const product = catalog.find(p => 
              p.sku === m.id || 
              (meta?.sku && p.sku === meta.sku) ||
              p.title === meta?.title
            );

            if (!product || product.sku === targetSku) return null;

            return {
              product,
              similarityScore: Number(m.score.toFixed(2)),
              priceSavingsEur: Math.max(0, (target.basePrice || 0) - (product.basePrice || 0)).toFixed(2),
              priceSavingsPercent: target.basePrice && target.basePrice > 0
                ? (((Math.max(0, target.basePrice - product.basePrice)) / target.basePrice) * 100).toFixed(1)
                : '0.0',
            };
          })
          .filter(Boolean)
          .slice(0, maxLimit);

        if (results.length > 0) return results;
      } catch (e) {
        console.warn('[VectorSearch] Falha na busca vetorial de equivalentes, aplicando fallback manual:', e);
      }
    }

    // Fallback Manual
    const candidates = catalog.filter(p => p.sku !== targetSku);
    return candidates
      .map(candidate => {
        let similarity = 0.4;
        if (candidate.category && candidate.category === target.category) similarity += 0.35;
        if (target.equivalentSkus?.includes(candidate.sku) || candidate.equivalentSkus?.includes(target.sku)) similarity += 0.22;
        if (candidate.packageType && candidate.packageType === target.packageType) similarity += 0.05;

        const priceSavings = Math.max(0, (target.basePrice || 0) - (candidate.basePrice || 0));
        const percentSavings = target.basePrice && target.basePrice > 0 ? (priceSavings / target.basePrice) * 100 : 0;

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
  }

  /**
   * Busca simples por texto no catálogo estático (Fallback)
   */
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

    return catalog
      .filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && typeof p.title === 'string' && p.title.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.ean && p.ean.includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      )
      .slice(0, maxLimit);
  }
}