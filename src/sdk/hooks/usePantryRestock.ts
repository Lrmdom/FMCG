import { useFmcgContext } from '../context/FmcgServiceContext.tsx';
import { api } from '@/lib/api.ts';

export function usePantryRestock() {
  const {
    pantryItems,
    urgentRestockCount,
    triggerRestockToCart,
    refreshPantry,
    isServiceActive,
    showToast,
  } = useFmcgContext();

  const updateItemQuantity = async (id: string, newQuantity: number) => {
    try {
      await api.updatePantryQuantity(id, newQuantity);
      await refreshPantry();
      showToast('Despensa Atualizada', 'Nível de stock atualizado.', 'info');
    } catch (err) {
      showToast('Erro', 'Não foi possível atualizar o stock', 'warning');
    }
  };

  const addItemToPantry = async (sku: string, location: 'pantry' | 'fridge' | 'freezer' | 'cleaning' = 'pantry', quantity: number = 1) => {
    try {
      await api.addPantryItem(sku, location, quantity);
      await refreshPantry();
      showToast('Item Adicionado à Despensa', 'Stock registado com sucesso.', 'success');
    } catch (err) {
      showToast('Erro', 'Falha ao adicionar item à despensa', 'warning');
    }
  };

  const removeItem = async (id: string) => {
    try {
      await api.deletePantryItem(id);
      await refreshPantry();
      showToast('Item Removido', 'Produto retirado da despensa.', 'info');
    } catch (err) {
      showToast('Erro', 'Falha ao remover produto', 'warning');
    }
  };

  return {
    isServiceActive,
    pantryItems,
    urgentRestockCount,
    triggerRestockToCart,
    refreshPantry,
    updateItemQuantity,
    addItemToPantry,
    removeItem,
  };
}
