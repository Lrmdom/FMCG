import { FMCG_CATALOG } from '../../shared/catalog.ts';
import type { FmcgProduct } from '../../shared/types.ts';

export class VectorSearchService {
  public static findEquivalents(targetSku: string, limit: number = 3): {
    product: FmcgProduct;
    similarityScore: number;
    priceSavingsEur: number;
    priceSavingsPercent: number;
  }[] {
    const target = FMCG_CATALOG.find(p => p.sku === targetSku);
    if (!target) return [];

    const candidates = FMCG_CATALOG.filter(p => p.sku !== targetSku);
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
      .slice(0, limit);

    return results;
  }

  public static searchByQuery(query: string, limit: number = 5): FmcgProduct[] {
    const q = query.toLowerCase().trim();
    return FMCG_CATALOG.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.ean.includes(q) ||
      p.description?.toLowerCase().includes(q)
    ).slice(0, limit);
  }
}
