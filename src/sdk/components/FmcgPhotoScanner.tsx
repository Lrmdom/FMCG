import React, { useState, useRef } from 'react';
import { useFmcgService } from '../hooks/useFmcgService.ts';
import { useMcpCart } from '../hooks/useMcpCart.ts';
import { usePantryRestock } from '../hooks/usePantryRestock.ts';
import { api } from '@/lib/api.ts';
import type { VisionAnalysisResult, VisionCascadeMethod } from '@shared/types.ts';
import { 
  Camera, 
  Upload, 
  Barcode, 
  Sparkles, 
  X, 
  Check, 
  Zap, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FmcgPhotoScanner: React.FC = () => {
  const { isScannerOpen, closeScanner, settings, showToast } = useFmcgService();
  const { addToCart } = useMcpCart();
  const { addItemToPantry } = usePantryRestock();

  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'barcode'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<string>('fridge_morning');
  const [barcodeInput, setBarcodeInput] = useState<string>('5601009901015');
  const [forceMethod, setForceMethod] = useState<VisionCascadeMethod | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isScannerOpen) return null;

  const handleRunAnalysis = async (customParams?: any) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let payload: any = {
        blurFaces: settings?.privacyBlurFaces ?? true,
        forceMethod,
      };

      if (activeTab === 'presets') {
        payload.presetScenarioId = selectedPreset;
      } else if (activeTab === 'barcode') {
        payload.eanBarcode = barcodeInput;
      }

      if (customParams) {
        payload = { ...payload, ...customParams };
      }

      const res = await api.analyzeVision(payload);
      setAnalysisResult(res);
      showToast('Deteção Concluída! 🎯', `${res.detectedItems.length} SKUs identificados via cascata de IA.`, 'success');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (err: any) {
      showToast('Falha na Análise', err.message || 'Erro ao processar imagem', 'warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddAllToCart = () => {
    if (!analysisResult) return;
    analysisResult.detectedItems.forEach(item => {
      addToCart(item.sku, 1, settings?.preferredSupermarket, 'photo_scanner');
    });
    closeScanner();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Estúdio de Visão Computacional FMCG
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700">
                  Cascata Híbrida
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Processamento efémero de fotos da despensa com deteção automática de SKUs
              </p>
            </div>
          </div>
          <button
            onClick={closeScanner}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Method Tabs */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-fit">
            <button
              onClick={() => { setActiveTab('presets'); setAnalysisResult(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'presets' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cenários Demonstrativos
            </button>
            <button
              onClick={() => { setActiveTab('barcode'); setAnalysisResult(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'barcode' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Leitor EAN Barcode
            </button>
            <button
              onClick={() => { setActiveTab('upload'); setAnalysisResult(null); }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'upload' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload / Câmera
            </button>
          </div>

          {/* Preset Selector */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Escolha um cenário fotográfico real:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'fridge_morning',
                    title: 'Frigorífico Matinal',
                    desc: 'Leite Mimosa 1L + Iogurtes Danone',
                    tier: 'Edge Worker AI (Confiança 94%)',
                    badge: 'Edge Pass',
                    color: 'text-brand-400',
                    img: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=400&auto=format&fit=crop&q=80',
                  },
                  {
                    id: 'pantry_breakfast',
                    title: 'Prateleira da Despensa',
                    desc: 'Café Delta Q + Azeite Oliveira da Serra + Arroz Cigala',
                    tier: 'Edge Worker AI (Confiança 88%)',
                    badge: 'Edge Pass',
                    color: 'text-brand-400',
                    img: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&auto=format&fit=crop&q=80',
                  },
                  {
                    id: 'empty_box_blur',
                    title: 'Embalagem no Cesto (Luz Baixa)',
                    desc: 'Detergente Skip amassado (Gera Fallback Gemini Flash)',
                    tier: 'Gemini 2.5 Flash Fallback',
                    badge: 'LLM Fallback',
                    color: 'text-amber-400',
                    img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&auto=format&fit=crop&q=80',
                  },
                  {
                    id: 'barcode_instant',
                    title: 'EAN-13 Barcode Scanning',
                    desc: 'Leitura nativa instantânea 5601009901015',
                    tier: 'Native Barcode Detector (100%)',
                    badge: '0ms Latência',
                    color: 'text-fmcg-blue',
                    img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPreset(item.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3.5 ${
                      selectedPreset === item.id 
                        ? 'bg-slate-800/90 border-brand-500 ring-2 ring-brand-500/20 shadow-lg' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={item.img} alt={item.title} className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.desc}</p>
                      <p className={`text-[10px] font-mono mt-1 ${item.color}`}>{item.tier}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barcode Tab */}
          {activeTab === 'barcode' && (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Barcode className="w-6 h-6 text-brand-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Simulador de Leitor de Código de Barras EAN-13</h4>
                  <p className="text-xs text-slate-400">Leitura direta sem custo de inferência na cloud ($0,00)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Insira código EAN (ex: 5601009901015)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => setBarcodeInput('5601009901015')}
                    className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono"
                  >
                    Mimosa
                  </button>
                  <button
                    onClick={() => setBarcodeInput('5601112233445')}
                    className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono"
                  >
                    Azeite
                  </button>
                  <button
                    onClick={() => setBarcodeInput('5601234567890')}
                    className="px-2.5 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono"
                  >
                    Delta Q
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-950/40 text-center transition flex flex-col items-center justify-center">
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <h4 className="text-sm font-semibold text-white">Arraste uma fotografia ou clique para carregar</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                As imagens são processadas em memória efémera na Edge e destruídas após a deteção (RGPD Art. 5).
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      handleRunAnalysis({ imageBase64: base64String });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
              >
                Abrir Câmera / Selecionar Ficheiro
              </button>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Desfoque facial ativo na Edge</span>
            </div>

            <button
              onClick={() => handleRunAnalysis()}
              disabled={isAnalyzing}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-400 text-slate-950 disabled:opacity-50 transition shadow-lg shadow-brand-500/20 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>A Executar Cascata de IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analisar com IA em Cascata</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-6 pt-6 border-t border-slate-800 animate-in fade-in duration-300">
              {/* Telemetry Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Latência Total</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">
                    {analysisResult.totalLatencyMs} ms
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Custo da Inferência</span>
                  <p className="text-base font-bold text-brand-400 font-mono mt-0.5">
                    ${analysisResult.totalCostUsd.toFixed(6)} USD
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">SKUs Identificados</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">
                    {analysisResult.detectedItems.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Conformidade RGPD</span>
                  <p className="text-xs font-bold text-brand-400 mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Efémero 100%
                  </p>
                </div>
              </div>

              {/* Cascade Telemetry Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Etapas da Cascata Visual Híbrida
                </h4>
                <div className="space-y-2">
                  {analysisResult.cascadeTelemetry.map((step) => {
                    const isPassed = step.status === 'passed';
                    const isSkipped = step.status === 'skipped';
                    const isFallback = step.status === 'fallback_required';

                    return (
                      <div
                        key={step.step}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                          isPassed
                            ? 'bg-brand-950/20 border-brand-500/30 text-slate-200'
                            : isSkipped
                            ? 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                            : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                            isPassed ? 'bg-brand-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {step.step}
                          </span>
                          <div>
                            <span className="font-bold text-white">{step.name}</span>
                            <span className="text-[11px] text-slate-400 ml-2 font-mono">({step.engine})</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{step.details}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center font-mono text-[11px]">
                          {step.latencyMs > 0 && <span>{step.latencyMs}ms</span>}
                          {step.confidenceScore > 0 && (
                            <span className="font-bold text-brand-400">
                              {(step.confidenceScore * 100).toFixed(0)}% Conf.
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700">
                            {step.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detected SKUs & Equivalent Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Produtos Detetados & Sugestões de Poupança (pgvector)
                  </h4>
                  <button
                    onClick={handleAddAllToCart}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-400 text-slate-950 transition"
                  >
                    Adicionar Todos ao Carrinho
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.detectedItems.map((item) => (
                    <div
                      key={item.sku}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-brand-400 font-bold">
                              {item.sku}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 font-mono">
                              {(item.confidence * 100).toFixed(0)}% Confiança
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white truncate mt-0.5">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-white">
                              €{item.product.basePrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              / {item.product.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Equivalents / White-label alternative */}
                      {item.alternativeSuggestions && item.alternativeSuggestions.length > 0 && (
                        <div className="pt-2.5 border-t border-slate-800/80">
                          <span className="text-[10px] font-semibold text-fmcg-amber uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Alternativa Recomendada (Poupança):
                          </span>
                          <div className="mt-1 flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                            <div className="truncate">
                              <p className="font-semibold text-slate-200 truncate">
                                {item.alternativeSuggestions[0].name}
                              </p>
                              <p className="text-[11px] text-brand-400 font-bold">
                                €{item.alternativeSuggestions[0].basePrice.toFixed(2)} (Poupança de €{(item.product.basePrice - item.alternativeSuggestions[0].basePrice).toFixed(2)})
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                addToCart(item.alternativeSuggestions![0].sku, 1, settings?.preferredSupermarket, 'mcp_tool');
                                showToast('Alternativa Adicionada', `${item.alternativeSuggestions![0].name} adicionado ao carrinho.`, 'success');
                              }}
                              className="px-2.5 py-1 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 whitespace-nowrap ml-2"
                            >
                              Trocar & Poupar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quick Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            addToCart(item.sku, 1, settings?.preferredSupermarket, 'photo_scanner');
                          }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 border border-brand-500/30 transition text-center"
                        >
                          + Adicionar ao Carrinho
                        </button>
                        <button
                          onClick={() => {
                            addItemToPantry(item.sku, 'pantry', 1);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          + Guardar na Despensa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Powered by Fast Hono API & @modelcontextprotocol/sdk
          </span>
          <button
            onClick={closeScanner}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
