import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-corporate-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslateModule],
  templateUrl: './corporate-layout.component.html',
  styleUrl: './corporate-layout.component.css'
})
export class CorporateLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);
  langService = inject(LanguageService);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  corp_email: String | null = this.authService.getCurrentUserEmail();
  corp_email_parsed = this.corp_email?.split('@')[0];

  toastMessage: ToastMessage | null = null;
  private toastTimeout: any;

  sidebarOpen = signal(false);

  ngOnInit() {
    this.toastService.toast$.subscribe(msg => {
      this.toastMessage = msg;
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => { this.toastMessage = null; }, 3000);
    });

    this.notificationService.connect();
    this.notificationService.notifications$.subscribe(n => {
      const key = 'NOTIFICATIONS.' + n.type;
      const msg = this.translate.instant(key);
      this.toastService.showInfo(msg !== key ? msg : n.message);
    });
  }

  ngOnDestroy() {
    this.notificationService.disconnect();
  }

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
