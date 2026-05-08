import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/models/product';

@Component({
    selector: 'app-product-list',
    imports: [CommonModule, TranslateModule],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
    private productService = inject(ProductService);
    private router = inject(Router);

    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: string[] = [];
    selectedCategory = 'All';
    isLoading = true;
    errorMessage = '';

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.isLoading = true;
        this.errorMessage = '';
        this.productService.getProducts().subscribe({
            next: (res) => this.handleProductsLoaded(res.content ?? []),
            error: () => {
                this.errorMessage = 'error';
                this.isLoading = false;
            }
        });
    }

    private handleProductsLoaded(data: Product[]): void {
        this.products = data;
        this.filteredProducts = data;
        this.categories = ['All', ...new Set(data.map(p => p.categoryName).filter(Boolean))];
        this.isLoading = false;
    }

    filterByCategory(category: string): void {
        this.selectedCategory = category;
        this.filteredProducts = category === 'All'
            ? this.products
            : this.products.filter(p => p.categoryName === category);
    }

    viewProduct(id: number): void {
        this.router.navigate(['/products', id]);
    }

    getImageUrl(product: Product): string {
        return this.productService.getPrimaryImageUrl(product);
    }
}
