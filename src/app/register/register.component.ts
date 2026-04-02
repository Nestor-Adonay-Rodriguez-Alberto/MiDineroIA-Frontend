import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  showPassword = signal(false);
  showConfirm = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        terms: [false, Validators.requiredTrue],
      },
      { validators: passwordMatch }
    );
  }

  togglePassword() { this.showPassword.update((v) => !v); }
  toggleConfirm()  { this.showConfirm.update((v) => !v);  }

  onSubmit() {
    this.form.markAllAsTouched();
    
    if (this.form.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const { nombre, apellido, email, password } = this.form.value;
      const name = `${nombre} ${apellido}`.trim();

      this.authService.register({ name, email, password }).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (error.status === 409) {
            this.errorMessage.set('Este email ya está registrado');
          } else if (error.status === 0) {
            this.errorMessage.set('Error de conexión, intenta de nuevo');
          } else {
            this.errorMessage.set('Algo salió mal, intenta de nuevo');
          }
        }
      });
    }
  }
}
