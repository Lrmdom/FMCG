import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api.ts';
import { useMcpCart } from '@/sdk/hooks/useMcpCart.ts';
import { useFmcgService } from '@/sdk/hooks/useFmcgService.ts';
import type { SimpleVisionResult, VisionCascadeMethod } from '@shared/types.ts';
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
  Clock,
  ShoppingCart,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const VisionStudio: React.FC = () => {
  const { settings, showToast } = useFmcgService();
  const { addToCart } = useMcpCart();

  const [selectedScenario, setSelectedScenario] = useState<string>('fridge_morning');
  const [forceMethod, setForceMethod] = useState<VisionCascadeMethod | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<SimpleVisionResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para resultados quando a análise é concluída
  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  const getValidSupermarket = () => {
    const pref = settings?.preferredSupermarket;
    if (pref && pref !== 'cheapest_split') return pref;
    return undefined;
  };

  const handleRun = async (scenarioId = selectedScenario, forced = forceMethod) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await api.analyzeVision({
        presetScenarioId: scenarioId,
        forceMethod: forced as 'barcode' | 'edge_ai' | 'gemini_fallback' | undefined,
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

  // Imagem do cenário selecionado
  const scenarioImages: Record<string, string> = {
    fridge_morning: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=400&auto=format&fit=crop&q=80',
    pantry_breakfast: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&auto=format&fit=crop&q=80',
    empty_box_blur: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&auto=format&fit=crop&q=80',
    barcode_instant: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
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

      {/* Loading state */}
      {isAnalyzing && !result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-brand-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">A analisar imagem com IA em cascata...</h3>
          <p className="text-sm text-slate-400">A pipeline híbrida está a processar a fotografia. Isto pode demorar alguns segundos.</p>
        </div>
      )}

      {/* Results Section - Always visible when there are results */}
      {result && (
        <div ref={resultsRef} className="space-y-6 animate-in fade-in duration-500">
          {/* Results Header Banner */}
          <div className="bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent border border-brand-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-brand-500/20 border border-brand-500/30">
                <CheckCircle2 className="w-8 h-8 text-brand-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {result.detectedItems.length} Produto{result.detectedItems.length > 1 ? 's' : ''} Detetado{result.detectedItems.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  Análise concluída em <span className="font-mono text-brand-400 font-bold">{result.totalLatencyMs}ms</span> com cascata híbrida
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  result.detectedItems.forEach(item => {
                    addToCart(item.sku, 1, getValidSupermarket(), 'photo_scanner');
                  });
                  showToast('Adicionado ao Carrinho! 🛒', `${result.detectedItems.length} produtos adicionados.`, 'success');
                }}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-brand-500/20 flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Adicionar Todos ao Carrinho
              </button>
            </div>
          </div>

          {/* Image Preview + Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Preview */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-400" />
                  Imagem Analisada
                </h4>
              </div>
              <div className="p-4">
                <img
                  src={scenarioImages[selectedScenario] || ''}
                  alt="Imagem analisada"
                  className="w-full h-48 object-cover rounded-2xl border border-slate-700"
                />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Cenário</span>
                    <p className="text-white font-semibold truncate">{selectedScenario.replace('_', ' ')}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Método</span>
                    <p className="text-brand-400 font-semibold text-[10px] font-mono">{result.detectedItems[0]?.detectionMethod || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detected Products Cards */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-400" />
                Produtos Identificados
              </h4>

              {result.detectedItems && result.detectedItems.length > 0 ? (
                <div className="space-y-3">
                  {result.detectedItems.map((item, idx) => {
                    const product = item.product || {};
                    const productName = product.name || 'Produto sem nome';
                    const productImage = product.imageUrl || '';
                    const productPrice = typeof product.basePrice === 'number' ? product.basePrice : 0;
                    const productUnit = product.unit || 'un';
                    return (
                      <div
                        key={item.sku || `item-${idx}`}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-brand-500/50 transition group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-700 group-hover:border-brand-500/50 transition bg-slate-800 flex items-center justify-center">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl">📦</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-2xl">📦</span>
                              )}
                            </div>
                            <div className="mt-1.5 text-center">
                              <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h5 className="text-sm font-bold text-white truncate">{productName}</h5>
                                <p className="text-[11px] font-mono text-brand-400 mt-0.5">{item.sku}</p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-lg font-black text-white">€{productPrice.toFixed(2)}</p>
                                <p className="text-[10px] text-slate-500">/ {productUnit}</p>
                              </div>
                            </div>

                            {/* Confidence Badge */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                                  style={{ width: `${(item.confidence * 100).toFixed(0)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-brand-400 font-mono flex-shrink-0">
                                {(item.confidence * 100).toFixed(0)}%
                              </span>
                            </div>

                            {/* Alternative suggestion */}
                            {item.alternativeSuggestions && item.alternativeSuggestions.length > 0 && (
                              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <div className="flex items-center justify-between">
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Alternativa mais barata</span>
                                    <p className="text-xs text-slate-300 truncate mt-0.5">
                                      {item.alternativeSuggestions[0].name} — €{item.alternativeSuggestions[0].basePrice.toFixed(2)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      addToCart(item.alternativeSuggestions![0].sku, 1, getValidSupermarket(), 'mcp_tool');
                                      showToast('Alternativa Adicionada', `${item.alternativeSuggestions![0].name} adicionado.`, 'success');
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold border border-amber-500/30 transition flex-shrink-0 ml-2"
                                  >
                                    Trocar e Poupar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                          <button
                            onClick={() => {
                              addToCart(item.sku, 1, getValidSupermarket(), 'photo_scanner');
                              showToast('Adicionado! 🛒', `${productName} adicionado ao carrinho.`, 'success');
                            }}
                            className="flex-1 py-2 rounded-xl bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 border border-brand-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Adicionar ao Carrinho
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhum produto detetado na imagem.</p>
                </div>
              )}
            </div>
          </div>

          {/* Cascade Telemetry - Collapsible */}
          <details className="bg-slate-900 border border-slate-800 rounded-3xl group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-fmcg-amber" />
                Pipeline de Decisão da Cascata (Telemetria)
              </h4>
              <span className="text-xs text-slate-500 font-mono group-open:hidden">▼</span>
              <span className="text-xs text-slate-500 font-mono hidden group-open:list-item">▲</span>
            </summary>
            <div className="px-6 pb-6 space-y-2.5">
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
          </details>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" /> Latência
              </span>
              <p className="text-lg font-bold text-white font-mono mt-1">{result.totalLatencyMs}ms</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand-400" /> Custo
              </span>
              <p className="text-lg font-bold text-brand-400 font-mono mt-1">${result.totalCostUsd.toFixed(6)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-fmcg-blue" /> SKUs
              </span>
              <p className="text-lg font-bold text-white font-mono mt-1">{result.detectedItems.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> RGPD
              </span>
              <p className="text-xs font-bold text-brand-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Efémero
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state - no results yet */}
      {!result && !isAnalyzing && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Camera className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-400">Selecione um cenário para começar</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Escolha uma fotografia de teste acima e clique para analisar. A IA em cascata irá detetar os produtos automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};
