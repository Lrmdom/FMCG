import React, { useState } from 'react';
import { FmcgServiceProvider, useFmcgContext } from '@/sdk/context/FmcgServiceContext.tsx';
import { Header } from '@/components/Header.tsx';
import { StorefrontView } from '@/components/StorefrontView.tsx';
import { PantryManager } from '@/components/PantryManager.tsx';
import { VisionStudio } from '@/components/VisionStudio.tsx';
import { McpConsole } from '@/components/McpConsole.tsx';
import { EconomicsDashboard } from '@/components/EconomicsDashboard.tsx';
import { SettingsView } from '@/components/SettingsView.tsx';
import { CartDrawer } from '@/components/CartDrawer.tsx';
import { FmcgPhotoScanner } from '@/sdk/components/FmcgPhotoScanner.tsx';
import { Sparkles, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'storefront' | 'pantry' | 'vision' | 'mcp' | 'economics' | 'settings'>('storefront');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { activeToast } = useFmcgContext();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-slate-950">
      {/* Top Header */}
      <div>
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Global Toast Notification */}
        {activeToast && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-xl max-w-sm ${
              activeToast.type === 'success'
                ? 'bg-slate-900/95 border-brand-500/40 text-slate-100 shadow-brand-500/10'
                : activeToast.type === 'warning'
                ? 'bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-rose-500/10'
                : 'bg-slate-900/95 border-fmcg-blue/40 text-slate-100 shadow-blue-500/10'
            }`}>
              {activeToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />}
              {activeToast.type === 'warning' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
              {activeToast.type === 'info' && <Info className="w-5 h-5 text-fmcg-blue flex-shrink-0 mt-0.5" />}
              <div>
                <h5 className="text-xs font-bold text-white">{activeToast.title}</h5>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{activeToast.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {activeTab === 'storefront' && (
            <StorefrontView
              onNavigateToPantry={() => setActiveTab('pantry')}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}
          {activeTab === 'pantry' && <PantryManager />}
          {activeTab === 'vision' && <VisionStudio />}
          {activeTab === 'mcp' && <McpConsole />}
          {activeTab === 'economics' && <EconomicsDashboard />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Drawers & Modals */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <FmcgPhotoScanner />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">FMCG Photo Shopping & Predictive Pantry Service</span>
            <span>•</span>
            <span className="text-brand-400">v1.0.0</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <a 
              href="https://hono.dev" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-brand-400 flex items-center gap-1 transition"
            >
              <span>Hono Framework</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">@modelcontextprotocol/sdk</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">React Router 8 Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <FmcgServiceProvider>
      <MainLayout />
    </FmcgServiceProvider>
  );
};

export default App;
