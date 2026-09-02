import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api.ts';
import type { UnitEconomicsMetrics } from '@shared/types.ts';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Layers, 
  Sparkles, 
  PieChart, 
  ShieldCheck, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Server,
  Zap
} from 'lucide-react';

export const EconomicsDashboard: React.FC = () => {
  const [usersCount, setUsersCount] = useState<number>(1000);
  const [imagesPerDay, setImagesPerDay] = useState<number>(25);
  const [metrics, setMetrics] = useState<UnitEconomicsMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEconomics = async () => {
      try {
        const data = await api.getEconomics(usersCount, imagesPerDay);
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEconomics();
  }, [usersCount, imagesPerDay]);

  if (!metrics) return null;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Análise Financeira, Custos & Unit Economics
          </h2>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
            Margem Bruta ~98.7%
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Modelo económico oficial especificado na Seção 4 da documentação de arquitetura, com base na subscrição doméstica de €4,99/mês e comissão de 5-10% sobre reposições FMCG.
        </p>
      </div>

      {/* Simulator Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          <span>Simulador de Escala em Tempo Real</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Slider 1: Active Users */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-fmcg-blue" />
                <span>Utilizadores Diários Ativos (DAU)</span>
              </label>
              <span className="text-sm font-bold text-white font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                {usersCount.toLocaleString()} utilizadores
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={usersCount}
              onChange={(e) => setUsersCount(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>100 (Piloto)</span>
              <span>1.000 (Target)</span>
              <span>10.000</span>
              <span>50.000</span>
            </div>
          </div>

          {/* Slider 2: Images per User/Day */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-fmcg-amber" />
                <span>Fotos Processadas por Utilizador / Dia</span>
              </label>
              <span className="text-sm font-bold text-white font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                {imagesPerDay} fotos/dia
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={imagesPerDay}
              onChange={(e) => setImagesPerDay(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5 fotos</span>
              <span>25 fotos (Target)</span>
              <span>50 fotos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-400" /> Custo Direto por Utilizador
          </span>
          <p className="text-3xl font-black text-white font-mono">
            ${metrics.costPerUserMonthlyUsd.toFixed(3)}
          </p>
          <p className="text-[11px] text-brand-400 font-medium">
            ~€0,06 por mês / utilizador ativo
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-fmcg-amber" /> Margem Bruta Tecnológica
          </span>
          <p className="text-3xl font-black text-brand-400 font-mono">
            {metrics.grossTechMarginPercentage}%
          </p>
          <p className="text-[11px] text-slate-400">
            Sobre a subscrição de €4,99/mês
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-fmcg-blue" /> Custo Total de Infraestrutura
          </span>
          <p className="text-3xl font-black text-slate-100 font-mono">
            ${metrics.totalInfraCostMonthlyUsd.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.monthlyImagesScanned.toLocaleString()} fotos/mês
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" /> Receita Mensal Estimada
          </span>
          <p className="text-3xl font-black text-white font-mono">
            €{(metrics.monthlySubscriptionRevenueEur + metrics.supermarketCommissionRevenueEur).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">
            SaaS + Comissões de Supermercados
          </p>
        </div>
      </div>

      {/* Infrastructure Cost Breakdown Table (Section 4 Specification Grounding) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-brand-400" />
          <span>Matriz Detalhada de Custos Mensais de Infraestrutura</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider font-mono">
                <th className="pb-3">Componente Tecnológico</th>
                <th className="pb-3">Especificação & Runtime</th>
                <th className="pb-3">Volume Mensal</th>
                <th className="pb-3 text-right">Custo Estimado (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              <tr>
                <td className="py-3.5 font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-400" />
                  <span>Edge Compute (Hono API)</span>
                </td>
                <td className="py-3.5 text-slate-400">Cloudflare Workers / Node.js Runtime</td>
                <td className="py-3.5 font-mono text-slate-300">{(usersCount * 1500).toLocaleString()} reqs</td>
                <td className="py-3.5 text-right font-mono font-bold text-white">$5,00</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>Edge AI (Worker AI)</span>
                </td>
                <td className="py-3.5 text-slate-400">Cloudflare Workers AI (Llama 3.2 Vision)</td>
                <td className="py-3.5 font-mono text-slate-300">{(metrics.monthlyImagesScanned * 0.8).toLocaleString()} fotos (80%)</td>
                <td className="py-3.5 text-right font-mono font-bold text-white">${metrics.edgeAiCostMonthlyUsd.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>LLM Fallback API</span>
                </td>
                <td className="py-3.5 text-slate-400">OpenRouter / Gemini 2.5 Flash</td>
                <td className="py-3.5 font-mono text-slate-300">{(metrics.monthlyImagesScanned * 0.2).toLocaleString()} fotos (20%)</td>
                <td className="py-3.5 text-right font-mono font-bold text-white">${metrics.geminiFallbackCostMonthlyUsd.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-fmcg-blue" />
                  <span>Vector Database</span>
                </td>
                <td className="py-3.5 text-slate-400">Supabase (pgvector) Embeddings</td>
                <td className="py-3.5 font-mono text-slate-300">Catálogo FMCG</td>
                <td className="py-3.5 text-right font-mono font-bold text-white">${metrics.supabaseVectorCostMonthlyUsd.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-3.5 font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>Servidor MCP</span>
                </td>
                <td className="py-3.5 text-slate-400">@modelcontextprotocol/sdk Fast Server</td>
                <td className="py-3.5 font-mono text-slate-300">Mutações & Tools</td>
                <td className="py-3.5 text-right font-mono font-bold text-white">${metrics.mcpServerCostMonthlyUsd.toFixed(2)}</td>
              </tr>
              <tr className="border-t-2 border-slate-700 bg-slate-950/40">
                <td className="py-4 font-black text-white text-sm" colSpan={3}>
                  CUSTO TOTAL MENSAL DE INFRAESTRUTURA
                </td>
                <td className="py-4 text-right font-mono font-extrabold text-brand-400 text-base">
                  ${metrics.totalInfraCostMonthlyUsd.toFixed(2)} USD
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
