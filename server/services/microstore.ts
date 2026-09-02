import { CommerceLayer } from '@commercelayer/sdk';

export class MicrostoreService {
  private static cl = CommerceLayer({
    organization: process.env.CL_SLUG || "fmcg-store",
    accessToken: process.env.CL_ACCESS_TOKEN || "mock-token",
  });

  public static async generateUrl(data: { sku: string }) {
    // Mock para testar fluxo sem token real
    if (process.env.CL_ACCESS_TOKEN === 'mock-token' || !process.env.CL_ACCESS_TOKEN) {
      return `https://microstore.com/checkout/${data.sku}`;
    }

    // Implementação real (quando necessário)
    // const order = await this.cl.orders.create({ ... });
    // return order.checkout_url;
    return `https://microstore.com/checkout/${data.sku}`;
  }
}
