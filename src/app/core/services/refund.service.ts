import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response';
import { DtoRefundRequest, DtoRefundResponse, DtoRejectRefundRequest } from '../../shared/models/refund';
import { environment } from '../../../environments/environment';
import { RestPageableEntity, RestPageableRequest, buildPageParams } from '../../shared/models/pageable';

@Injectable({
  providedIn: 'root'
})
export class RefundService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseUrl}/refunds`;

  create(request: DtoRefundRequest): Observable<DtoRefundResponse> {
    return this.http.post<ApiResponse<DtoRefundResponse>>(this.apiUrl, request)
      .pipe(map(res => res.payload as DtoRefundResponse));
  }

  getMyRequests(request?: RestPageableRequest): Observable<RestPageableEntity<DtoRefundResponse>> {
    const params = buildPageParams(request);
    return this.http.get<ApiResponse<RestPageableEntity<DtoRefundResponse>>>(`${this.apiUrl}/my-requests`, { params })
      .pipe(map(res => res.payload as RestPageableEntity<DtoRefundResponse>));
  }

  getStoreRequests(storeId: number, request?: RestPageableRequest): Observable<RestPageableEntity<DtoRefundResponse>> {
    const params = buildPageParams(request);
    return this.http.get<ApiResponse<RestPageableEntity<DtoRefundResponse>>>(`${this.apiUrl}/store/${storeId}`, { params })
      .pipe(map(res => res.payload as RestPageableEntity<DtoRefundResponse>));
  }

  approve(refundId: number, storeId: number): Observable<DtoRefundResponse> {
    return this.http.patch<ApiResponse<DtoRefundResponse>>(`${this.apiUrl}/${refundId}/approve?storeId=${storeId}`, {})
      .pipe(map(res => res.payload as DtoRefundResponse));
  }

  reject(refundId: number, storeId: number, request: DtoRejectRefundRequest): Observable<DtoRefundResponse> {
    return this.http.patch<ApiResponse<DtoRefundResponse>>(`${this.apiUrl}/${refundId}/reject?storeId=${storeId}`, request)
      .pipe(map(res => res.payload as DtoRefundResponse));
  }

  getAllRequests(request?: RestPageableRequest): Observable<RestPageableEntity<DtoRefundResponse>> {
    const params = buildPageParams(request);
    return this.http.get<ApiResponse<RestPageableEntity<DtoRefundResponse>>>(`${this.apiUrl}/admin/all`, { params })
      .pipe(map(res => res.payload as RestPageableEntity<DtoRefundResponse>));
  }
}
