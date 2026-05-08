import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {

    private http = inject(HttpClient);
    private readonly API_URL = `${environment.baseUrl}/users/me/preferences`;

    update(prefs: { theme?: string; language?: string }) {
        return this.http.patch<void>(this.API_URL, prefs, { withCredentials: true });
    }
}
