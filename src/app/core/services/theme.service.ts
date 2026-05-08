import { Injectable, signal, effect, inject } from '@angular/core';
import { UserPreferencesService } from './user-preferences.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {

    private prefsService = inject(UserPreferencesService);

    isDark = signal<boolean>(this.loadPreference());

    constructor() {
        this.applyTheme(this.isDark());

        effect(() => {
            const dark = this.isDark();
            this.applyTheme(dark);
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        });
    }

    toggle() {
        const next = !this.isDark();
        this.isDark.set(next);
        this.prefsService.update({ theme: next ? 'dark' : 'light' }).subscribe();
    }

    /** Called on login — reads user_meta cookie and syncs theme to localStorage. */
    syncFromUserMeta(meta: { theme?: string }) {
        if (!meta.theme) return;
        localStorage.setItem('theme', meta.theme);
        this.isDark.set(meta.theme === 'dark');
    }

    private applyTheme(dark: boolean) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }

    private loadPreference(): boolean {
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
}
