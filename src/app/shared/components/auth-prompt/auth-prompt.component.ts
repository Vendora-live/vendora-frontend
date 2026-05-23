import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-auth-prompt',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './auth-prompt.component.html',
    styleUrl: './auth-prompt.component.css'
})
export class AuthPromptComponent {
    @Input() show = false;
    @Output() close = new EventEmitter<void>();

    private router = inject(Router);

    goToLogin(): void {
        this.close.emit();
        this.router.navigate(['/login']);
    }

    goToRegister(): void {
        this.close.emit();
        this.router.navigate(['/register']);
    }
}
