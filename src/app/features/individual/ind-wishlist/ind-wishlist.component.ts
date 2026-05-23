import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductService } from '../../../core/services/product.service';
import { DtoWishlistItem } from '../../../shared/models/wishlist';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-ind-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, BreadcrumbComponent],
  templateUrl: './ind-wishlist.component.html',
  styleUrl: './ind-wishlist.component.css'
})
export class IndWishlistComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private productService = inject(ProductService);
  private translate = inject(TranslateService);

  items: DtoWishlistItem[] = [];
  isLoading = true;
  removingId: number | null = null;

  pageNumber = 0;
  pageSize = 12;
  totalPages = 0;

  breadcrumbs: BreadcrumbItem[] = [];

  ngOnInit(): void {
    this.breadcrumbs = [
      { label: this.translate.instant('PRODUCTS.title'), route: ['/individual/products'] },
      { label: this.translate.instant('MY_WISHLIST.title') }
    ];
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.isLoading = true;
    this.wishlistService.getMyWishlist({ pageNumber: this.pageNumber, pageSize: this.pageSize })
      .pipe(catchError(() => {
        this.toastService.showError('Failed to load wishlist.');
        this.isLoading = false;
        return of(null);
      }))
      .subscribe(res => {
        this.items = res?.content || [];
        this.totalPages = Math.ceil((res?.totalElement || 0) / this.pageSize);
        this.isLoading = false;
      });
  }

  removeItem(item: DtoWishlistItem): void {
    if (!item.id) return;
    this.removingId = item.id;
    this.wishlistService.removeFromWishlist(item.id, item.productId)
      .subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.toastService.showSuccess(`Removed from wishlist`);
          this.removingId = null;
        },
        error: () => {
          this.toastService.showError('Failed to remove item.');
          this.removingId = null;
        }
      });
  }

  addToCart(item: DtoWishlistItem): void {
    if (!item.productId || item.stockQuantity === 0) return;
    this.cartService.addItemToCart({ productId: item.productId, quantity: 1 }).subscribe({
      next: () => this.toastService.showSuccess(`🛒 ${item.productName} added to cart!`)
    });
  }

  getImageUrl(url: string | null | undefined): string {
    return this.productService.getImageUrl(url);
  }

  prevPage(): void {
    if (this.pageNumber > 0) { this.pageNumber--; this.loadWishlist(); }
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages - 1) { this.pageNumber++; this.loadWishlist(); }
  }
}
