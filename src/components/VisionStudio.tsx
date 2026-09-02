import React, { useState } from 'react';
import { api } from '@/lib/api.ts';
import { useMcpCart } from '@/sdk/hooks/useMcpCart.ts';
import { useFmcgService } from '@/sdk/hooks/useFmcgService.ts';
import type { VisionAnalysisResult, VisionCascadeMethod } from '@shared/types.ts';
import { 
  Camera, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Zap,
  TrendingDown,
  DollarSign,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const VisionStudio: React.FC = () => {
  const { settings, showToast } = useFmcgService();
  const { addToCart } = useMcpCart();

  const [selectedScenario, setSelectedScenario] = useState<string>('fridge_morning');
  const [forceMethod, setForceMethod] = useState<VisionCascadeMethod | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);

  const handleRun = async (scenarioId = selectedScenario, forced = forceMethod) => {
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeVision({
        presetScenarioId: scenarioId,
        forceMethod: forced,
        blurFaces: settings?.privacyBlurFaces ?? true,
      });
      setResult(res);
      showToast('Inferência Concluída! ⚡', `${res.detectedItems.length} SKUs identificados.`, 'success');
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch (err: any) {
      showToast('Erro', err.message || 'Falha na análise', 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Laboratório da Pipeline Visual em Cascata Híbrida
          </h2>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
            Edge AI + Gemini Fallback
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Demonstração do fluxo de 3 níveis: 1. Barcode Nativo $\rightarrow$ 2. Worker AI na Edge (Confiança $\ge 80\%$) $\rightarrow$ 3. Gemini 2.5 Flash Fallback (Confiança $&lt; 80\%$) $\rightarrow$ 4. Vector Search pgvector
        </p>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-400" />
            <span>Selecionar Fotografia de Teste</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'fridge_morning',
                title: 'Frigorífico Matinal (Edge Pass)',
                desc: 'Leite Mimosa 1L + Iogurtes Danone',
                conf: '94% Confiança',
                tier: 'Cloudflare Worker AI',
                img: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'pantry_breakfast',
                title: 'Despensa Doméstica (Edge Pass)',
                desc: 'Café Delta Q + Azeite + Arroz Cigala',
                conf: '88% Confiança',
                tier: 'Cloudflare Worker AI',
                img: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'empty_box_blur',
                title: 'Embalagem Amassada (LLM Fallback)',
                desc: 'Detergente Skip (Dispara Fallback Gemini Flash)',
                conf: '62% -> 96% Fallback',
                tier: 'OpenRouter / Gemini 2.5 Flash',
                img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'barcode_instant',
                title: 'EAN-13 Barcode Scanning',
                desc: 'Código 5601009901015 (Mimosa 1L)',
                conf: '100% Barcode Direto',
                tier: 'Browser Native (0ms)',
                img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
              },
            ].map((scen) => (
              <div
                key={scen.id}
                onClick={() => {
                  setSelectedScenario(scen.id);
                  handleRun(scen.id, forceMethod);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                  selectedScenario === scen.id
                    ? 'bg-slate-800 border-brand-500 ring-2 ring-brand-500/20 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <img src={scen.img} alt={scen.title} className="w-14 h-14 rounded-xl object-cover border border-slate-800" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{scen.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{scen.desc}</p>
                  <p className="text-[10px] font-mono text-brand-400 mt-1">{scen.conf}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cascade Diagnostics Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-fmcg-amber" />
              <span>Controlo de Execução</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Pode simular o comportamento padrão ou forçar um nível específico da cascata:
            </p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => { setForceMethod(undefined); handleRun(selectedScenario, undefined); }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border text-left transition ${
                  forceMethod === undefined 
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                ⚡ Cascata Híbrida Automática (Recomendado)
              </button>

              <button
                onClick={() => { setForceMethod('edge_ai'); handleRun(selectedScenario, 'edge_ai'); }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border text-left transition ${
                  forceMethod === 'edge_ai' 
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🟢 Forçar Apenas Edge AI (Llama 3.2 Vision)
              </button>

              <button
                onClick={() => { setForceMethod('gemini_fallback'); handleRun(selectedScenario, 'gemini_fallback'); }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border text-left transition ${
                  forceMethod === 'gemini_fallback' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🟡 Forçar Fallback Gemini 2.5 Flash
              </button>
            </div>
          </div>

          <button
            onClick={() => handleRun()}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Reanalisar Imagem</span>
          </button>
        </div>
      </div>

      {/* Results & Live Telemetry Inspector */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
          {/* Top Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" /> Latência Total
              </span>
              <p className="text-xl font-bold text-white font-mono mt-1">
                {result.totalLatencyMs} ms
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand-400" /> Custo por Inferência
              </span>
              <p className="text-xl font-bold text-brand-400 font-mono mt-1">
                ${result.totalCostUsd.toFixed(6)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-fmcg-blue" /> SKUs Detetados
              </span>
              <p className="text-xl font-bold text-white font-mono mt-1">
                {result.detectedItems.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> RGPD Art. 5
              </span>
              <p className="text-xs font-bold text-brand-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Efémero em Memória
              </p>
            </div>
          </div>

          {/* Cascade Telemetry Pipeline Visualizer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Passo a Passo da Cascata de Decisão
            </h4>

            <div className="space-y-2.5">
              {result.cascadeTelemetry.map((step) => (
                <div
                  key={step.step}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    step.status === 'passed'
                      ? 'bg-brand-950/20 border-brand-500/30'
                      : step.status === 'skipped'
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-50'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {step.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{step.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({step.engine})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{step.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center font-mono text-xs">
                    {step.latencyMs > 0 && <span>{step.latencyMs}ms</span>}
                    {step.confidenceScore > 0 && (
                      <span className="font-bold text-brand-400">
                        {(step.confidenceScore * 100).toFixed(0)}% Conf.
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700">
                      {step.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Products List */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              SKUs Reconhecidos & Busca Vetorial de Equivalentes
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.detectedItems.map((item) => (
                <div
                  key={item.sku}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-brand-400 font-bold">{item.sku}</span>
                        <span className="text-[10px] font-mono text-slate-300">{(item.confidence * 100).toFixed(0)}% Confiança</span>
                      </div>
                      <h5 className="text-xs font-bold text-white truncate mt-1">{item.product.name}</h5>
                      <p className="text-xs font-mono text-white font-bold mt-1">€{item.product.basePrice.toFixed(2)}</p>
                    </div>
                  </div>

                  {item.alternativeSuggestions && item.alternativeSuggestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-amber-400 text-[11px] truncate">
                        Equivalente: {item.alternativeSuggestions[0].name} (€{item.alternativeSuggestions[0].basePrice.toFixed(2)})
                      </span>
                      <button
                        onClick={() => addToCart(item.alternativeSuggestions![0].sku, 1, settings?.preferredSupermarket, 'mcp_tool')}
                        className="px-2.5 py-1 rounded bg-slate-800 text-[10px] text-white hover:bg-slate-700 font-bold whitespace-nowrap ml-2"
                      >
                        Trocar
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => addToCart(item.sku, 1, settings?.preferredSupermarket, 'photo_scanner')}
                    className="w-full py-2 rounded-xl bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 border border-brand-500/30 text-xs font-bold transition"
                  >
                    + Adicionar ao Carrinho da Storefront
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
