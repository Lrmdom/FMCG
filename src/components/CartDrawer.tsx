import React, { useState } from 'react';
import { useMcpCart } from '@/sdk/hooks/useMcpCart.ts';
import { useFmcgService } from '@/sdk/hooks/useFmcgService.ts';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Sparkles, 
  Store, 
  TrendingDown, 
  Check, 
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeItem, clearCart, addToCart } = useMcpCart();
  const { isServiceActive, settings, showToast } = useFmcgService();

  const [selectedSupermarket, setSelectedSupermarket] = useState<'Continente' | 'Pingo Doce' | 'Auchan' | 'Mercadona'>(
    settings?.preferredSupermarket && settings.preferredSupermarket !== 'cheapest_split' 
      ? (settings.preferredSupermarket as any) 
      : 'Continente'
  );

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      clearCart();
      onClose();
      showToast('Encomenda Realizada com Sucesso! 🎉', `Mutações sincronizadas com a API de E-Commerce e despachadas para ${selectedSupermarket}.`, 'success');
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
    }, 1200);
  };

  const totalSavings = cart?.items.reduce((acc, i) => acc + (i.savingsComparedToTopBrand ? i.savingsComparedToTopBrand * i.quantity : 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Carrinho da Storefront</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {cart?.items.length || 0} itens sincronizados
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Supermarket Selector Header */}
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-brand-400" /> Supermercado:
            </span>
            <select
              value={selectedSupermarket}
              onChange={(e) => setSelectedSupermarket(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="Continente">Continente</option>
              <option value="Pingo Doce">Pingo Doce</option>
              <option value="Auchan">Auchan</option>
              <option value="Mercadona">Mercadona</option>
            </select>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8 text-slate-500" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">O seu carrinho está vazio</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Adicione produtos na loja ou utilize o <strong>Scan Fotográfico</strong> da despensa para adicionar SKUs instantaneamente.
                </p>
              </div>
            ) : (
              cart.items.map((item) => {
                const getOriginBadge = () => {
                  switch (item.addedBy) {
                    case 'photo_scanner':
                      return { text: 'Photo AI', color: 'bg-brand-500/20 text-brand-300 border-brand-500/30' };
                    case 'predictive_restock':
                      return { text: 'Reposição Preditiva', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
                    case 'barcode':
                      return { text: 'EAN Barcode', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
                    case 'mcp_tool':
                      return { text: 'FastMCP SDK', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
                    default:
                      return { text: 'Manual', color: 'bg-slate-800 text-slate-400 border-slate-700' };
                  }
                };

                const badge = getOriginBadge();

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 transition hover:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.text}
                          </span>
                          <span className="text-xs font-bold text-white font-mono">
                            €{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 truncate mt-1">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          €{item.unitPrice.toFixed(2)} / {item.product.unit}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Adjustment */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-800 text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-white px-2">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-800 text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-4">
              {/* Partner commission info */}
              <div className="space-y-1.5 text-xs text-slate-400 pb-3 border-b border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200 font-bold">€{cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-brand-400">
                  <span className="flex items-center gap-1">
                    <Store className="w-3 h-3" /> Comissão Parceiro FMCG (7%)
                  </span>
                  <span className="font-mono font-bold">€{cart.fmcgPartnerCommission.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between text-amber-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Poupança Marca Branca
                    </span>
                    <span className="font-mono">-€{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-white font-extrabold pt-2">
                  <span>Total da Encomenda</span>
                  <span className="font-mono text-base text-brand-400">€{cart.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-sm transition shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <span>A processar via FastMCP...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Confirmar Encomenda em {selectedSupermarket}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
