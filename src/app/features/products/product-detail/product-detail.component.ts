import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, ProductImage } from '../../../shared/models/product';
import { ReviewWidgetComponent } from '../../../shared/components/review-widget/review-widget.component';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, TranslateModule, ReviewWidgetComponent],
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

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.productService.getProductById(id).subscribe({
                next: (data) => {
                    this.product = data;
                    this.activeImageIndex = data.images?.findIndex(i => i.isPrimary) ?? 0;
                    if (this.activeImageIndex < 0) this.activeImageIndex = 0;
                    this.isLoading = false;
                },
                error: () => {
                    this.errorMessage = 'error';
                    this.isLoading = false;
                }
            });
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
