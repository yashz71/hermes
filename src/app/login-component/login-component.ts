import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth-service';
@Component({
  selector: 'app-login-component',
  imports: [ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'login-page-host'
  }
})
export class LoginComponent {
  private  router= inject(Router);

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  // State management using Signals
  hidePassword = signal(true);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  }); 

  togglePasswordVisibility(): void {
    this.hidePassword.update(prev => !prev);
  }
  goToRegister() {
    this.router.navigate(['/Register']);
  }


  handleLogin(): void {
    if (this.loginForm.valid) {
      console.log("start to login");
      const credentials = this.loginForm.getRawValue();
      this.authService.login(credentials).subscribe({
        next: () => {
          this.router.navigate(['/Dashboard']);
        },
        error: (err) => {
          console.error('Registration failed:', err);
        },
      });
    }
  }
}
