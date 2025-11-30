import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
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
  tipoRegistro: 'cliente'| 'taller'| null = null;

  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {

    // CAMPOS FORM LOGIN
    this.loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    
    });
  }
  

  showLogin() {}
  showRegister() {
    this.router.navigate(['/registrarse']);
  }
 
  token(): void {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;

    // Llama al servicio con los valores (aseguramos no-nulos con !)
    this.authService.login(username!, password!).subscribe({
      next: (tokens) => {
        // Éxito: ya guardaste tokens en el service (tap) o acá si preferís
        console.log('Login exitoso', tokens);
      },
      error: (e) => {
        // Manejo simple de error (credenciales/servidor/CORS/etc.)
        console.error('Error de login', e);
        alert("usuario o contraseña incorrectos")
      }
    });
  }
}


