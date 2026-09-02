import React, { useState, useEffect } from 'react';
import { useFmcgService } from '@/sdk/hooks/useFmcgService.ts';
import { useMcpCart } from '@/sdk/hooks/useMcpCart.ts';
import { PantryWidget } from '@/sdk/components/PantryWidget.tsx';
import { api } from '@/lib/api.ts';
import type { FmcgProduct, ProductCategory } from '@shared/types.ts';
import { 
  Search, 
  Sparkles, 
  Camera, 
  ShoppingCart, 
  Store, 
  Zap, 
  Tag, 
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface StorefrontViewProps {
  onNavigateToPantry: () => void;
  onNavigateToSettings: () => void;
}

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos os Produtos' },
  { id: 'lacticinios', label: 'Lacticínios' },
  { id: 'mercearia', label: 'Mercearia & Despensa' },
  { id: 'bebidas', label: 'Bebidas & Cafés' },
  { id: 'higiene_limpeza', label: 'Higiene & Limpeza' },
];

export const StorefrontView: React.FC<StorefrontViewProps> = ({ onNavigateToPantry, onNavigateToSettings }) => {
  const { isServiceActive, openScanner, settings } = useFmcgService();
  const { addToCart } = useMcpCart();

  const [products, setProducts] = useState<FmcgProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        if (searchQuery.trim().length > 1) {
          const res = await api.searchCatalog(searchQuery);
          setProducts(res.results);
        } else {
          const cat = selectedCategory === 'all' ? undefined : selectedCategory;
          const prods = await api.getCatalog(cat);
          setProducts(prods);
        }
      } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* FMCG Opt-In Teaser Banner (When Service is Deactivated) */}
      {!isServiceActive && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-brand-500/30 p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Novo Serviço Opcional</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Ative o Photo Shopping & Gestão Preditiva da Despensa
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Tire uma foto ao frigorífico ou embalagens vazias para adicionar produtos instantaneamente ao carrinho via IA em cascata e receba alertas preditivos antes dos alimentos acabarem.
              </p>
            </div>
            <button
              onClick={onNavigateToSettings}
              className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs md:text-sm transition shadow-xl shadow-brand-500/20 whitespace-nowrap flex items-center gap-2"
            >
              <span>Ativar nas Definições (€4,99/mês)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Embedded Pantry Widget (Only when FMCG service is ACTIVE) */}
      {isServiceActive && (
        <PantryWidget onNavigateToPantry={onNavigateToPantry} />
      )}

      {/* Store Catalog Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Catálogo de Grande Consumo (FMCG)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Preços atualizados em tempo real nos supermercados parceiros (Continente, Pingo Doce, Auchan, Mercadona)
          </p>
        </div>

        {/* Search Bar & Camera Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar leite, café, azeite..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {isServiceActive && (
            <button
              onClick={openScanner}
              className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30 hover:bg-brand-500/20 transition"
              title="Digitalizar Foto da Despensa"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSearchQuery('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.id && searchQuery === ''
                ? 'bg-slate-100 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-80 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <p className="text-sm text-slate-400">Nenhum produto encontrado para a pesquisa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const preferredSm = settings?.preferredSupermarket || 'Continente';
            const smPrice = product.supermarketPrices.find(s => s.supermarket === preferredSm);
            const price = smPrice?.promoPrice || smPrice?.price || product.basePrice;
            const hasPromo = smPrice?.promoPrice !== undefined;

            return (
              <div
                key={product.sku}
                className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/5 relative overflow-hidden"
              >
                {/* Store Brand / Top Brand Badge */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    product.isStoreBrand 
                      ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {product.brand}
                  </span>

                  {product.nutriScore && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Nutri-Score {product.nutriScore}
                    </span>
                  )}
                </div>

                {/* Image */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-950 mb-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  {hasPromo && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] shadow-lg">
                      PROMOÇÃO
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      EAN: {product.ean}
                    </p>
                  </div>

                  {/* Supermarket Comparison Matrix */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Store className="w-3 h-3 text-brand-400" /> {preferredSm}
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        €{price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Outros retalhistas:</span>
                      <span className="font-mono">
                        €{Math.min(...product.supermarketPrices.map(p => p.promoPrice || p.price)).toFixed(2)} - €{Math.max(...product.supermarketPrices.map(p => p.price)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3">
                    <button
                      onClick={() => addToCart(product.sku, 1, preferredSm as any, 'manual')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-slate-950 text-white font-bold text-xs transition flex items-center justify-center gap-2 group-hover:bg-brand-500 group-hover:text-slate-950"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Adicionar ao Carrinho</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
