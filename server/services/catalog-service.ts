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

  private static extractProducts(data: any): FmcgProduct[] {
    if (!data) return [];
    if (Array.isArray(data)) {
      return data.flatMap(item => this.extractProducts(item));
    }
    
    let products: FmcgProduct[] = [];
    
    // If it has variants, process them as products
    if (data.variants && Array.isArray(data.variants)) {
       products = [...products, ...this.extractProducts(data.variants)];
    }
    
    if (data.products && Array.isArray(data.products)) {
       products = [...products, ...this.extractProducts(data.products)];
    }
    if (data.taxons && Array.isArray(data.taxons)) {
       products = [...products, ...this.extractProducts(data.taxons)];
    }
    
    // Check if it's a product (has SKU)
    if (data.sku) {
       products.push(data as FmcgProduct);
    }
    
    return products;
  }

  public static async getCatalog(locale: string = 'pt') {
    const s3Client = this.getS3Client();
    if (!s3Client) {
      console.warn("R2 not configured. Using fallback catalog.");
      return FMCG_CATALOG;
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
      return FMCG_CATALOG; // Fallback to static catalog
    }
  }

  public static async search(query: string, locale: string = 'pt') {
    const catalog = await this.getCatalog(locale);
    if (!catalog) return [];

    // Simple search implementation
    return catalog.filter((item: any) =>
      item.title?.toLowerCase().includes(query.toLowerCase())
    );
  }
}
