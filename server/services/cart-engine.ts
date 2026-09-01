import { FMCG_CATALOG } from '../../shared/catalog.ts';
import type { CartLineItem, CartState, FmcgProduct } from '../../shared/types.ts';
import { GdprService } from './gdpr-service.ts';
import { CommerceLayerService } from './commerce-layer-service.ts';

export class CartEngine {
  private static cart: CartState = {
    id: 'cart-session-001',
    userId: 'user-demo-001',
    items: [],
    subtotal: 0,
    fmcgPartnerCommission: 0,
    total: 0,
    updatedAt: new Date().toISOString(),
  };

  public static getCart(): CartState {
    this.recalculateCart();
    return this.cart;
  }

  public static async addItem(params: {
    cartId: string;
    sku: string;
    quantity?: number;
    addedBy?: CartLineItem['addedBy'];
    supermarket?: 'Continente' | 'Pingo Doce' | 'Auchan' | 'Mercadona';
  }): Promise<{ success: boolean; lineItem: CartLineItem; cart: CartState }> {
    const qty = params.quantity && params.quantity > 0 ? params.quantity : 1;
    const product = FMCG_CATALOG.find(p => p.sku === params.sku);
    if (!product) {
      throw new Error(`Produto com SKU ${params.sku} não encontrado`);
    }

    const sm = params.supermarket || 'Continente';
    const smPriceObj = product.supermarketPrices.find(s => s.supermarket === sm);
    const unitPrice = smPriceObj?.promoPrice || smPriceObj?.price || product.basePrice;

    // Mutação Commerce Layer usando o cartId dinâmico
    await CommerceLayerService.createLineItem(params.cartId, params.sku, qty);

    const existingIdx = this.cart.items.findIndex(i => i.sku === params.sku && i.selectedSupermarket === sm);
    let lineItem: CartLineItem;


    if (existingIdx !== -1) {
      this.cart.items[existingIdx].quantity += qty;
      this.cart.items[existingIdx].totalPrice = Number((this.cart.items[existingIdx].quantity * unitPrice).toFixed(2));
      lineItem = this.cart.items[existingIdx];
    } else {
      lineItem = {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sku: product.sku,
        product,
        quantity: qty,
        unitPrice,
        totalPrice: Number((qty * unitPrice).toFixed(2)),
        addedBy: params.addedBy || 'manual',
        selectedSupermarket: sm,
        savingsComparedToTopBrand: product.isStoreBrand ? 0.35 * unitPrice : 0,
      };
      this.cart.items.unshift(lineItem);
    }

    this.recalculateCart();
    GdprService.logSkuMutation('cart_add_item', [product.sku]);

    return {
      success: true,
      lineItem,
      cart: this.cart,
    };
  }

  public static updateQuantity(lineItemId: string, quantity: number): CartState {
    if (quantity <= 0) {
      this.cart.items = this.cart.items.filter(i => i.id !== lineItemId);
    } else {
      const item = this.cart.items.find(i => i.id === lineItemId);
      if (item) {
        item.quantity = quantity;
        item.totalPrice = Number((item.quantity * item.unitPrice).toFixed(2));
      }
    }
    this.recalculateCart();
    return this.cart;
  }

  public static removeItem(lineItemId: string): CartState {
    this.cart.items = this.cart.items.filter(i => i.id !== lineItemId);
    this.recalculateCart();
    return this.cart;
  }

  public static clearCart(): CartState {
    this.cart.items = [];
    this.recalculateCart();
    return this.cart;
  }

  private static recalculateCart() {
    const subtotal = this.cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
    const commission = subtotal * 0.07;
    this.cart.subtotal = Number(subtotal.toFixed(2));
    this.cart.fmcgPartnerCommission = Number(commission.toFixed(2));
    this.cart.total = Number(subtotal.toFixed(2));
    this.cart.updatedAt = new Date().toISOString();
  }
}
