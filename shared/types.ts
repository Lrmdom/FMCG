/**
 * Shared Type Definitions for FMCG Photo Shopping & Predictive Pantry Service
 */

export type ProductCategory = 
  | 'lacticinios'
  | 'mercearia'
  | 'bebidas'
  | 'frescos'
  | 'higiene_limpeza'
  | 'congelados'
  | 'snacks_doces';

export interface SupermarketPrice {
  supermarket: 'Continente' | 'Pingo Doce' | 'Auchan' | 'Mercadona';
  price: number;
  available: boolean;
  promoPrice?: number;
}

export interface FmcgProduct {
  taxon?: any;
  title?: string;
  sku: string;
  ean: string;
  name: string;
  brand: string;
  category: ProductCategory;
  unit: string;
  basePrice: number;
  supermarketPrices: SupermarketPrice[];
  imageUrl: string;
  packageType: 'tetra_pak' | 'garrafa' | 'lata' | 'caixa' | 'frasco' | 'saco';
  defaultShelfLifeDays: number;
  averageConsumptionDays: number;
  equivalentSkus?: string[];
  isStoreBrand?: boolean;
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  ecoScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  description?: string;
  variants?: FmcgProduct[];
}

export type StorageLocation = 'pantry' | 'fridge' | 'freezer' | 'cleaning';

export interface PantryItem {
  id: string;
  sku: string;
  product: FmcgProduct;
  currentQuantity: number;
  targetQuantity: number;
  unit: string;
  location: StorageLocation;
  openedAt?: string;
  addedAt: string;
  expiresAt: string;
  dailyConsumptionRate: number;
  daysUntilEmpty: number;
  isRestockNeeded: boolean;
  autoRestockSubscribed: boolean;
  lastPhotoConfidence?: number;
}

export interface CartLineItem {
  id: string;
  sku: string;
  product: FmcgProduct;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedBy: 'manual' | 'photo_scanner' | 'barcode' | 'predictive_restock' | 'mcp_tool';
  selectedSupermarket: 'Continente' | 'Pingo Doce' | 'Auchan' | 'Mercadona';
  savingsComparedToTopBrand?: number;
}

export interface CartState {
  id: string;
  userId: string;
  items: CartLineItem[];
  subtotal: number;
  fmcgPartnerCommission: number;
  total: number;
  updatedAt: string;
}

export type VisionCascadeMethod = 'barcode' | 'edge_ai' | 'gemini_fallback' | 'vector_match';

export interface DetectedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  sku: string;
  ean?: string;
}

export interface CascadeStepTelemetry {
  step: number;
  name: string;
  engine: string;
  status: 'passed' | 'skipped' | 'triggered' | 'fallback_required';
  latencyMs: number;
  confidenceScore: number;
  costUsd: number;
  details: string;
}

export interface VisionAnalysisResult {
  scanId: string;
  timestamp: number;
  inputMethod: 'photo_upload' | 'camera_stream' | 'barcode_reader' | 'demo_preset';
  resolvedSku?: string;
  product?: FmcgProduct;
  detectedItems: {
    sku: string;
    product: FmcgProduct;
    confidence: number;
    boundingBox?: DetectedBoundingBox;
    detectionMethod: VisionCascadeMethod;
    alternativeSuggestions?: FmcgProduct[];
  }[];
  cascadeTelemetry: CascadeStepTelemetry[];
  totalLatencyMs: number;
  totalCostUsd: number;
  gdprCompliant: {
    ephemeralMemoryOnly: boolean;
    facesScrubbedCount: number;
    exifRemoved: boolean;
  };
}

export interface UserFmcgSettings {
  userId: string;
  fmcgServiceEnabled: boolean;
  subscriptionTier: 'free_trial' | 'premium_monthly' | 'enterprise_partner';
  subscriptionPriceEur: number;
  autoRestockThresholdDays: number;
  enableAutoRestockOrder: boolean;
  privacyBlurFaces: boolean;
  preferredSupermarket: 'Continente' | 'Pingo Doce' | 'Auchan' | 'Mercadona' | 'cheapest_split';
  notificationsEnabled: boolean;
  monthlyBudgetCapEur?: number;
}

export interface McpToolLog {
  id: string;
  timestamp: number;
  toolName: string;
  params: Record<string, any>;
  result: any;
  durationMs: number;
  status: 'success' | 'error';
}

export interface UnitEconomicsMetrics {
  activeDailyUsers: number;
  monthlyImagesScanned: number;
  edgeAiPercentage: number;
  llmFallbackPercentage: number;
  edgeAiCostMonthlyUsd: number;
  geminiFallbackCostMonthlyUsd: number;
  supabaseVectorCostMonthlyUsd: number;
  mcpServerCostMonthlyUsd: number;
  totalInfraCostMonthlyUsd: number;
  costPerUserMonthlyUsd: number;
  monthlySubscriptionRevenueEur: number;
  supermarketCommissionRevenueEur: number;
  grossTechMarginPercentage: number;
}
