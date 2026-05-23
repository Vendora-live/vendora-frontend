import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../shared/models/api-response';
import { DtoCart } from '../../shared/models/cart';
import { DtoCouponResponse, DtoCreateCouponRequest } from '../../shared/models/coupon';
import { RestPageableEntity, RestPageableRequest, buildPageParams } from '../../shared/models/pageable';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/coupons`;

  applyCoupon(code: string): Observable<DtoCart> {
    return this.http.post<ApiResponse<DtoCart>>(`${this.apiUrl}/apply`, { code })
      .pipe(map(res => res.payload as DtoCart));
  }

  removeCoupon(): Observable<DtoCart> {
    return this.http.delete<ApiResponse<DtoCart>>(`${this.apiUrl}/remove`)
      .pipe(map(res => res.payload as DtoCart));
  }

  getMyCoupons(request?: RestPageableRequest): Observable<RestPageableEntity<DtoCouponResponse>> {
    const params = buildPageParams(request);
    return this.http.get<ApiResponse<RestPageableEntity<DtoCouponResponse>>>(`${this.apiUrl}/my-store`, { params })
      .pipe(map(res => res.payload as RestPageableEntity<DtoCouponResponse>));
  }

  createCoupon(req: DtoCreateCouponRequest): Observable<DtoCouponResponse> {
    return this.http.post<ApiResponse<DtoCouponResponse>>(this.apiUrl, req)
      .pipe(map(res => res.payload as DtoCouponResponse));
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
