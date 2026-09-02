import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SubscriptionService } from '../services/subscription.ts';
import { MicrostoreService } from '../services/microstore.ts';
import { EmailService } from '../services/email.ts';

export const subscriptionsRouter = new Hono();

const schema = z.object({
  sku: z.string(),
  frequency: z.enum(['weekly', 'monthly']),
  email: z.string().email(),
});

subscriptionsRouter.post('/send-microstore', zValidator('json', schema), async (c) => {
  const { sku, frequency, email } = c.req.valid('json');

  // 1. Criar Subscrição (Mock)
  const subscription = await SubscriptionService.createSubscriptionModel({
    frequency,
    skuList: [{ sku_code: sku, quantity: 1 }],
    customerEmail: email
  });

  // 2. Gerar URL Microstore
  const microstoreUrl = await MicrostoreService.generateUrl({ sku });

  // 3. Enviar E-mail
  await EmailService.send({
    to: email,
    subject: `Subscrição ${frequency}`,
    html: `<p>Subscrição criada. Checkout: <a href="${microstoreUrl}">${microstoreUrl}</a></p>`
  });

  return c.json({ subscriptionId: subscription.id, microstoreUrl }, 200);
});
