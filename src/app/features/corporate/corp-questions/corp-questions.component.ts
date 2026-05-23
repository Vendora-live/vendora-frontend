import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { StoreService } from '../../../core/services/store.service';
import { QuestionService } from '../../../core/services/question.service';
import { ToastService } from '../../../core/services/toast.service';
import { DtoProductQuestion } from '../../../shared/models/question';

@Component({
  selector: 'app-corp-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corp-questions.component.html',
  styleUrl: './corp-questions.component.css'
})
export class CorpQuestionsComponent implements OnInit {
  private storeService = inject(StoreService);
  private questionService = inject(QuestionService);
  private toastService = inject(ToastService);

  selectedStoreId: number | null = null;
  questions: DtoProductQuestion[] = [];
  isLoading = false;
  showPendingOnly = true;

  pageNumber = 0;
  pageSize = 20;
  totalPages = 0;

  answerTexts: Partial<Record<number, string>> = {};
  submittingId: number | null = null;

  ngOnInit(): void {
    this.storeService.getMyStores({ pageNumber: 0, pageSize: 10 }).subscribe({
      next: (res) => {
        const stores = res?.content ?? [];
        if (stores.length > 0 && stores[0].id) {
          this.selectedStoreId = stores[0].id;
          this.loadQuestions();
        }
      }
    });
  }

  loadQuestions(): void {
    if (!this.selectedStoreId) return;
    this.isLoading = true;
    const req = { pageNumber: this.pageNumber, pageSize: this.pageSize };
    const obs = this.showPendingOnly
      ? this.questionService.getPendingStoreQuestions(this.selectedStoreId, req)
      : this.questionService.getStoreQuestions(this.selectedStoreId, req);

    obs.pipe(catchError(() => {
      this.toastService.showError('Failed to load questions.');
      this.isLoading = false;
      return of(null);
    })).subscribe(res => {
      this.questions = res?.content ?? [];
      this.totalPages = Math.ceil((res?.totalElement ?? 0) / this.pageSize);
      this.isLoading = false;
    });
  }

  setFilter(pendingOnly: boolean): void {
    if (this.showPendingOnly === pendingOnly) return;
    this.showPendingOnly = pendingOnly;
    this.pageNumber = 0;
    this.loadQuestions();
  }

  submitAnswer(questionId: number): void {
    const text = this.answerTexts[questionId]?.trim();
    if (!text) return;
    this.submittingId = questionId;
    this.questionService.answerQuestion(questionId, text).subscribe({
      next: (updated) => {
        const idx = this.questions.findIndex(q => q.id === questionId);
        if (idx !== -1) {
          if (this.showPendingOnly) {
            this.questions.splice(idx, 1);
          } else {
            this.questions[idx] = updated;
          }
        }
        delete this.answerTexts[questionId];
        this.submittingId = null;
        this.toastService.showSuccess('Answer submitted successfully.');
      },
      error: () => {
        this.submittingId = null;
        this.toastService.showError('Failed to submit answer.');
      }
    });
  }

  prevPage(): void { if (this.pageNumber > 0) { this.pageNumber--; this.loadQuestions(); } }
  nextPage(): void { if (this.pageNumber < this.totalPages - 1) { this.pageNumber++; this.loadQuestions(); } }
}
