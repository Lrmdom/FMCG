import React, { useState } from 'react';
import { usePantryRestock } from '@/sdk/hooks/usePantryRestock.ts';
import { useFmcgService } from '@/sdk/hooks/useFmcgService.ts';
import type { StorageLocation } from '@shared/types.ts';
import { 
  Sparkles, 
  ShoppingCart, 
  Clock, 
  Plus, 
  Trash2, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  Thermometer,
  ShieldAlert,
  Edit2
} from 'lucide-react';

export const PantryManager: React.FC = () => {
  const { isServiceActive, openScanner, toggleService } = useFmcgService();
  const { 
    pantryItems, 
    urgentRestockCount, 
    triggerRestockToCart, 
    updateItemQuantity, 
    removeItem 
  } = usePantryRestock();

  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  if (!isServiceActive) {
    return (
      <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Serviço de Despensa Preditiva Desativado</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          Para ter acesso ao inventário doméstico em tempo real, cálculo de depleção diária e reposição com 1 clique, ative o serviço FMCG nas definições.
        </p>
        <button
          onClick={() => toggleService(true)}
          className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-brand-500/20"
        >
          Ativar Serviço FMCG (€4,99/mês)
        </button>
      </div>
    );
  }

  const filteredItems = selectedLocation === 'all'
    ? pantryItems
    : pantryItems.filter(i => i.location === selectedLocation);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Gestão Preditiva da Despensa Doméstica
            </h2>
            {urgentRestockCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> {urgentRestockCount} em risco
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Algoritmo preditivo estima a velocidade de consumo da família e antecipa a reposição antes do esgotamento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openScanner}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-brand-400" />
            <span>Scan Foto / Barcode</span>
          </button>

          {urgentRestockCount > 0 && (
            <button
              onClick={() => triggerRestockToCart(3)}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-brand-500/20 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Repor Todos ({urgentRestockCount}) no Carrinho</span>
            </button>
          )}
        </div>
      </div>

      {/* Location Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 w-full sm:w-fit">
        {[
          { id: 'all', label: 'Todas as Divisões' },
          { id: 'fridge', label: 'Frigorífico' },
          { id: 'pantry', label: 'Despensa / Mercearia' },
          { id: 'cleaning', label: 'Higiene & Limpeza' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedLocation(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedLocation === tab.id
                ? 'bg-slate-800 text-white shadow font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const percent = Math.min(100, Math.max(5, (item.currentQuantity / item.targetQuantity) * 100));
          const isDanger = item.daysUntilEmpty <= 1.5;
          const isWarning = item.daysUntilEmpty <= 3 && !isDanger;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all duration-300 space-y-4 relative ${
                isDanger
                  ? 'bg-gradient-to-br from-slate-900 to-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-500/5'
                  : isWarning
                  ? 'bg-gradient-to-br from-slate-900 to-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {item.sku}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isDanger
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                    }`}>
                      {isDanger ? 'Acaba hoje!' : `Acaba em ${item.daysUntilEmpty} dias`}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white truncate mt-1">
                    {item.product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Consumo diário estimado: <strong className="text-slate-200">{item.dailyConsumptionRate} {item.unit}/dia</strong>
                  </p>
                </div>
              </div>

              {/* Stock Bar & Quantity Adjuster Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Nível de Stock Doméstico:</span>
                  <span className="font-mono font-bold text-white">
                    {item.currentQuantity} / {item.targetQuantity} {item.unit}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={item.targetQuantity}
                  step={item.unit === '1L' || item.unit === '750ml' ? '0.05' : '1'}
                  value={item.currentQuantity}
                  onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 (Vazio)</span>
                  <span>50%</span>
                  <span>{item.targetQuantity} {item.unit} (Cheio)</span>
                </div>
              </div>

              {/* Footer actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Remover da Despensa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => updateItemQuantity(item.id, item.targetQuantity)}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  Marcar como Reposto (100%)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
