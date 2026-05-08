import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-cookie-consent',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './cookie-consent.component.html',
    styleUrl: './cookie-consent.component.css'
})
export class CookieConsentComponent implements OnInit {

    visible = false;

    private authService = inject(AuthService);
    private router = inject(Router);

    ngOnInit() {
        this.evaluate();
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe(() => this.evaluate());
    }

    private evaluate() {
        if (localStorage.getItem('cookieConsent')) {
            this.visible = false;
            return;
        }

        const role = this.authService.getRole();
        if (!role) {
            this.visible = false;
            return;
        }

        if (role === 'ADMIN') {
            localStorage.setItem('cookieConsent', 'accepted');
            this.visible = false;
            return;
        }

        this.visible = true;
    }

    accept() {
        localStorage.setItem('cookieConsent', 'accepted');
        this.visible = false;
    }
}
