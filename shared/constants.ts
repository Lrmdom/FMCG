import type { UnitEconomicsMetrics, UserFmcgSettings } from './types.ts';

export const DEFAULT_USER_SETTINGS: UserFmcgSettings = {
  userId: 'user-demo-001',
  fmcgServiceEnabled: true,
  subscriptionTier: 'premium_monthly',
  subscriptionPriceEur: 4.99,
  autoRestockThresholdDays: 3,
  enableAutoRestockOrder: true,
  privacyBlurFaces: true,
  preferredSupermarket: 'Continente',
  notificationsEnabled: true,
  monthlyBudgetCapEur: 150.0,
};

export const DEFAULT_UNIT_ECONOMICS: UnitEconomicsMetrics = {
  activeDailyUsers: 1000,
  monthlyImagesScanned: 750000,
  edgeAiPercentage: 80,
  llmFallbackPercentage: 20,
  edgeAiCostMonthlyUsd: 18.00,
  geminiFallbackCostMonthlyUsd: 15.75,
  supabaseVectorCostMonthlyUsd: 25.00,
  mcpServerCostMonthlyUsd: 10.00,
  totalInfraCostMonthlyUsd: 68.75,
  costPerUserMonthlyUsd: 0.068,
  monthlySubscriptionRevenueEur: 4990.00,
  supermarketCommissionRevenueEur: 1250.00,
  grossTechMarginPercentage: 98.7,
};

export const PRESET_VISION_SCENARIOS = [
  {
    id: 'fridge_morning',
    title: 'Frigorífico (Leite Quase Vazio & Iogurtes)',
    description: 'Foto matinal do interior do frigorífico com pacote de Leite Mimosa aberto e Iogurtes Danone.',
    imageUrl: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=900&auto=format&fit=crop&q=80',
    expectedSkus: ['FMCG-LEI-001', 'FMCG-IOG-001'],
    suggestedConfidence: 0.94,
    method: 'edge_ai' as const,
  },
  {
    id: 'pantry_breakfast',
    title: 'Despensa (Café Delta Q & Azeite & Arroz)',
    description: 'Prateleira da despensa com caixa de Café Delta Q Qharisma e garrafa de Azeite Oliveira da Serra.',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=900&auto=format&fit=crop&q=80',
    expectedSkus: ['FMCG-CAF-001', 'FMCG-AZE-001', 'FMCG-ARR-001'],
    suggestedConfidence: 0.88,
    method: 'edge_ai' as const,
  },
  {
    id: 'empty_box_blur',
    title: 'Embalagem Amassada / Luz Baixa (Gemini Fallback)',
    description: 'Embalagem de detergente Skip no cesto de reciclagem, com reflexo e ângulo difícil (dispara fallback do Gemini).',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=900&auto=format&fit=crop&q=80',
    expectedSkus: ['FMCG-DET-001'],
    suggestedConfidence: 0.74,
    method: 'gemini_fallback' as const,
  },
  {
    id: 'barcode_instant',
    title: 'Código de Barras EAN-13 (Leitura Instantânea)',
    description: 'Leitura direta no browser do código EAN 5601009901015 (Mimosa 1L).',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80',
    expectedSkus: ['FMCG-LEI-001'],
    suggestedConfidence: 1.0,
    method: 'barcode' as const,
  },
];
