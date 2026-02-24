import { Component, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { AuthService } from '../../services/auth/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,                 
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './login.html',
  styleUrls: ['./login.css']        
})
export class Login implements AfterViewInit, OnDestroy{
  vistaActual: 'login' | 'register' = 'login';
  tipoRegistro: 'cliente'| 'taller'| null = null;

  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private zone:NgZone) {

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

  ngAfterViewInit(): void {
    console.log('ORIGIN:', window.location.origin);
    google.accounts.id.initialize({
      client_id: '957331454319-4ik3a1gidhfhe28kbcv37ar03n5ahplu.apps.googleusercontent.com',
      callback: (response: any) => {
        const idToken = response.credential; // ESTE es el JWT (ID Token)
        console.log('Google ID Token:', idToken);

        this.authService.loginWithGoogle(idToken).subscribe({
          next: (data) => {
            this.zone.run(() => {console.log('OK LOGIN GOOGLE', data);
            });
          },
          error: (err) => {
            this.zone.run(() => {
              if (err.status === 409) {
                try { google?.accounts?.id?.cancel?.(); } catch {}
                alert(err.error?.detail ?? 'Tenés que registrarte primero');
                this.router.navigate(['/registrarse']); 
              } else {
                alert('Error al iniciar sesión con Google');
                console.error(err);
              }
            });
          }
        });
      },
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: 300 }
    );
  }

  ngOnDestroy(): void {
    try {
      google?.accounts?.id?.cancel?.();
    } catch {}
  }
}


