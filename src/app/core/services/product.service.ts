import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product, ProductImage, ProductRequest } from '../../shared/models/product';
import { ApiResponse } from '../../shared/models/api-response';
import { environment } from '../../../environments/environment';
import { RestPageableEntity, RestPageableRequest, buildPageParams } from '../../shared/models/pageable';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private readonly apiUrl = `${environment.baseUrl}/products`;

    constructor(private http: HttpClient) { }

    getProducts(request?: RestPageableRequest): Observable<RestPageableEntity<Product>> {
        const params = buildPageParams(request);
        return this.http.get<ApiResponse<RestPageableEntity<Product>>>(this.apiUrl, { params }).pipe(
            map(res => res.payload as RestPageableEntity<Product>)
        );
    }

    getProductById(id: number): Observable<Product> {
        return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
            map(res => res.payload as Product)
        );
    }

    getProductsByStoreId(storeId: number, request?: RestPageableRequest): Observable<RestPageableEntity<Product>> {
        const params = buildPageParams(request);
        return this.http.get<ApiResponse<RestPageableEntity<Product>>>(`${this.apiUrl}/store/${storeId}`, { params }).pipe(
            map(res => res.payload as RestPageableEntity<Product>)
        );
    }

    createProduct(product: ProductRequest): Observable<Product> {
        return this.http.post<ApiResponse<Product>>(this.apiUrl, product).pipe(
            map(res => res.payload as Product)
        );
    }

    updateProduct(id: number, product: ProductRequest): Observable<Product> {
        return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${id}`, product).pipe(
            map(res => res.payload as Product)
        );
    }

    deleteProduct(id: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
            map(() => void 0)
        );
    }

    uploadProductImages(productId: number, files: File[]): Observable<ProductImage[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return this.http.post<ApiResponse<ProductImage[]>>(`${this.apiUrl}/${productId}/images`, formData).pipe(
            map(res => res.payload as ProductImage[])
        );
    }

    deleteProductImage(productId: number, imageId: number): Observable<void> {
        return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${productId}/images/${imageId}`).pipe(
            map(() => void 0)
        );
    }

    setPrimaryImage(productId: number, imageId: number): Observable<Product> {
        return this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/${productId}/images/${imageId}/primary`, {}).pipe(
            map(res => res.payload as Product)
        );
    }

    getImageUrl(url: string | null | undefined): string {
        if (!url) return 'assets/placeholder-product.svg';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/uploads/')) return `${environment.serverUrl}${url}`;
        if (url.startsWith('assets/')) return url;
        if (!url.includes('/')) return `${environment.serverUrl}/uploads/${url}`;
        return `assets/images/${url}`;
    }

    getPrimaryImageUrl(product: Product): string {
        const primary = product.images?.find(i => i.isPrimary)?.imageUrl
            ?? product.images?.[0]?.imageUrl
            ?? product.primaryImageUrl
            ?? null;
        return this.getImageUrl(primary);
    }
}
