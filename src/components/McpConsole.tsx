import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api.ts';
import { useFmcgService } from '@/sdk/hooks/useFmcgService.ts';
import { 
  Terminal, 
  Play, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Code,
  Copy,
  Check
} from 'lucide-react';

export const McpConsole: React.FC = () => {
  const { showToast, refreshCart, refreshPantry } = useFmcgService();

  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('add_item_to_cart');
  const [paramsInput, setParamsInput] = useState<string>('{\n  "cartId": "cart-session-001",\n  "sku": "FMCG-LEI-001",\n  "quantity": 2,\n  "supermarket": "Continente"\n}');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadToolsAndLogs();
  }, []);

  const loadToolsAndLogs = async () => {
    try {
      const [t, l] = await Promise.all([
        api.getMcpTools(),
        api.getMcpLogs(),
      ]);
      setTools(t.tools || []);
      setLogs(l.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName);
    setExecutionResult(null);

    switch (toolName) {
      case 'add_item_to_cart':
        setParamsInput('{\n  "cartId": "cart-session-001",\n  "sku": "FMCG-LEI-001",\n  "quantity": 2,\n  "supermarket": "Continente"\n}');
        break;
      case 'get_product_details':
        setParamsInput('{\n  "sku": "FMCG-AZE-001"\n}');
        break;
      case 'suggest_equivalent_products':
        setParamsInput('{\n  "skuOrQuery": "FMCG-LEI-001",\n  "limit": 3\n}');
        break;
      case 'scan_pantry_items':
        setParamsInput('{\n  "presetScenarioId": "fridge_morning"\n}');
        break;
      case 'get_pantry_inventory':
        setParamsInput('{\n  "location": "fridge"\n}');
        break;
      case 'trigger_predictive_restock':
        setParamsInput('{\n  "daysThreshold": 3,\n  "supermarket": "Continente"\n}');
        break;
      default:
        setParamsInput('{}');
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(paramsInput);
      } catch (e) {
        throw new Error('Parâmetros JSON inválidos');
      }

      const res = await api.executeMcpTool(selectedTool, parsed);
      setExecutionResult(res);
      await Promise.all([loadToolsAndLogs(), refreshCart(), refreshPantry()]);
      showToast('Tool MCP Executada! 🚀', `Tool ${selectedTool} processada pelo @modelcontextprotocol/sdk.`, 'success');
    } catch (err: any) {
      showToast('Erro na Execução', err.message || 'Falha ao executar tool', 'warning');
      setExecutionResult({ error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Consola Model Context Protocol (MCP)
          </h2>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            @modelcontextprotocol/sdk v1.30.0
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Inspecione e teste as ferramentas universais de mutação de carrinho, inventário de despensa e predição consumíveis por agentes como Claude, Antigravity e Cursor.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tool Selection & Execution Panel */}
        <div className="lg:col-span-6 space-y-6">
          {/* Tool Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Ferramentas MCP Registadas ({tools.length})</span>
            </h3>

            <div className="space-y-2">
              {tools.map((t) => (
                <div
                  key={t.name}
                  onClick={() => handleToolChange(t.name)}
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    selectedTool === t.name
                      ? 'bg-purple-950/20 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-purple-400" />
                      {t.name}()
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Tool
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Parameter Editor & Run Button */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-400" />
                <span>Parâmetros de Entrada (JSON)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Zod Schema Validated
              </span>
            </div>

            <textarea
              value={paramsInput}
              onChange={(e) => setParamsInput(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-brand-300 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
            />

            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>A Executar no Servidor FastMCP...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Executar {selectedTool}()</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right JSON-RPC Output & Audit Logs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Output Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col h-[340px]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-fmcg-blue" />
                <span>Resposta do Servidor MCP</span>
              </h3>
              {executionResult && (
                <button
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-brand-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-y-auto scrollbar-none text-slate-200">
              {executionResult ? (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-center">
                  <span>Selecione uma tool e clique em "Executar" para ver a resposta JSON-RPC em tempo real.</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Execution Audit Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Registo de Execuções Recentes ({logs.length})</span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Nenhuma execução registada ainda.</p>
              ) : (
                logs.slice(0, 5).map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                      <span className="font-bold text-slate-200 truncate">{l.toolName}()</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-shrink-0">
                      <span>{l.durationMs}ms</span>
                      <span className="text-brand-400 font-bold">{l.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
