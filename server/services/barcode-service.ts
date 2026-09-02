import { FMCG_CATALOG } from '../../shared/catalog.ts';
import type { FmcgProduct } from '../../shared/types.ts';

export class BarcodeService {
  public static lookup(ean: string): FmcgProduct | undefined {
    return FMCG_CATALOG.find(p => p.ean === ean);
  }
}
