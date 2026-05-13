import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../core/services/store.service';
import { RefundService } from '../../../core/services/refund.service';
import { ToastService } from '../../../core/services/toast.service';
import { DtoRefundResponse, RefundRequestStatus } from '../../../shared/models/refund';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-corp-refunds',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './corp-refunds.component.html',
  styleUrl: './corp-refunds.component.css'
})
export class CorpRefundsComponent implements OnInit {
  private storeService = inject(StoreService);
  private refundService = inject(RefundService);
  private toastService = inject(ToastService);

  RefundRequestStatus = RefundRequestStatus;

  selectedStoreId: number | null = null;
  refunds: DtoRefundResponse[] = [];
  isLoading = false;

  pageNumber = 0;
  pageSize = 20;
  totalPages = 0;

  // Reject modal
  showRejectModal = false;
  rejectingRefundId: number | null = null;
  rejectionReason = '';
  submittingReject = false;

  // Approve state
  approvingId: number | null = null;

  ngOnInit(): void {
    this.storeService.getMyStores({ pageNumber: 0, pageSize: 10 }).subscribe({
      next: (res) => {
        const stores = res?.content || [];
        if (stores.length > 0 && stores[0].id) {
          this.selectedStoreId = stores[0].id;
          this.loadRefunds();
        }
      }
    });
  }

  loadRefunds(): void {
    if (!this.selectedStoreId) return;
    this.isLoading = true;
    this.refundService.getStoreRequests(this.selectedStoreId, { pageNumber: this.pageNumber, pageSize: this.pageSize }).pipe(
      catchError(err => {
        this.toastService.showError('Failed to load refund requests. ' + (err.error?.exception?.message || ''));
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(res => {
      this.refunds = res?.content || [];
      this.totalPages = Math.ceil((res?.totalElement || 0) / this.pageSize);
      this.isLoading = false;
    });
  }

  approve(refundId: number): void {
    if (!this.selectedStoreId) return;
    this.approvingId = refundId;
    this.refundService.approve(refundId, this.selectedStoreId).pipe(
      catchError(err => {
        this.toastService.showError('Failed to approve refund. ' + (err.error?.exception?.message || ''));
        this.approvingId = null;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const idx = this.refunds.findIndex(r => r.id === refundId);
        if (idx !== -1) this.refunds[idx] = res;
        this.toastService.showSuccess('Refund approved successfully.');
      }
      this.approvingId = null;
    });
  }

  openRejectModal(refundId: number): void {
    this.rejectingRefundId = refundId;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectingRefundId = null;
    this.rejectionReason = '';
  }

  submitReject(): void {
    if (!this.rejectingRefundId || !this.selectedStoreId || !this.rejectionReason.trim()) return;
    this.submittingReject = true;
    this.refundService.reject(this.rejectingRefundId, this.selectedStoreId, { rejectionReason: this.rejectionReason }).pipe(
      catchError(err => {
        this.toastService.showError('Failed to reject refund. ' + (err.error?.exception?.message || ''));
        this.submittingReject = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const idx = this.refunds.findIndex(r => r.id === this.rejectingRefundId);
        if (idx !== -1) this.refunds[idx] = res;
        this.toastService.showSuccess('Refund request rejected.');
        this.closeRejectModal();
      }
      this.submittingReject = false;
    });
  }

  prevPage(): void {
    if (this.pageNumber > 0) { this.pageNumber--; this.loadRefunds(); }
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages - 1) { this.pageNumber++; this.loadRefunds(); }
  }

  goToPage(pageStr: string): void {
    const page = parseInt(pageStr, 10);
    if (!isNaN(page) && page > 0 && page <= this.totalPages) {
      this.pageNumber = page - 1;
      this.loadRefunds();
    }
  }

  getStatusClass(status: RefundRequestStatus): string {
    switch (status) {
      case RefundRequestStatus.PENDING:  return 'status-pending';
      case RefundRequestStatus.APPROVED: return 'status-approved';
      case RefundRequestStatus.REFUNDED: return 'status-delivered';
      case RefundRequestStatus.REJECTED: return 'status-cancelled';
      case RefundRequestStatus.FAILED:   return 'status-cancelled';
      default: return '';
    }
  }
}
