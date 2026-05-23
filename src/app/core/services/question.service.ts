import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { DtoProductQuestion, DtoProductQuestionRequest, DtoAnswerRequest } from '../../shared/models/question';
import { RestPageableEntity, RestPageableRequest, buildPageParams } from '../../shared/models/pageable';

@Injectable({ providedIn: 'root' })
export class QuestionService {

  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/questions`;

  askQuestion(request: DtoProductQuestionRequest): Observable<DtoProductQuestion> {
    return this.http.post<ApiResponse<DtoProductQuestion>>(this.apiUrl, request, { withCredentials: true })
      .pipe(map(res => res.payload as DtoProductQuestion));
  }

  getByProductId(productId: number, request?: RestPageableRequest): Observable<RestPageableEntity<DtoProductQuestion>> {
    const params = buildPageParams(request ?? { pageNumber: 0, pageSize: 20 });
    return this.http.get<ApiResponse<RestPageableEntity<DtoProductQuestion>>>(
      `${this.apiUrl}/product/${productId}`, { params })
      .pipe(map(res => res.payload as RestPageableEntity<DtoProductQuestion>));
  }

  answerQuestion(questionId: number, answerText: string): Observable<DtoProductQuestion> {
    return this.http.put<ApiResponse<DtoProductQuestion>>(
      `${this.apiUrl}/${questionId}/answer`, { answerText } as DtoAnswerRequest, { withCredentials: true })
      .pipe(map(res => res.payload as DtoProductQuestion));
  }

  getStoreQuestions(storeId: number, request?: RestPageableRequest): Observable<RestPageableEntity<DtoProductQuestion>> {
    const params = buildPageParams(request ?? { pageNumber: 0, pageSize: 20 });
    return this.http.get<ApiResponse<RestPageableEntity<DtoProductQuestion>>>(
      `${this.apiUrl}/store/${storeId}`, { params, withCredentials: true })
      .pipe(map(res => res.payload as RestPageableEntity<DtoProductQuestion>));
  }

  getPendingStoreQuestions(storeId: number, request?: RestPageableRequest): Observable<RestPageableEntity<DtoProductQuestion>> {
    const params = buildPageParams(request ?? { pageNumber: 0, pageSize: 20 });
    return this.http.get<ApiResponse<RestPageableEntity<DtoProductQuestion>>>(
      `${this.apiUrl}/store/${storeId}/pending`, { params, withCredentials: true })
      .pipe(map(res => res.payload as RestPageableEntity<DtoProductQuestion>));
  }
}
