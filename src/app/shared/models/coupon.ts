import { BaseDto } from './base-dto';

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface DtoCouponResponse extends BaseDto {
  code: string;
  type: CouponType;
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  storeId: number;
  storeName: string;
}

export interface DtoCreateCouponRequest {
  code: string;
  type: CouponType;
  discountValue: number;
  minOrderAmount?: number;
  expiryDate?: string;
  usageLimit?: number;
}
