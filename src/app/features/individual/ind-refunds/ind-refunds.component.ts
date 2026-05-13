import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RefundService } from '../../../core/services/refund.service';
import { ToastService } from '../../../core/services/toast.service';
import { DtoRefundResponse, RefundRequestStatus } from '../../../shared/models/refund';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ind-refunds',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './ind-refunds.component.html',
  styleUrl: './ind-refunds.component.css'
})
export class IndRefundsComponent implements OnInit {
  private refundService = inject(RefundService);
  private toastService = inject(ToastService);

  RefundRequestStatus = RefundRequestStatus;

  refunds: DtoRefundResponse[] = [];
  isLoading = true;

  pageNumber = 0;
  pageSize = 10;
  totalPages = 0;

  ngOnInit(): void {
    this.loadRefunds();
  }

  loadRefunds(): void {
    this.isLoading = true;
    this.refundService.getMyRequests({ pageNumber: this.pageNumber, pageSize: this.pageSize }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to load refund requests.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(res => {
      this.refunds = res?.content || [];
      this.totalPages = Math.ceil((res?.totalElement || 0) / this.pageSize);
      this.isLoading = false;
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
