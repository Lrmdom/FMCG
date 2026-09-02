import { CommerceLayer } from '@commercelayer/sdk';

export class SubscriptionService {
  private static cl = CommerceLayer({
    organization: process.env.CL_SLUG || "fmcg-store",
    accessToken: process.env.CL_ACCESS_TOKEN || "mock-token",
  });

  public static async createSubscriptionModel(params: {
    frequency: 'weekly' | 'monthly';
    skuList: { sku_code: string; quantity: number }[];
    customerEmail: string;
  }) {
    // Mock para testar fluxo sem token real
    if (process.env.CL_ACCESS_TOKEN === 'mock-token' || !process.env.CL_ACCESS_TOKEN) {
      return { 
        id: 'sub-model-mock-123',
        name: `FMCG Subscription ${params.frequency}`,
        frequencies: [params.frequency]
      };
    }

    // @ts-ignore
    return await this.cl.subscription_models.create({
      name: `FMCG Subscription ${params.frequency}`,
      frequencies: [params.frequency],
      // ... outras configurações baseadas na API
    });
  }
}
