import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-register-component',
  imports: [ 
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './register-component.html',
  styleUrls: ['./register-component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'register-page-host'
  }
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);


  hidePassword = signal(true);
  isSubmitting = signal(false);

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  handleRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/Dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error('Registration failed:', err);
      },
      complete: () => this.isSubmitting.set(false)
    });
  }
  goToLogin() {
    this.router.navigate(['/Login']);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }
}
