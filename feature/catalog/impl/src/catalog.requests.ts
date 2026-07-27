import { Barcode } from '@feature/common';

export interface FindProductByBarcodeRequest {
  barcode: Barcode;
  populate: {
    brand?: true | false;
    fitment?: true | false;
    category?: true | false;
  };
}
