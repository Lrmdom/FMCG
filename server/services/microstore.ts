import { CommerceLayer } from '@commercelayer/sdk';

export class MicrostoreService {
  private static cl = CommerceLayer({
    organization: process.env.CL_SLUG || "",
    accessToken: process.env.CL_ACCESS_TOKEN || "",
  });

  public static async generateUrl(data: { sku: string }) {
    if (!process.env.CL_ACCESS_TOKEN) {
      return `https://microstore.com/checkout/${data.sku}`;
    }

    // Implementação real (quando necessário)
    // const order = await this.cl.orders.create({ ... });
    // return order.checkout_url;
    return `https://microstore.com/checkout/${data.sku}`;
  }
}
