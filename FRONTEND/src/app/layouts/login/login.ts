import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { AuthService } from '../../services/auth/auth.service';
import { RegistroUsuarioService } from '../../services/usuarios/registro/registro-usuario.service';
import { FormClientes } from "../../components/registro/form-clientes/form-clientes";
import { FormTalleres } from "../../components/registro/form-talleres/form-talleres";

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

  constructor(private fb: FormBuilder, private authService: AuthService, private registroUsuario: RegistroUsuarioService, private router: Router) {

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
        // Aquí podrías navegar: this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        // Manejo simple de error (credenciales/servidor/CORS/etc.)
        console.error('Error de login', e);
        alert("usuario o contraseña incorrectos")
      }
    });
  }
}


