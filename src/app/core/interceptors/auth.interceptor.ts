import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private isRefreshing = false;
    private refreshDone$ = new BehaviorSubject<boolean | null>(null);

    private injector = inject(Injector);
    private router = inject(Router);

    private get authService(): AuthService {
        return this.injector.get(AuthService);
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Attach withCredentials to every request so cookies are sent cross-origin
        const credReq = req.clone({ withCredentials: true });

        return next.handle(credReq).pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 401
                    && !req.url.includes('/auth/refresh')
                    && !req.url.includes('/auth/login')
                    && this.authService.isAuthenticated()) {
                    return this.handle401(credReq, next);
                }
                return throwError(() => error);
            })
        );
    }

    private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshDone$.next(null);

            return this.authService.refreshToken().pipe(
                switchMap(() => {
                    this.isRefreshing = false;
                    this.refreshDone$.next(true);
                    // Cookie is now refreshed — browser sends it automatically
                    return next.handle(req);
                }),
                catchError(error => {
                    this.isRefreshing = false;
                    this.authService.clearStorage();
                    this.router.navigate(['/login']);
                    return throwError(() => error);
                })
            );
        }

        // Queue concurrent 401s until refresh completes
        return this.refreshDone$.pipe(
            filter(done => done !== null),
            take(1),
            switchMap(() => next.handle(req))
        );
    }
}
