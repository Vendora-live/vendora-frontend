import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, ProductImage } from '../../../shared/models/product';
import { ReviewWidgetComponent } from '../../../shared/components/review-widget/review-widget.component';

const RV_KEY = 'vendora_recently_viewed';
const RV_MAX = 10;

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, TranslateModule, ReviewWidgetComponent, RouterLink],
    templateUrl: './product-detail.component.html',
    styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private location = inject(Location);
    private productService = inject(ProductService);
    private cartService = inject(CartService);
    private toastService = inject(ToastService);

    product: Product | null = null;
    isLoading = true;
    errorMessage = '';
    quantity = 1;
    activeImageIndex = 0;
    recentlyViewed: Product[] = [];

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.productService.getProductById(id).subscribe({
                next: (data) => {
                    this.product = data;
                    this.activeImageIndex = data.images?.findIndex(i => i.isPrimary) ?? 0;
                    if (this.activeImageIndex < 0) this.activeImageIndex = 0;
                    this.saveToRecentlyViewed(data);
                    this.recentlyViewed = this.getRecentlyViewed(data.id!);
                    this.isLoading = false;
                },
                error: () => {
                    this.errorMessage = 'error';
                    this.isLoading = false;
                }
            });
        }
    }

    private saveToRecentlyViewed(product: Product): void {
        try {
            const stored: Product[] = JSON.parse(localStorage.getItem(RV_KEY) ?? '[]');
            const filtered = stored.filter(p => p.id !== product.id);
            filtered.unshift(product);
            localStorage.setItem(RV_KEY, JSON.stringify(filtered.slice(0, RV_MAX)));
        } catch {
            // localStorage unavailable (private browsing, storage full, etc.)
        }
    }

    private getRecentlyViewed(excludeId: number): Product[] {
        try {
            const stored: Product[] = JSON.parse(localStorage.getItem(RV_KEY) ?? '[]');
            return stored.filter(p => p.id !== excludeId).slice(0, 6);
        } catch {
            return [];
        }
    }

    get activeImage(): ProductImage | null {
        return this.product?.images?.[this.activeImageIndex] ?? null;
    }

    get activeImageUrl(): string {
        const img = this.activeImage;
        return this.productService.getImageUrl(img?.imageUrl ?? this.product?.primaryImageUrl);
    }

    setActiveImage(index: number): void {
        this.activeImageIndex = index;
    }

    incrementQty(): void { this.quantity++; }
    decrementQty(): void { if (this.quantity > 1) this.quantity--; }

    addToCart(productId: number | undefined): void {
        if (!productId) return;
        this.cartService.addItemToCart({ productId, quantity: this.quantity }).subscribe({
            next: () => this.toastService.showSuccess(`🛒 ${this.quantity}x ${this.product?.name} added to cart!`)
        });
    }

    getImageUrl(url: string | null | undefined): string {
        return this.productService.getImageUrl(url);
    }

    goBack(): void { this.location.back(); }
}
