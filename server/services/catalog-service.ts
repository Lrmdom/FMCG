import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { FMCG_CATALOG } from "../../shared/catalog.ts";
import type { FmcgProduct } from "../../shared/types.ts";

export class CatalogService {
  private static getS3Client() {
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return null;
    }
    return new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  private static mapToFmcgProduct(data: any): FmcgProduct {
    const title = (data.title || data.name || '').trim();

    const variants = Array.isArray(data.variants)
      ? data.variants.map((v: any) => ({
        ...v,
        sku: v.sku || '',
        ean: v.ean || '',
        name: (v.name || v.title || title).trim(),
        title: (v.title || v.name || title).trim(),
        basePrice: v.basePrice ?? v.price ?? 0,
        supermarketPrices: v.supermarketPrices || [],
        imageUrl: v.imageUrl || (v.images && v.images[0]?.url) || data.imageUrl || '',
      }))
      : [];

    // Tira o SKU/EAN da primeira variante caso o nó pai não o possua
    const firstVariant = variants[0];
    const sku = data.sku || firstVariant?.sku || '';
    const ean = data.ean || firstVariant?.ean || '';

    const product: FmcgProduct = {
      ...data,
      title,
      name: (data.name || title).trim(),
      sku,
      ean,
      variants,
    };

    delete (product as any).taxons;
    delete (product as any).products;

    return product;
  }

  private static isProductNode(node: any): boolean {
    if (!node || typeof node !== 'object') return false;

    // Se tiver 'products' ou 'taxons', é uma categoria/taxon, não um produto final
    if ((Array.isArray(node.products) && node.products.length > 0) ||
      (Array.isArray(node.taxons) && node.taxons.length > 0)) {
      return false;
    }

    // Um produto real é identificado por ter variantes, imagens, slug ou preço direto
    return !!(
      (Array.isArray(node.variants) && node.variants.length > 0) ||
      node.imageUrl ||
      node.images ||
      node.slug ||
      node.sku ||
      node.price ||
      node.basePrice
    );
  }

  private static extractProducts(rawData: any): FmcgProduct[] {
  if (!rawData) return [];

  const result: FmcgProduct[] = [];

  const extractProductNode = (node: any) => {
    if (!node || typeof node !== 'object') return;

    const variants = Array.isArray(node.variants) ? node.variants : [];

    if (variants.length === 0) {
      // Produto sem variantes
      const product = this.mapToFmcgProduct(node);
      if (product?.sku) {
        result.push(product);
      }
      return;
    }

    // Produto com variantes - mantém estrutura
    const parentProduct = this.mapToFmcgProduct(node);
    if (!parentProduct?.sku) return;

    // Mapeia variantes mantendo dados do pai
    const variantProducts = variants
      .filter((v: any) => v && typeof v === 'object' && v.sku)
      .map((variant: any) => {
        const variantData = {
          ...node,
          ...variant,
          sku: variant.sku,
          imageUrl: variant.images?.[0]?.url ?? node.imageUrl ?? null,
          attributes: variant.attributes ?? node.attributes ?? null,
        };
        return this.mapToFmcgProduct(variantData);
      })
      .filter((p: FmcgProduct) => p?.sku);

    // Produto pai com suas variantes
    result.push({
      ...parentProduct,
      variants: variantProducts
    });
  };

  // ✅ FUNÇÃO TRAVERSE ADICIONADA
  const traverse = (node: any): void => {
    if (!node) return;

    // Array
    if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item);
      }
      return;
    }

    // Ignorar valores que não sejam objetos
    if (typeof node !== 'object') {
      return;
    }

    // ---------------------------------------------------------
    // PRODUCTS
    // ---------------------------------------------------------
    if (Array.isArray(node.products)) {
      for (const product of node.products) {
        extractProductNode(product);
      }
    }

    // ---------------------------------------------------------
    // TAXONS
    // ---------------------------------------------------------
    if (Array.isArray(node.taxons)) {
      for (const taxon of node.taxons) {
        traverse(taxon);
      }
    }
  };

  // -----------------------------------------------------------
  // Percorrer catálogo completo
  // -----------------------------------------------------------
  traverse(rawData);

  return result;
}

  public static async getCatalog(locale: string = 'pt'): Promise<FmcgProduct[]> {
    const s3Client = this.getS3Client();
    if (!s3Client) {
      console.warn("R2 not configured. Using fallback catalog.");
      return this.extractProducts(FMCG_CATALOG);
    }

    const command = new GetObjectCommand({
      Bucket: "hono-pubsub-filesystem",
      Key: `asualoja-sanity-data-${locale}.json`,
    });

    try {
      const response = await s3Client.send(command);
      const str = await response.Body!.transformToString();
      const rawData = JSON.parse(str);
      return this.extractProducts(rawData);
    } catch (error) {
      console.error("Error fetching catalog from R2, using fallback:", error);
      return this.extractProducts(FMCG_CATALOG);
    }
  }

  public static async search(query: string, locale: string = 'pt'): Promise<FmcgProduct[]> {
    const catalog = await this.getCatalog(locale);
    if (!catalog) return [];

    const q = query.toLowerCase().trim();
    if (!q) return catalog;

    return catalog.filter((item) =>
      item.title?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.ean?.includes(q) ||
      item.variants?.some((v: any) => v.sku?.toLowerCase().includes(q) || v.ean?.includes(q))
    );
  }
}