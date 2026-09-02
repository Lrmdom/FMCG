import { useFmcgContext } from '../context/FmcgServiceContext.tsx';

/**
 * Hook principal para consultar o estado e ativar/desativar o serviço FMCG na Storefront
 */
export function useFmcgService() {
  const {
    settings,
    isServiceActive,
    isLoading,
    toggleService,
    updateSettings,
    openScanner,
    closeScanner,
    isScannerOpen,
    showToast,
  } = useFmcgContext();

  return {
    isServiceActive,
    settings,
    isLoading,
    toggleService,
    updateSettings,
    openScanner,
    closeScanner,
    isScannerOpen,
    showToast,
  };
}
