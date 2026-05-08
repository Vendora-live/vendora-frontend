import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-individual-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  templateUrl: './individual-layout.component.html',
  styleUrl: './individual-layout.component.css'
})
export class IndividualLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);
  langService = inject(LanguageService);
  cartService = inject(CartService);
  private toastService = inject(ToastService);

  ind_email: String | null = this.authService.getCurrentUserEmail();
  ind_email_parsed = this.ind_email?.split('@')[0];

  toastMessage: ToastMessage | null = null;
  private toastTimeout: any;

  ngOnInit() {
    this.cartService.refreshMyCart().subscribe();

    this.toastService.toast$.subscribe(msg => {
      this.toastMessage = msg;
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.toastMessage = null;
      }, 3000);
    });
  }

  sidebarOpen = signal(false);

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }

  toggleLang() {
    this.langService.setLanguage(this.langService.currentLang() === 'tr' ? 'en' : 'tr');
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
