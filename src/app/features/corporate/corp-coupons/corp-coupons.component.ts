import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { ToastService } from '../../../core/services/toast.service';
import { DtoCouponResponse, DtoCreateCouponRequest, CouponType } from '../../../shared/models/coupon';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-corp-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './corp-coupons.component.html',
  styleUrl: './corp-coupons.component.css'
})
export class CorpCouponsComponent implements OnInit {
  private couponService = inject(CouponService);
  private toastService = inject(ToastService);

  coupons: DtoCouponResponse[] = [];
  isLoading = false;

  pageNumber = 0;
  pageSize = 12;
  totalPages = 0;

  // Create form
  showCreateForm = false;
  isSubmitting = false;
  form: DtoCreateCouponRequest = this.emptyForm();

  // Delete modal
  showDeleteModal = false;
  deletingId: number | null = null;
  isDeleting = false;

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.isLoading = true;
    this.couponService.getMyCoupons({ pageNumber: this.pageNumber, pageSize: this.pageSize }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to load coupons.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(res => {
      this.coupons = res?.content || [];
      this.totalPages = Math.ceil((res?.totalElement || 0) / this.pageSize);
      this.isLoading = false;
    });
  }

  openCreateForm(): void {
    this.form = this.emptyForm();
    this.showCreateForm = true;
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
  }

  submitCreate(): void {
    if (!this.form.code || !this.form.type || !this.form.discountValue) return;
    this.isSubmitting = true;
    this.couponService.createCoupon(this.form).pipe(
      catchError(err => {
        this.toastService.showError(err.error?.exception?.message || 'Failed to create coupon.');
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.coupons = [res, ...this.coupons];
        this.toastService.showSuccess('Coupon created successfully!');
        this.closeCreateForm();
      }
      this.isSubmitting = false;
    });
  }

  confirmDelete(id: number): void {
    this.deletingId = id;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.deletingId = null;
  }

  executeDelete(): void {
    if (!this.deletingId) return;
    this.isDeleting = true;
    this.couponService.deleteCoupon(this.deletingId).pipe(
      catchError(err => {
        this.toastService.showError(err.error?.exception?.message || 'Failed to delete coupon.');
        this.isDeleting = false;
        return of(null);
      })
    ).subscribe(() => {
      this.coupons = this.coupons.filter(c => c.id !== this.deletingId);
      this.toastService.showSuccess('Coupon deleted.');
      this.cancelDelete();
      this.isDeleting = false;
    });
  }

  prevPage(): void {
    if (this.pageNumber > 0) { this.pageNumber--; this.loadCoupons(); }
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages - 1) { this.pageNumber++; this.loadCoupons(); }
  }

  private emptyForm(): DtoCreateCouponRequest {
    return { code: '', type: 'PERCENTAGE', discountValue: 0 };
  }

  getCouponTypeLabel(type: CouponType): string {
    return type === 'PERCENTAGE' ? '%' : '₺';
  }
}
