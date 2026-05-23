import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterOutlet, TranslateModule],
    templateUrl: './public-layout.component.html',
    styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {
    authService = inject(AuthService);
    themeService = inject(ThemeService);

    get dashboardRoute(): string {
        const role = this.authService.getRole();
        if (role === 'INDIVIDUAL') return '/individual/products';
        if (role === 'CORPORATE') return '/corporate/dashboard';
        if (role === 'ADMIN') return '/admin/dashboard';
        return '/login';
    }
}
