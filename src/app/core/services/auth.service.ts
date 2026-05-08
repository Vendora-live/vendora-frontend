import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserMeta } from '../../shared/models/auth-response';
import { tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import { ThemeService } from './theme.service';
import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private http = inject(HttpClient);
    private router = inject(Router);
    private themeService = inject(ThemeService);
    private languageService = inject(LanguageService);

    private readonly API_URL = environment.baseUrl + '/auth';

    login(email: string, password: string) {
        return this.http.post<ApiResponse<void>>(
            `${this.API_URL}/login`,
            { email, password },
            { withCredentials: true }
        ).pipe(
            map(response => {
                if (response.status === 200) return;
                throw new Error(response.errorMessage || response.message || 'Login failed');
            }),
            tap(() => this.syncPreferencesFromCookie())
        );
    }

    register(email: string, password: string, age?: number | null, city?: string | null, state?: string | null, country?: string | null) {
        return this.http.post<ApiResponse<string>>(
            `${this.API_URL}/register`,
            { email, password, age, city, state, country },
            { withCredentials: true }
        ).pipe(
            map(response => {
                if (response.status === 200 && response.payload) return response.payload;
                throw new Error(response.errorMessage || response.message || 'An error occurred');
            })
        );
    }

    verifyEmail(token: string) {
        return this.http.get<ApiResponse<string>>(`${this.API_URL}/verify-email?token=${token}`)
            .pipe(map(response => {
                if (response.status === 200 && response.payload) return response.payload;
                throw new Error(response.errorMessage || response.message || 'An error occurred during verification');
            }));
    }

    forgotPassword(email: string) {
        return this.http.post<ApiResponse<string>>(`${this.API_URL}/forgot-password`, { email })
            .pipe(map(response => {
                if (response.status === 200 && response.payload) return response.payload;
                throw new Error(response.errorMessage || response.message || 'An error occurred');
            }));
    }

    resetPassword(token: string, newPassword: string) {
        return this.http.post<ApiResponse<string>>(`${this.API_URL}/reset-password`, { token, newPassword })
            .pipe(map(response => {
                if (response.status === 200 && response.payload) return response.payload;
                throw new Error(response.errorMessage || response.message || 'An error occurred');
            }));
    }

    logout() {
        return this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true })
            .pipe(tap(() => this.preservePrefsAndClearSession()));
    }

    refreshToken() {
        return this.http.post<ApiResponse<void>>(
            `${this.API_URL}/refresh`,
            {},
            { withCredentials: true }
        ).pipe(
            map(response => {
                if (response.status === 200) return;
                throw new Error(response.errorMessage || response.message || 'Token refresh failed');
            })
        );
    }

    isAuthenticated(): boolean {
        return !!(this.parseUserMeta()?.userId);
    }

    getRole(): string | null {
        return this.parseUserMeta()?.role ?? null;
    }

    getCurrentUserEmail(): string | null {
        return this.parseUserMeta()?.email ?? null;
    }

    getStoreId(): number | null {
        return this.parseUserMeta()?.storeId ?? null;
    }

    /** Called after OAuth2 callback — signal that login succeeded. */
    applyOAuth2Login() {
        this.syncPreferencesFromCookie();
    }

    clearStorage() {
        this.preservePrefsAndClearSession();
    }

    // ── Internals ──────────────────────────────────────────────────────────────

    private syncPreferencesFromCookie() {
        const meta = this.parseUserMeta();
        if (!meta) return;
        this.themeService.syncFromUserMeta(meta);
        this.languageService.syncFromUserMeta(meta);
    }

    /**
     * On logout: backend expires all cookies, but we re-write user_meta
     * with only theme/language so preferences survive until next login.
     */
    private preservePrefsAndClearSession() {
        const meta = this.parseUserMeta();
        if (meta?.theme || meta?.language) {
            const prefs = JSON.stringify({ theme: meta.theme, language: meta.language });
            const encoded = btoa(prefs);
            document.cookie = `user_meta=${encoded}; path=/; SameSite=Strict; max-age=${30 * 24 * 3600}`;
        }
    }

    parseUserMeta(): UserMeta | null {
        const raw = this.getCookieValue('user_meta');
        if (!raw) return null;
        try {
            return JSON.parse(atob(raw)) as UserMeta;
        } catch {
            return null;
        }
    }

    private getCookieValue(name: string): string | null {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? match[1] : null;
    }
}
