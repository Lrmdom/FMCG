import React from 'react';
import { usePantryRestock } from '../hooks/usePantryRestock.ts';
import { useFmcgService } from '../hooks/useFmcgService.ts';
import { 
  Sparkles, 
  AlertTriangle, 
  ShoppingCart, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  Package, 
  ChevronRight,
  Camera
} from 'lucide-react';

export const PantryWidget: React.FC<{ onNavigateToPantry?: () => void }> = ({ onNavigateToPantry }) => {
  const { isServiceActive, openScanner } = useFmcgService();
  const { pantryItems, urgentRestockCount, triggerRestockToCart } = usePantryRestock();

  if (!isServiceActive) {
    return null;
  }

  const urgentItems = pantryItems.filter(item => item.daysUntilEmpty <= 3 || item.isRestockNeeded);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Despensa Inteligente Preditiva</h3>
              {urgentRestockCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3" /> {urgentRestockCount} a esgotar
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consumo doméstico monitorizado por visão computacional e algoritmos preditivos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openScanner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Camera className="w-3.5 h-3.5 text-brand-400" />
            <span>Scan Foto</span>
          </button>

          {urgentItems.length > 0 && (
            <button
              onClick={() => triggerRestockToCart(3)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-400 text-slate-950 transition shadow-lg shadow-brand-500/20"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Repor com 1 Clique</span>
            </button>
          )}
        </div>
      </div>

      {/* Urgent Item List */}
      <div className="mt-4 space-y-3">
        {urgentItems.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-brand-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-medium text-slate-300">Despensa Totalmente Abastecida</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Nenhum produto em risco de rutura nos próximos 3 dias.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentItems.slice(0, 3).map((item) => {
              const percent = Math.min(100, Math.max(5, (item.currentQuantity / item.targetQuantity) * 100));
              const isDanger = item.daysUntilEmpty <= 1;

              return (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-xl border transition ${
                    isDanger 
                      ? 'bg-rose-950/20 border-rose-500/30' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-800 border border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          isDanger ? 'text-rose-400 font-bold' : 'text-amber-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {item.daysUntilEmpty <= 1 ? 'Esgota hoje / amanhã!' : `Acaba em ${item.daysUntilEmpty} dias`}
                        </span>
                      </div>
                      
                      {/* Stock Level Bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDanger ? 'bg-rose-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.currentQuantity} {item.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {onNavigateToPantry && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-end">
          <button
            onClick={onNavigateToPantry}
            className="text-xs font-medium text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 transition"
          >
            <span>Ver despensa completa ({pantryItems.length} itens)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
