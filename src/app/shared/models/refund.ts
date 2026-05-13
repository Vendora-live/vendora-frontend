export enum RefundRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}

export interface DtoRefundRequest {
  orderItemId: number;
  reason: string;
}

export interface DtoRejectRefundRequest {
  rejectionReason: string;
}

export interface DtoRefundResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  orderItemId: number;
  productName: string;
  subOrderId: number;
  masterOrderId: number;
  storeName: string;
  reason: string;
  status: RefundRequestStatus;
  rejectionReason?: string;
  refundAmount: number;
}
