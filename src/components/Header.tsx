import React from 'react';
import { useFmcgService } from '@/sdk/hooks/useFmcgService.ts';
import { useMcpCart } from '@/sdk/hooks/useMcpCart.ts';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Camera, 
  BrainCircuit, 
  Settings, 
  Layers, 
  TrendingUp, 
  Zap, 
  Sparkles,
  PackageCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'storefront' | 'pantry' | 'vision' | 'mcp' | 'economics' | 'settings';
  setActiveTab: (tab: 'storefront' | 'pantry' | 'vision' | 'mcp' | 'economics' | 'settings') => void;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenCart }) => {
  const { isServiceActive, openScanner } = useFmcgService();
  const { cart } = useMcpCart();

  const totalCartItems = cart?.items.reduce((acc, i) => acc + i.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('storefront')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-slate-950 font-black">
              <ShoppingBag className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  FMCG Fresh<span className="text-brand-400">Hub</span>
                </span>
                {isServiceActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse-slow">
                    <Zap className="w-2.5 h-2.5 fill-brand-300" /> FMCG Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Modo Padrão
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Powered by Hono & @modelcontextprotocol/sdk
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('storefront')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'storefront' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Loja / Storefront
            </button>
            <button
              onClick={() => setActiveTab('pantry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'pantry' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Despensa Preditiva</span>
              {isServiceActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('vision')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'vision' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estúdio de Visão IA
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'mcp' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3 text-fmcg-blue" />
              <span>Consola MCP</span>
            </button>
            <button
              onClick={() => setActiveTab('economics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'economics' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-fmcg-amber" />
              <span>Unit Economics</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'settings' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>Definições</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            {/* Quick Scanner Button (If FMCG active) */}
            {isServiceActive && (
              <button
                onClick={openScanner}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 transition shadow-lg shadow-brand-500/20"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Scan Foto</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition"
              title="Abrir Carrinho"
            >
              <ShoppingCart className="w-5 h-5 text-slate-200" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-slate-950 font-mono text-[10px] font-black flex items-center justify-center shadow-lg">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-800/60 gap-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('storefront')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'storefront' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Loja
          </button>
          <button
            onClick={() => setActiveTab('pantry')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'pantry' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Despensa
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'vision' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Visão IA
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'mcp' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            MCP
          </button>
          <button
            onClick={() => setActiveTab('economics')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'economics' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Economics
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
            }`}
          >
            Definições
          </button>
        </div>
      </div>
    </header>
  );
};
