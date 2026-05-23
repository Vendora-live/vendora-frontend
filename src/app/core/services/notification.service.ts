import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SseNotification {
  type: string;
  message: string;
}

const SSE_EVENTS = ['ORDER_STATUS_UPDATED', 'NEW_ORDER', 'REFUND_APPROVED', 'REFUND_REJECTED'];

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private eventSource: EventSource | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly notificationSubject = new Subject<SseNotification>();
  readonly notifications$ = this.notificationSubject.asObservable();

  connect() {
    if (this.eventSource) return;
    const url = `${environment.baseUrl}/notifications/stream`;
    this.eventSource = new EventSource(url, { withCredentials: true });

    const handle = (e: MessageEvent) => {
      try {
        this.notificationSubject.next(JSON.parse(e.data) as SseNotification);
      } catch { /* ignore */ }
    };

    SSE_EVENTS.forEach(type => this.eventSource!.addEventListener(type, handle as EventListener));

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      this.retryTimer = setTimeout(() => this.connect(), 5000);
    };
  }

  disconnect() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.eventSource?.close();
    this.eventSource = null;
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
