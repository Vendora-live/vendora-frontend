import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/models/product';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthPromptComponent } from '../../../shared/components/auth-prompt/auth-prompt.component';

@Component({
  selector: 'app-ind-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, AuthPromptComponent],
  templateUrl: './ind-products.component.html',
  styleUrl: './ind-products.component.css'
})
export class IndProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private breakpointObserver = inject(BreakpointObserver);

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;

  isAuthenticated = this.authService.isAuthenticated();
  isIndividual = this.authService.getRole() === 'INDIVIDUAL';
  showAuthPrompt = false;

  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  isLoadingMore = false;
  errorMessage = '';

  isMobile = false;
  hasMore = true;

  // Pagination
  pageNumber = 0;
  pageSize = 24;
  totalPages = 0;

  // Filter & Sort State
  searchTerm = '';
  selectedCategory = 'ALL';
  sortOption = 'DEFAULT';
  categories: string[] = [];

  private scrollObserver: IntersectionObserver | null = null;
  private breakpointSub!: Subscription;

  ngOnInit(): void {
    this.breakpointSub = this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
    this.fetchProducts();
  }

  ngAfterViewInit(): void {
    this.setupScrollObserver();
  }

  ngOnDestroy(): void {
    this.scrollObserver?.disconnect();
    this.breakpointSub?.unsubscribe();
  }

  private setupScrollObserver(): void {
    if (!this.scrollSentinel) return;
    this.scrollObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && this.isMobile && this.hasMore && !this.isLoading && !this.isLoadingMore) {
        this.loadNextPage();
      }
    }, { threshold: 0.1 });
    this.scrollObserver.observe(this.scrollSentinel.nativeElement);
  }

  private loadNextPage(): void {
    if (this.pageNumber >= this.totalPages - 1) {
      this.hasMore = false;
      return;
    }
    this.pageNumber++;
    this.isLoadingMore = true;
    this.productService.getProducts({ pageNumber: this.pageNumber, pageSize: this.pageSize }).subscribe({
      next: (res) => {
        const raw = res?.content || [];
        this.products = [...this.products, ...raw];
        this.totalPages = Math.ceil((res?.totalElement || 0) / this.pageSize);
        this.hasMore = this.pageNumber < this.totalPages - 1;
        this.applyFilters();
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }

  fetchProducts(): void {
    this.isLoading = true;
    this.productService.getProducts({ pageNumber: this.pageNumber, pageSize: this.pageSize }).subscribe({
      next: (res) => {
        const raw = res?.content || [];
        for (let i = raw.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [raw[i], raw[j]] = [raw[j], raw[i]];
        }
        this.products = raw;
        this.totalPages = Math.ceil((res?.totalElement || 0) / this.pageSize);
        this.hasMore = this.pageNumber < this.totalPages - 1;
        if (this.pageNumber === 0) {
          this.extractCategories();
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.errorMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private resetAndReload(): void {
    this.pageNumber = 0;
    this.products = [];
    this.hasMore = true;
    this.fetchProducts();
  }

  prevPage(): void {
    if (this.pageNumber > 0) {
      this.pageNumber--;
      this.fetchProducts();
    }
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages - 1) {
      this.pageNumber++;
      this.fetchProducts();
    }
  }

  extractCategories(): void {
    const cats = new Set(this.products.map(p => p.categoryName).filter(c => !!c));
    this.categories = Array.from(cats) as string[];
  }

  applyFilters(): void {
    let result = [...this.products];

    // Search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    // Category
    if (this.selectedCategory !== 'ALL') {
      result = result.filter(p => p.categoryName === this.selectedCategory);
    }

    // Sort
    switch (this.sortOption) {
      case 'PRICE_ASC':
        result.sort((a, b) => a.unitPrice - b.unitPrice);
        break;
      case 'PRICE_DESC':
        result.sort((a, b) => b.unitPrice - a.unitPrice);
        break;
      case 'NAME_ASC':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'NAME_DESC':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    this.filteredProducts = result;
  }

  onFilterChange(): void {
    if (this.isMobile) {
      this.resetAndReload();
    } else {
      this.applyFilters();
    }
  }

  productDetailLink(productId: number): any[] {
    return this.isIndividual ? ['/individual/products', productId] : ['/products', productId];
  }

  addToCart(product: Product): void {
    if (!this.isAuthenticated) { this.showAuthPrompt = true; return; }
    if (!product.id) return;
    this.cartService.addItemToCart({ productId: product.id, quantity: 1 }).subscribe({
        next: () => {
            this.toastService.showSuccess(`🛒 ${product.name} added to cart!`);
        }
    });
  }

  toggleWishlist(product: Product): void {
    if (!this.isAuthenticated) { this.showAuthPrompt = true; return; }
    if (!product.id) return;
    if (this.wishlistService.isInWishlist(product.id)) {
      this.wishlistService.removeFromWishlistByProductId(product.id).subscribe({
        next: () => this.toastService.showSuccess(`Removed from wishlist`),
        error: () => this.toastService.showError('Failed to update wishlist')
      });
    } else {
      this.wishlistService.addToWishlist(product.id).subscribe({
        next: () => this.toastService.showSuccess(`❤️ Added to wishlist`),
        error: () => this.toastService.showError('Failed to update wishlist')
      });
    }
  }

  getImageUrl(product: Product): string {
    return this.productService.getPrimaryImageUrl(product);
  }

  goToPage(pageStr: string): void {
    const page = parseInt(pageStr, 10);
    if (!isNaN(page) && page > 0 && page <= this.totalPages) {
      this.pageNumber = page - 1;
      this.fetchProducts();
    }
  }
}
