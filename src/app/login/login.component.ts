import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    if (this.form.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const { email, password } = this.form.value;

      this.authService.login({ email, password }).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (error.status === 401) {
            this.errorMessage.set('Email o contraseña incorrectos');
          } else if (error.status === 0) {
            this.errorMessage.set('Error de conexión, intenta de nuevo');
          } else {
            this.errorMessage.set('Algo salió mal, intenta de nuevo');
          }
        }
      });
    }
  }

  onGoogleLogin() {
    console.log('Google login');
  }
}
