import React, { useState, useEffect } from 'react';
import { FmcgSettingsCard } from '@/sdk/components/FmcgSettingsCard.tsx';
import { api } from '@/lib/api.ts';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Trash2, 
  FileText, 
  CheckCircle2,
  Cpu,
  Zap,
  Layers
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [gdprData, setGdprData] = useState<any>(null);

  useEffect(() => {
    api.getGdprLogs().then(setGdprData).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Definições da Conta & Serviços Ativos
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Gerencie as suas subscrições, integrações de inteligência artificial e preferências de privacidade na Storefront
        </p>
      </div>

      {/* Main FMCG Service Card (Central Opt-in) */}
      <FmcgSettingsCard />

      {/* RGPD & Privacy Center */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Privacidade, Retenção Zero & Conformidade RGPD (Art. 5)
            </h3>
            <p className="text-xs text-slate-400">
              Processamento 100% efémero em memória no microsserviço Hono
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400">
              <CheckCircle2 className="w-4 h-4" /> Memória Efémera
            </div>
            <p className="text-xs text-slate-400">
              Fotos destruídas imediatamente após deteção de SKUs. Zero persistência em disco.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-fmcg-blue">
              <Lock className="w-4 h-4" /> Filtro Visual na Edge
            </div>
            <p className="text-xs text-slate-400">
              Desfoque automático de rostos e dados pessoais antes do envio para modelos multimodais.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
              <Database className="w-4 h-4" /> Auditoria Apenas de SKUs
            </div>
            <p className="text-xs text-slate-400">
              Apenas os códigos de produto (ex: FMCG-LEI-001) são associados à sessão de compras.
            </p>
          </div>
        </div>

        {/* Live Ephemeral Logs */}
        {gdprData && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Registo Recente de Auditoria Efémera
            </h4>
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs max-h-40 overflow-y-auto scrollbar-none space-y-2">
              {gdprData.logs && gdprData.logs.length > 0 ? (
                gdprData.logs.slice(0, 6).map((log: any, idx: number) => (
                  <div key={`${log.timestamp}-${idx}`} className="flex items-center justify-between text-slate-300">
                    <span className="text-brand-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-slate-200 font-bold">{log.action}</span>
                    <span className="text-slate-500">Retenção: {log.retentionSec}s (Efémero)</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500">Nenhuma mutação visual pendente em memória.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
