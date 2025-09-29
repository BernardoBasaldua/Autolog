import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,                 
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './login.html',
  styleUrls: ['./login.css']        
})
export class Login{
  vistaActual: 'login' | 'register' = 'login';
  form: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  }
  

  showLogin() { 
    this.vistaActual = 'login'; console.log(this.vistaActual); 
  }
  showRegister() { 
    this.vistaActual = 'register'; console.log(this.vistaActual); 
  }

  token(): void {
    if (this.form.invalid) return;

    const { username, password } = this.form.value;

    // Llama al servicio con los valores (aseguramos no-nulos con !)
    this.authService.login(username!, password!).subscribe({
      next: () => {
        // Éxito: ya guardaste tokens en el service (tap) o acá si preferís
        console.log('Login exitoso');
        // Aquí podrías navegar: this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        // Manejo simple de error (credenciales/servidor/CORS/etc.)
        console.error('Error de login', e);
      }
    });
  }
}
