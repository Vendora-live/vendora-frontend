import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { DtoOrder, OrderStatus } from '../../../shared/models/order';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ind-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './ind-history.component.html',
  styleUrl: './ind-history.component.css'
})
export class IndHistoryComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  allOrders: DtoOrder[] = [];
  filteredOrders: DtoOrder[] = [];
  isLoading = true;

  // Filters
  statusFilter: string = 'ALL';
  searchTerm = '';

  // Stats
  totalSpent = 0;
  deliveredCount = 0;
  cancelledCount = 0;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getMyOrders({ pageNumber: 0, pageSize: 1000 }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to load order history.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe(res => {
      const orders = res?.content || [];
      // Show all paid orders (PAID and above) — PENDING means not yet paid so exclude it
      this.allOrders = orders.filter(o => o.status !== OrderStatus.PENDING);
      this.computeStats();
      this.applyFilters();
      this.isLoading = false;
    });
  }

  computeStats(): void {
    this.deliveredCount = this.allOrders.filter(o => o.status === OrderStatus.DELIVERED).length;
    this.cancelledCount = this.allOrders.filter(o => o.status === OrderStatus.CANCELLED).length;
    this.totalSpent = this.allOrders
      .filter(o => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.grandTotal, 0);
  }

  applyFilters(): void {
    let result = [...this.allOrders];

    if (this.statusFilter === 'IN_PROGRESS') {
      const inProgress: OrderStatus[] = [
        OrderStatus.PAID, OrderStatus.PARTIALLY_SHIPPED,
        OrderStatus.SHIPPED, OrderStatus.PARTIALLY_DELIVERED
      ];
      result = result.filter(o => inProgress.includes(o.status));
    } else if (this.statusFilter === 'DELIVERED') {
      result = result.filter(o => o.status === OrderStatus.DELIVERED);
    } else if (this.statusFilter === 'CANCELLED') {
      result = result.filter(o => o.status === OrderStatus.CANCELLED);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(o =>
        (o.id?.toString().includes(term)) ||
        (o.storeName?.toLowerCase().includes(term)) ||
        (o.items?.some(i => i.productName?.toLowerCase().includes(term)))
      );
    }

    this.filteredOrders = result;
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PAID: return 'status-approved';
      case OrderStatus.PARTIALLY_SHIPPED: return 'status-shipped';
      case OrderStatus.SHIPPED: return 'status-shipped';
      case OrderStatus.PARTIALLY_DELIVERED: return 'status-shipped';
      case OrderStatus.DELIVERED: return 'status-delivered';
      case OrderStatus.PARTIALLY_REFUNDED: return 'status-cancelled';
      case OrderStatus.REFUNDED: return 'status-cancelled';
      case OrderStatus.CANCELLED: return 'status-cancelled';
      default: return '';
    }
  }

  getStatusIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PAID: return '✅';
      case OrderStatus.PARTIALLY_SHIPPED: return '📦';
      case OrderStatus.SHIPPED: return '🚚';
      case OrderStatus.PARTIALLY_DELIVERED: return '📬';
      case OrderStatus.DELIVERED: return '🎉';
      case OrderStatus.PARTIALLY_REFUNDED: return '↩️';
      case OrderStatus.REFUNDED: return '↩️';
      case OrderStatus.CANCELLED: return '❌';
      default: return '•';
    }
  }

  exportToCSV(): void {
    if (this.filteredOrders.length === 0) {
        this.toastService.showError('No records to export.');
        return;
    }

    const headers = ['Order ID', 'Date', 'Status', 'Total', 'Store Name'];
    const rows = this.filteredOrders.map(o => {
        const date = new Date(o.orderDate).toLocaleDateString();
        return `${o.id},"${date}","${o.status}",${o.grandTotal},"${o.storeName || ''}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'purchase_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toastService.showSuccess('Exported history to CSV successfully.');
  }
}
