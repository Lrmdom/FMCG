import type { 
  FmcgProduct, 
  CartState, 
  PantryItem, 
  UserFmcgSettings, 
  VisionAnalysisResult, 
  UnitEconomicsMetrics,
  StorageLocation
} from '@shared/types.ts';

const API_BASE = '/api';

export const api = {
  // Vision & Cascade
  async getPresets() {
    const res = await fetch(`${API_BASE}/vision/presets`);
    return res.json();
  },

  async analyzeVision(data: {
    imageBase64?: string;
    imageUrl?: string;
    eanBarcode?: string;
    presetScenarioId?: string;
    forceMethod?: 'barcode' | 'edge_ai' | 'gemini_fallback';
    blurFaces?: boolean;
  }): Promise<VisionAnalysisResult> {
    const res = await fetch(`${API_BASE}/vision/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha na análise visual');
    }
    return res.json();
  },

  // Pantry
  async getPantry(location?: StorageLocation): Promise<{
    totalCount: number;
    urgentRestockCount: number;
    items: PantryItem[];
    restockCandidates: { item: PantryItem; recommendedQuantity: number; estimatedDepletionDate: string }[];
  }> {
    const url = location ? `${API_BASE}/pantry?location=${location}` : `${API_BASE}/pantry`;
    const res = await fetch(url);
    return res.json();
  },

  async addPantryItem(sku: string, location: StorageLocation = 'pantry', quantity: number = 1) {
    const res = await fetch(`${API_BASE}/pantry/item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, location, quantity }),
    });
    return res.json();
  },

  async updatePantryQuantity(id: string, quantity: number) {
    const res = await fetch(`${API_BASE}/pantry/item/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return res.json();
  },

  async deletePantryItem(id: string) {
    const res = await fetch(`${API_BASE}/pantry/item/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async triggerRestockToCart(daysThreshold: number = 3, supermarket?: string) {
    const res = await fetch(`${API_BASE}/pantry/restock-to-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daysThreshold, supermarket }),
    });
    return res.json();
  },

  // Cart
  async getCart(): Promise<CartState> {
    const res = await fetch(`${API_BASE}/cart`);
    return res.json();
  },

  async addToCart(params: {
    sku: string;
    quantity?: number;
    addedBy?: 'manual' | 'photo_scanner' | 'barcode' | 'predictive_restock' | 'mcp_tool';
    supermarket?: 'Continente' | 'Pingo Doce' | 'Auchan' | 'Mercadona';
  }) {
    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async updateCartQuantity(lineItemId: string, quantity: number) {
    const res = await fetch(`${API_BASE}/cart/items/${lineItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    return res.json();
  },

  async removeCartItem(lineItemId: string) {
    const res = await fetch(`${API_BASE}/cart/items/${lineItemId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async clearCart() {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Catalog
  async getCatalog(category?: string): Promise<FmcgProduct[]> {
    const url = category ? `${API_BASE}/catalog?category=${category}` : `${API_BASE}/catalog`;
    const res = await fetch(url);
    return res.json();
  },

  async searchCatalog(query: string): Promise<{ count: number; results: FmcgProduct[] }> {
    const res = await fetch(`${API_BASE}/catalog/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  async getProductByBarcode(ean: string): Promise<{ product: FmcgProduct; equivalents: any[] }> {
    const res = await fetch(`${API_BASE}/catalog/barcode/${ean}`);
    if (!res.ok) throw new Error('Código de barras não encontrado');
    return res.json();
  },

  // Settings & Opt-in
  async getSettings(): Promise<UserFmcgSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },

  async updateSettings(settings: Partial<UserFmcgSettings>): Promise<{ success: boolean; settings: UserFmcgSettings }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // MCP
  async getMcpTools() {
    const res = await fetch(`${API_BASE}/mcp/tools`);
    return res.json();
  },

  async executeMcpTool(toolName: string, params: Record<string, any>) {
    const res = await fetch(`${API_BASE}/mcp/tools/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getMcpLogs() {
    const res = await fetch(`${API_BASE}/mcp/logs`);
    return res.json();
  },

  // Analytics & GDPR
  async getEconomics(users: number = 1000, imagesPerUser: number = 25): Promise<UnitEconomicsMetrics> {
    const res = await fetch(`${API_BASE}/analytics/economics?users=${users}&imagesPerUser=${imagesPerUser}`);
    return res.json();
  },

  async getGdprLogs() {
    const res = await fetch(`${API_BASE}/analytics/gdpr-logs`);
    return res.json();
  },
};
