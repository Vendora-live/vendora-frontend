import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ShipmentService } from '../../../core/services/shipment.service';
import { ReviewService } from '../../../core/services/review.service';
import { ProductService } from '../../../core/services/product.service';
import { RefundService } from '../../../core/services/refund.service';
import { ToastService } from '../../../core/services/toast.service';
import { DtoOrder, DtoOrderItem, OrderStatus } from '../../../shared/models/order';
import { DtoShipment, ShipmentStatus } from '../../../shared/models/shipment';
import { DtoRefundResponse, RefundRequestStatus } from '../../../shared/models/refund';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ReviewWidgetComponent } from '../../../shared/components/review-widget/review-widget.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-ind-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReviewWidgetComponent, TranslateModule, BreadcrumbComponent],
  templateUrl: './ind-order-detail.component.html',
  styleUrl: './ind-order-detail.component.css'
})
export class IndOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private shipmentService = inject(ShipmentService);
  private reviewService = inject(ReviewService);
  private refundService = inject(RefundService);
  private toastService = inject(ToastService);
  private productService = inject(ProductService);
  private translate = inject(TranslateService);

  order: DtoOrder | null = null;
  isLoading = true;
  breadcrumbs: BreadcrumbItem[] = [];
  shipmentsMap: Record<number, DtoShipment | null> = {};
  productImagesMap: Record<number, string> = {};

  // Review State
  reviewedProductIds = new Set<number>();
  reviewProductId: number | null = null;
  showReviewModal = false;

  // Refund State
  RefundRequestStatus = RefundRequestStatus;
  refundRequestsMap: Record<number, DtoRefundResponse | null> = {};
  showRefundModal = false;
  refundItemId: number | null = null;
  refundReason = '';
  submittingRefund = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadOrder(parseInt(idParam, 10));
      this.loadMyReviews();
      this.loadMyRefundRequests();
    } else {
      this.toastService.showError('Invalid order ID.');
      this.isLoading = false;
    }
  }

  loadMyReviews(): void {
    this.reviewService.getMyReviews({ pageNumber: 0, pageSize: 100 }).pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      (res?.content || []).forEach(r => {
        if (r.productId) {
          this.reviewedProductIds.add(r.productId);
        }
      });
    });
  }

  loadOrder(orderId: number): void {
    this.isLoading = true;
    this.orderService.getById(orderId).pipe(
      catchError(() => {
        this.toastService.showError('Failed to load order details.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(order => {
      this.order = order;
      if (order) {
        this.breadcrumbs = [
          { label: this.translate.instant('IND.nav.activeOrders'), route: ['/individual/orders'] },
          { label: this.translate.instant('ORDER_DETAIL.orderNumber', { id: order.id }) }
        ];
        if (order.items) {
          this.populateImageMap(order.items);
        }
        if (order.subOrders) {
          order.subOrders.forEach(sub => {
            if (sub.id) {
              this.loadShipmentForSubOrder(sub.id);
            }
            if (sub.items) {
              this.populateImageMap(sub.items);
            }
          });
        }
      }
      this.isLoading = false;
    });
  }

  private populateImageMap(items: DtoOrderItem[]): void {
    items.forEach(item => {
      if (item.productImageUrl && !this.productImagesMap[item.productId]) {
        this.productImagesMap[item.productId] = item.productImageUrl;
      }
    });
  }

  loadShipmentForSubOrder(subOrderId: number): void {
    this.shipmentsMap[subOrderId] = null;
    this.shipmentService.getByOrderId(subOrderId).pipe(
      catchError(() => of(null))
    ).subscribe(shipment => {
      this.shipmentsMap[subOrderId] = shipment;
    });
  }

  getStatusClass(status: OrderStatus | ShipmentStatus): string {
    switch (status) {
      case OrderStatus.PENDING: return 'status-pending';
      case OrderStatus.PAID: return 'status-approved';
      case OrderStatus.PARTIALLY_SHIPPED: return 'status-shipped';
      case OrderStatus.SHIPPED: return 'status-shipped';
      case OrderStatus.DELIVERED: return 'status-delivered';
      case OrderStatus.PARTIALLY_REFUNDED: return 'status-cancelled';
      case OrderStatus.REFUNDED: return 'status-cancelled';
      case OrderStatus.CANCELLED: return 'status-cancelled';
      case ShipmentStatus.PENDING: return 'status-pending';
      case ShipmentStatus.LABEL_CREATED: return 'status-approved';
      case ShipmentStatus.IN_TRANSIT: return 'status-shipped';
      case ShipmentStatus.OUT_FOR_DELIVERY: return 'status-shipped';
      case ShipmentStatus.DELIVERED: return 'status-delivered';
      case ShipmentStatus.RETURNED: return 'status-cancelled';
      case ShipmentStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  }

  isSubOrderDelivered(subOrder: DtoOrder): boolean {
    if (subOrder.status === OrderStatus.DELIVERED) return true;
    if (subOrder.id && this.shipmentsMap[subOrder.id]) {
      return this.shipmentsMap[subOrder.id]?.status === ShipmentStatus.DELIVERED;
    }
    return false;
  }

  loadMyRefundRequests(): void {
    this.refundService.getMyRequests({ pageNumber: 0, pageSize: 100 }).pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      (res?.content || []).forEach(r => {
        this.refundRequestsMap[r.orderItemId] = r;
      });
    });
  }

  openReviewModal(productId: number, event: Event): void {
    event.stopPropagation();
    this.reviewProductId = productId;
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.reviewProductId = null;
  }

  openRefundModal(itemId: number, event: Event): void {
    event.stopPropagation();
    this.refundItemId = itemId;
    this.refundReason = '';
    this.showRefundModal = true;
  }

  closeRefundModal(): void {
    this.showRefundModal = false;
    this.refundItemId = null;
    this.refundReason = '';
  }

  submitRefund(): void {
    if (!this.refundItemId || !this.refundReason.trim()) return;
    this.submittingRefund = true;
    this.refundService.create({ orderItemId: this.refundItemId, reason: this.refundReason }).pipe(
      catchError(err => {
        this.toastService.showError('Refund request failed. ' + (err.error?.exception?.message || ''));
        this.submittingRefund = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.refundRequestsMap[res.orderItemId] = res;
        this.toastService.showSuccess('Refund request submitted.');
        this.closeRefundModal();
      }
      this.submittingRefund = false;
    });
  }

  canRequestRefund(subOrder: DtoOrder, itemId: number): boolean {
    if (subOrder.status !== OrderStatus.DELIVERED) return false;
    if (this.refundRequestsMap[itemId] !== undefined && this.refundRequestsMap[itemId] !== null) return false;
    if (!subOrder.deliveredAt) return false;
    const deliveredAt = new Date(subOrder.deliveredAt);
    const sevenDaysLater = new Date(deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date() <= sevenDaysLater;
  }

  getRefundStatusClass(status: RefundRequestStatus): string {
    switch (status) {
      case RefundRequestStatus.PENDING: return 'status-pending';
      case RefundRequestStatus.APPROVED: return 'status-approved';
      case RefundRequestStatus.REFUNDED: return 'status-delivered';
      case RefundRequestStatus.REJECTED: return 'status-cancelled';
      case RefundRequestStatus.FAILED: return 'status-cancelled';
      default: return '';
    }
  }

  getImageUrl(url: string | null | undefined): string {
    return this.productService.getImageUrl(url);
  }
}
