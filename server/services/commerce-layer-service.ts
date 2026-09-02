import { CommerceLayer } from '@commercelayer/sdk';

export class CommerceLayerService {
  private static cl = CommerceLayer({
    organization: process.env.CL_SLUG || "fmcg-store",
    accessToken: process.env.CL_ACCESS_TOKEN || "mock-token",
  });

  public static async createLineItem(cartId: string, sku: string, quantity: number) {
    if (process.env.CL_ACCESS_TOKEN === 'mock-token' || !process.env.CL_ACCESS_TOKEN) {
      return { id: 'mock-item-id' };
    }
    try {
      // @ts-ignore
      return await this.cl.line_items.create({
        order: { id: cartId, type: "orders" },
        sku_code: sku,
        quantity,
      });
    } catch (error) {
      console.error('Erro na mutação CL:', error);
      throw error;
    }
  }
}
