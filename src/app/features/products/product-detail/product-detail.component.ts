import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { QuestionService } from '../../../core/services/question.service';
import { Product, ProductImage } from '../../../shared/models/product';
import { DtoProductQuestion } from '../../../shared/models/question';
import { ReviewWidgetComponent } from '../../../shared/components/review-widget/review-widget.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { AuthPromptComponent } from '../../../shared/components/auth-prompt/auth-prompt.component';

const RV_KEY = 'vendora_recently_viewed';
const RV_MAX = 10;

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ReviewWidgetComponent, RouterLink, BreadcrumbComponent, AuthPromptComponent],
    templateUrl: './product-detail.component.html',
    styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private location = inject(Location);
    private productService = inject(ProductService);
    private cartService = inject(CartService);
    wishlistService = inject(WishlistService);
    private authService = inject(AuthService);
    private toastService = inject(ToastService);
    private translate = inject(TranslateService);

    private questionService = inject(QuestionService);

    product: Product | null = null;
    isLoading = true;
    errorMessage = '';
    quantity = 1;
    activeImageIndex = 0;
    recentlyViewed: Product[] = [];
    breadcrumbs: BreadcrumbItem[] = [];
    isAuthenticated = this.authService.isAuthenticated();
    isIndividual = this.authService.getRole() === 'INDIVIDUAL';
    showAuthPrompt = false;

    questions: DtoProductQuestion[] = [];
    newQuestionText = '';
    isSubmittingQuestion = false;

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
                    const productsRoute = this.isIndividual ? ['/individual/products'] : ['/products'];
                    this.breadcrumbs = [
                        { label: this.translate.instant('PRODUCTS.title'), route: productsRoute },
                        { label: data.name }
                    ];
                    this.isLoading = false;
                    this.loadQuestions(data.id!);
                },
                error: () => {
                    this.errorMessage = 'error';
                    this.isLoading = false;
                }
            });
        }
    }

    loadQuestions(productId: number): void {
        this.questionService.getByProductId(productId, { pageNumber: 0, pageSize: 20 })
            .pipe(catchError(() => of(null)))
            .subscribe(res => { this.questions = res?.content ?? []; });
    }

    submitQuestion(): void {
        if (!this.isAuthenticated) { this.showAuthPrompt = true; return; }
        if (!this.newQuestionText.trim() || !this.product?.id) return;
        this.isSubmittingQuestion = true;
        this.questionService.askQuestion({ productId: this.product.id, questionText: this.newQuestionText })
            .subscribe({
                next: (q) => {
                    this.questions.unshift(q);
                    this.newQuestionText = '';
                    this.isSubmittingQuestion = false;
                    this.toastService.showSuccess(this.translate.instant('QUESTIONS.submitSuccess'));
                },
                error: () => {
                    this.isSubmittingQuestion = false;
                    this.toastService.showError(this.translate.instant('QUESTIONS.submitError'));
                }
            });
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
        if (!this.isAuthenticated) { this.showAuthPrompt = true; return; }
        if (!productId) return;
        this.cartService.addItemToCart({ productId, quantity: this.quantity }).subscribe({
            next: () => this.toastService.showSuccess(`🛒 ${this.quantity}x ${this.product?.name} added to cart!`)
        });
    }

    getImageUrl(url: string | null | undefined): string {
        return this.productService.getImageUrl(url);
    }

    goBack(): void { this.location.back(); }

    productRoute(id: number): any[] {
        return this.isIndividual ? ['/individual/products', id] : ['/products', id];
    }

    toggleWishlist(): void {
        if (!this.isAuthenticated) { this.showAuthPrompt = true; return; }
        if (!this.product?.id) return;
        const productId = this.product.id;
        if (this.wishlistService.isInWishlist(productId)) {
            this.wishlistService.removeFromWishlistByProductId(productId).subscribe({
                next: () => this.toastService.showSuccess('Removed from wishlist'),
                error: () => this.toastService.showError('Failed to update wishlist')
            });
        } else {
            this.wishlistService.addToWishlist(productId).subscribe({
                next: () => this.toastService.showSuccess('❤️ Added to wishlist'),
                error: () => this.toastService.showError('Failed to update wishlist')
            });
        }
    }
}
