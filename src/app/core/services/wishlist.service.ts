import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { DtoWishlistItem } from '../../shared/models/wishlist';
import { RestPageableEntity, RestPageableRequest, buildPageParams } from '../../shared/models/pageable';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/wishlists`;

  private productIds = new BehaviorSubject<Set<number>>(new Set());

  loadMyProductIds(): void {
    this.http.get<ApiResponse<number[]>>(`${this.apiUrl}/my-product-ids`)
      .pipe(
        map(res => res.payload ?? []),
        catchError(() => of([] as number[]))
      )
      .subscribe(ids => this.productIds.next(new Set(ids)));
  }

  isInWishlist(productId: number): boolean {
    return this.productIds.value.has(productId);
  }

  addToWishlist(productId: number): Observable<DtoWishlistItem> {
    return this.http.post<ApiResponse<DtoWishlistItem>>(this.apiUrl, { productId })
      .pipe(
        map(res => res.payload as DtoWishlistItem),
        tap(item => {
          const updated = new Set(this.productIds.value);
          updated.add(item.productId);
          this.productIds.next(updated);
        })
      );
  }

  removeFromWishlist(itemId: number, productId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${itemId}`)
      .pipe(
        map(() => void 0),
        tap(() => this.removeProductId(productId))
      );
  }

  removeFromWishlistByProductId(productId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/by-product/${productId}`)
      .pipe(
        map(() => void 0),
        tap(() => this.removeProductId(productId))
      );
  }

  getMyWishlist(request?: RestPageableRequest): Observable<RestPageableEntity<DtoWishlistItem>> {
    const params = buildPageParams(request);
    return this.http.get<ApiResponse<RestPageableEntity<DtoWishlistItem>>>(`${this.apiUrl}/my-items`, { params })
      .pipe(map(res => res.payload as RestPageableEntity<DtoWishlistItem>));
  }

  private removeProductId(productId: number): void {
    const updated = new Set(this.productIds.value);
    updated.delete(productId);
    this.productIds.next(updated);
  }
}
