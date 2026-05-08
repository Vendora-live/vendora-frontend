import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserPreferencesService } from './user-preferences.service';

@Injectable({ providedIn: 'root' })
export class LanguageService {

    private translateService = inject(TranslateService);
    private prefsService = inject(UserPreferencesService);

    private readonly STORAGE_KEY = 'language';

    currentLang = signal<string>(this.getStoredLanguage());

    constructor() {
        this.translateService.addLangs(['tr', 'en']);
        this.translateService.setDefaultLang('tr');
        this.translateService.use(this.currentLang());
    }

    setLanguage(lang: 'tr' | 'en') {
        localStorage.setItem(this.STORAGE_KEY, lang);
        this.currentLang.set(lang);
        this.translateService.use(lang);
        if (this.isAuthenticated()) {
            this.prefsService.update({ language: lang }).subscribe({ error: () => {} });
        }
    }

    syncFromUserMeta(meta: { language?: string }) {
        if (!meta.language) return;
        const lang = meta.language as 'tr' | 'en';
        localStorage.setItem(this.STORAGE_KEY, lang);
        this.currentLang.set(lang);
        this.translateService.use(lang);
    }

    private isAuthenticated(): boolean {
        const match = document.cookie.match(/(?:^|; )user_meta=([^;]*)/);
        if (!match) return false;
        try {
            return !!(JSON.parse(atob(match[1]))?.userId);
        } catch {
            return false;
        }
    }

    private getStoredLanguage(): string {
        return localStorage.getItem(this.STORAGE_KEY) ?? 'tr';
    }
}
