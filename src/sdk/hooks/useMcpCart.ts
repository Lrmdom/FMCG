import { useState } from 'react';
import { useFmcgContext } from '../context/FmcgServiceContext.tsx';
import { api } from '@/lib/api.ts';
import confetti from 'canvas-confetti';

export function useMcpCart() {
  const { cart, refreshCart, showToast } = useFmcgContext();
  const [isMutating, setIsMutating] = useState(false);

  const addToCart = async (sku: string, quantity: number = 1, supermarket?: 'Continente' | 'Pingo Doce' | 'Auchan' | 'Mercadona', addedBy: any = 'manual') => {
    setIsMutating(true);
    try {
      await api.addToCart({
        sku,
        quantity,
        supermarket,
        addedBy,
      });
      await refreshCart();
      showToast('Adicionado ao Carrinho 🛍️', `Item adicionado com sucesso.`, 'success');
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    } catch (err: any) {
      showToast('Erro ao Adicionar', err.message || 'Falha na operação', 'warning');
    } finally {
      setIsMutating(false);
    }
  };

  const updateQuantity = async (lineItemId: string, quantity: number) => {
    setIsMutating(true);
    try {
      await api.updateCartQuantity(lineItemId, quantity);
      await refreshCart();
    } catch (err: any) {
      showToast('Erro', 'Falha ao atualizar quantidade', 'warning');
    } finally {
      setIsMutating(false);
    }
  };

  const removeItem = async (lineItemId: string) => {
    setIsMutating(true);
    try {
      await api.removeCartItem(lineItemId);
      await refreshCart();
      showToast('Item Removido', 'Item retirado do carrinho.', 'info');
    } catch (err: any) {
      showToast('Erro', 'Falha ao remover item', 'warning');
    } finally {
      setIsMutating(false);
    }
  };

  const clearCart = async () => {
    setIsMutating(true);
    try {
      await api.clearCart();
      await refreshCart();
      showToast('Carrinho Limpo', 'Todos os itens foram removidos.', 'info');
    } catch (err: any) {
      showToast('Erro', 'Falha ao limpar carrinho', 'warning');
    } finally {
      setIsMutating(false);
    }
  };

  return {
    cart,
    isMutating,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
