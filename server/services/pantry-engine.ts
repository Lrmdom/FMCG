import { FMCG_CATALOG, SAMPLE_INITIAL_PANTRY } from '../../shared/catalog.ts';
import type { PantryItem, FmcgProduct, StorageLocation } from '../../shared/types.ts';
import { GdprService } from './gdpr-service.ts';

export class PantryEngine {
  private static pantryItems: PantryItem[] = [...SAMPLE_INITIAL_PANTRY.map(item => {
    const product = FMCG_CATALOG.find(p => p.sku === item.sku) || FMCG_CATALOG[0];
    return {
      ...item,
      product,
    };
  })];

  public static getInventory(location?: StorageLocation): PantryItem[] {
    this.recalculateDepletions();
    if (location) {
      return this.pantryItems.filter(item => item.location === location);
    }
    return this.pantryItems;
  }

  public static getItem(idOrSku: string): PantryItem | undefined {
    return this.pantryItems.find(item => item.id === idOrSku || item.sku === idOrSku);
  }

  public static addItemFromSku(sku: string, location: StorageLocation = 'pantry', quantity: number = 1): PantryItem {
    const product = FMCG_CATALOG.find(p => p.sku === sku);
    if (!product) {
      throw new Error(`SKU ${sku} não encontrado no catálogo FMCG`);
    }

    const existing = this.pantryItems.find(p => p.sku === sku);
    if (existing) {
      existing.currentQuantity = Number((existing.currentQuantity + quantity).toFixed(2));
      existing.addedAt = new Date().toISOString();
      this.recalculateDepletions();
      GdprService.logSkuMutation('pantry_update_stock', [sku]);
      return existing;
    }

    const dailyRate = Number((product.packageType === 'tetra_pak' ? 0.33 : 0.1).toFixed(2));
    const newItem: PantryItem = {
      id: `pantry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sku: product.sku,
      product,
      currentQuantity: quantity,
      targetQuantity: quantity > 1 ? quantity : 2,
      unit: product.unit,
      location,
      addedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + product.defaultShelfLifeDays * 86400000).toISOString(),
      dailyConsumptionRate: dailyRate,
      daysUntilEmpty: Math.max(1, Math.round(quantity / dailyRate)),
      isRestockNeeded: false,
      autoRestockSubscribed: true,
    };

    this.pantryItems.unshift(newItem);
    this.recalculateDepletions();
    GdprService.logSkuMutation('pantry_add_item', [sku]);
    return newItem;
  }

  public static updateQuantity(id: string, newQuantity: number): PantryItem | undefined {
    const item = this.pantryItems.find(p => p.id === id);
    if (item) {
      item.currentQuantity = Math.max(0, Number(newQuantity.toFixed(2)));
      this.recalculateDepletions();
      return item;
    }
    return undefined;
  }

  public static deleteItem(id: string): boolean {
    const idx = this.pantryItems.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.pantryItems.splice(idx, 1);
      return true;
    }
    return false;
  }

  public static getRestockCandidates(daysThreshold: number = 3): {
    item: PantryItem;
    recommendedQuantity: number;
    estimatedDepletionDate: string;
  }[] {
    this.recalculateDepletions();
    return this.pantryItems
      .filter(item => item.daysUntilEmpty <= daysThreshold || item.currentQuantity <= 0.25 * item.targetQuantity)
      .map(item => {
        const needed = Math.max(1, Math.ceil(item.targetQuantity - item.currentQuantity));
        const depletionDate = new Date(Date.now() + item.daysUntilEmpty * 86400000).toISOString();
        return {
          item,
          recommendedQuantity: needed,
          estimatedDepletionDate: depletionDate,
        };
      });
  }

  private static recalculateDepletions() {
    this.pantryItems.forEach(item => {
      const daysLeft = item.dailyConsumptionRate > 0 
        ? Math.max(0, Number((item.currentQuantity / item.dailyConsumptionRate).toFixed(1)))
        : 99;
      item.daysUntilEmpty = daysLeft;
      item.isRestockNeeded = daysLeft <= 3 || item.currentQuantity <= 0.3;
    });
  }
}
