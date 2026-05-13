export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_SHIPPED = 'PARTIALLY_SHIPPED',
  SHIPPED = 'SHIPPED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export interface DtoOrderRequest {
  addressId: number;
}

export interface DtoOrderItem {
  id?: number;
  productId: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  price: number;
}

export interface DtoOrder {
  id?: number;
  status: OrderStatus;
  grandTotal: number;
  orderDate: string;
  deliveredAt?: string;
  storeId?: number;
  storeName?: string;
  parentOrderId?: number;
  items: DtoOrderItem[];
  subOrders: DtoOrder[];
  fullAddress?: string;
}
