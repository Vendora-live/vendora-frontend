import { BaseDto } from './base-dto';

export interface DtoWishlistItem extends BaseDto {
  productId: number;
  productName: string;
  primaryImageUrl: string | null;
  unitPrice: number;
  categoryName: string;
  storeId: number;
  storeName: string;
  stockQuantity: number;
}

export interface DtoAddToWishlistRequest {
  productId: number;
}
