import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserFmcgSettings, CartState, PantryItem } from '@shared/types.ts';
import { api } from '@/lib/api.ts';
import confetti from 'canvas-confetti';

interface FmcgContextType {
  settings: UserFmcgSettings | null;
  isServiceActive: boolean;
  cart: CartState | null;
  pantryItems: PantryItem[];
  urgentRestockCount: number;
  isLoading: boolean;
  activeToast: { title: string; message: string; type?: 'success' | 'info' | 'warning' } | null;
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  toggleService: (enabled?: boolean) => Promise<void>;
  updateSettings: (newSettings: Partial<UserFmcgSettings>) => Promise<void>;
  refreshCart: () => Promise<void>;
  refreshPantry: () => Promise<void>;
  triggerRestockToCart: (daysThreshold?: number) => Promise<void>;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

const FmcgContext = createContext<FmcgContextType | undefined>(undefined);

export const FmcgServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserFmcgSettings | null>(null);
  const [cart, setCart] = useState<CartState | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [urgentRestockCount, setUrgentRestockCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{ title: string; message: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setActiveToast({ title, message, type });
    setTimeout(() => {
      setActiveToast(null);
    }, 4000);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [s, c, p] = await Promise.all([
        api.getSettings(),
        api.getCart(),
        api.getPantry(),
      ]);
      setSettings(s);
      setCart(c);
      setPantryItems(p.items);
      setUrgentRestockCount(p.urgentRestockCount);
    } catch (err) {
      console.error('Erro ao carregar dados do serviço FMCG:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleService = async (enabled?: boolean) => {
    if (!settings) return;
    const targetState = enabled !== undefined ? enabled : !settings.fmcgServiceEnabled;
    try {
      const res = await api.updateSettings({ fmcgServiceEnabled: targetState });
      setSettings(res.settings);
      if (targetState) {
        showToast('Serviço FMCG Ativado! ⚡', 'Photo Shopping e Gestão Preditiva de Despensa desbloqueados.', 'success');
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      } else {
        showToast('Serviço FMCG Desativado', 'A Storefront opera agora em modo de e-commerce padrão.', 'info');
      }
    } catch (err) {
      showToast('Erro', 'Falha ao atualizar definições', 'warning');
    }
  };

  const updateSettings = async (newSettings: Partial<UserFmcgSettings>) => {
    try {
      const res = await api.updateSettings(newSettings);
      setSettings(res.settings);
      showToast('Definições Guardadas', 'Preferências atualizadas com sucesso.', 'success');
    } catch (err) {
      showToast('Erro', 'Falha ao guardar preferências', 'warning');
    }
  };

  const refreshCart = async () => {
    try {
      const c = await api.getCart();
      setCart(c);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshPantry = async () => {
    try {
      const p = await api.getPantry();
      setPantryItems(p.items);
      setUrgentRestockCount(p.urgentRestockCount);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerRestockToCart = async (daysThreshold?: number) => {
    try {
      const res = await api.triggerRestockToCart(daysThreshold, settings?.preferredSupermarket);
      setCart(res.cart);
      await refreshPantry();
      showToast('Reposição Preditiva Efetuada! 🛒', `${res.restockedCount} produtos em fim de vida adicionados ao carrinho.`, 'success');
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      showToast('Erro', 'Falha ao processar reposição automática', 'warning');
    }
  };

  const isServiceActive = settings?.fmcgServiceEnabled ?? false;

  return (
    <FmcgContext.Provider
      value={{
        settings,
        isServiceActive,
        cart,
        pantryItems,
        urgentRestockCount,
        isLoading,
        activeToast,
        isScannerOpen,
        openScanner: () => setIsScannerOpen(true),
        closeScanner: () => setIsScannerOpen(false),
        toggleService,
        updateSettings,
        refreshCart,
        refreshPantry,
        triggerRestockToCart,
        showToast,
      }}
    >
      {children}
    </FmcgContext.Provider>
  );
};

export const useFmcgContext = () => {
  const context = useContext(FmcgContext);
  if (!context) {
    throw new Error('useFmcgContext deve ser utilizado dentro de um FmcgServiceProvider');
  }
  return context;
};
