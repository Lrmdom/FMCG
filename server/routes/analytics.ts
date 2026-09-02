import { Hono } from 'hono';
import { GdprService } from '../services/gdpr-service.ts';

export const analyticsRouter = new Hono();

analyticsRouter.get('/economics', (c) => {
  const usersParam = Number(c.req.query('users')) || 1000;
  const imgsPerUser = Number(c.req.query('imagesPerUser')) || 25;
  const daysInMonth = 30;

  const totalMonthlyImages = usersParam * imgsPerUser * daysInMonth;
  const edgeImages = totalMonthlyImages * 0.80;
  const fallbackImages = totalMonthlyImages * 0.20;

  const edgeCost = Number(((edgeImages / 1000000) * 30).toFixed(2));
  const fallbackCost = Number(((fallbackImages / 1000000) * 105).toFixed(2));
  const supabaseCost = 25.00;
  const mcpServerCost = 10.00;
  const totalInfraCost = Number((edgeCost + fallbackCost + supabaseCost + mcpServerCost).toFixed(2));
  const costPerUser = Number((totalInfraCost / usersParam).toFixed(4));

  const subRevenue = Number((usersParam * 4.99).toFixed(2));
  const commissionRevenue = Number((usersParam * 1.25).toFixed(2));
  const totalRevenue = subRevenue + commissionRevenue;
  const grossMargin = Number((((totalRevenue - totalInfraCost) / totalRevenue) * 100).toFixed(1));

  return c.json({
    activeDailyUsers: usersParam,
    monthlyImagesScanned: totalMonthlyImages,
    edgeAiPercentage: 80,
    llmFallbackPercentage: 20,
    edgeAiCostMonthlyUsd: edgeCost,
    geminiFallbackCostMonthlyUsd: fallbackCost,
    supabaseVectorCostMonthlyUsd: supabaseCost,
    mcpServerCostMonthlyUsd: mcpServerCost,
    totalInfraCostMonthlyUsd: totalInfraCost,
    costPerUserMonthlyUsd: costPerUser,
    monthlySubscriptionRevenueEur: subRevenue,
    supermarketCommissionRevenueEur: commissionRevenue,
    grossTechMarginPercentage: grossMargin,
  });
});

analyticsRouter.get('/gdpr-logs', (c) => {
  return c.json({
    complianceStandard: 'RGPD / GDPR Art. 5 (Minimização & Processamento Efémero)',
    logs: GdprService.getAuditLogs(),
  });
});
