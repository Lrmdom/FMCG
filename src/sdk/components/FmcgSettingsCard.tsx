import React from 'react';
import { useFmcgService } from '../hooks/useFmcgService.ts';
import { 
  Sparkles, 
  ShieldCheck, 
  Camera, 
  BrainCircuit, 
  TrendingDown, 
  Store, 
  Check, 
  Zap, 
  Layers 
} from 'lucide-react';

export const FmcgSettingsCard: React.FC = () => {
  const { isServiceActive, settings, toggleService, updateSettings, isLoading } = useFmcgService();

  if (isLoading || !settings) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-800 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-slate-800 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
      isServiceActive 
        ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/40 border-brand-500/40 shadow-xl shadow-brand-500/5' 
        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Top Banner */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border ${
              isServiceActive 
                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <BrainCircuit className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  FMCG Smart Photo Shopping & Despensa Preditiva
                </h3>
                {isServiceActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    <Zap className="w-3 h-3 fill-brand-300" /> Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Microsserviço alimentado por <strong>Hono</strong> e <strong>@modelcontextprotocol/sdk</strong>. 
                Reconhece bens de grande consumo por fotografia e antecipa a reposição automática da sua despensa.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <span className="text-xs font-medium text-slate-400">
              {isServiceActive ? 'Subscrição Ativa (€4,99/mês)' : 'Desativado'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isServiceActive}
              onClick={() => toggleService(!isServiceActive)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isServiceActive ? 'bg-brand-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isServiceActive ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm mb-1.5">
              <Camera className="w-4 h-4" />
              <span>Cascata Visual IA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deteção em 3 níveis (Barcode direto, Worker AI na Edge e Fallback Gemini Flash) para precisão de 99%.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-fmcg-blue font-semibold text-sm mb-1.5">
              <Layers className="w-4 h-4" />
              <span>Model Context Protocol (MCP)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tools universais (<code>add_item_to_cart</code>, <code>trigger_restock</code>) integradas com a Storefront.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-fmcg-amber font-semibold text-sm mb-1.5">
              <TrendingDown className="w-4 h-4" />
              <span>Gestão Preditiva & Poupança</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sugestões semânticas de marcas brancas (pgvector) e avisos inteligentes antes do leite ou café acabarem.
            </p>
          </div>
        </div>

        {/* Configuration Options (When Active) */}
        {isServiceActive && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Preferências do Serviço FMCG
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Preferred Supermarket */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-brand-400" /> Supermercado de Reposição
                </label>
                <select
                  value={settings.preferredSupermarket}
                  onChange={(e) => updateSettings({ preferredSupermarket: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Continente">Continente (Preço Base & Marca É)</option>
                  <option value="Pingo Doce">Pingo Doce (Promoções Frescos)</option>
                  <option value="Auchan">Auchan (Gama Económica)</option>
                  <option value="Mercadona">Mercadona (Qualidade Hacendado)</option>
                </select>
              </div>

              {/* Depletion Threshold */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fmcg-amber" /> Alerta de Esgotamento
                </label>
                <select
                  value={settings.autoRestockThresholdDays}
                  onChange={(e) => updateSettings({ autoRestockThresholdDays: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value={1}>1 dia antes de acabar (Urgente)</option>
                  <option value={2}>2 dias antes de acabar</option>
                  <option value={3}>3 dias antes de acabar (Recomendado)</option>
                  <option value={5}>5 dias antes de acabar</option>
                </select>
              </div>

              {/* Privacy / Edge Blur */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between">
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> RGPD & Desfoque Edge
                </label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400">Desfocar rostos na câmara</span>
                  <input
                    type="checkbox"
                    checked={settings.privacyBlurFaces}
                    onChange={(e) => updateSettings({ privacyBlurFaces: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded bg-slate-800 border-slate-700 focus:ring-brand-500 focus:ring-offset-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
