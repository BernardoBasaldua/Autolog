import { Component, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { AuthService } from '../../services/auth/auth.service';

declare const google: any;

// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements AfterViewInit, OnDestroy {
  vistaActual: 'login' | 'register' = 'login';
  tipoRegistro: 'cliente' | 'taller' | null = null;

  loginForm: FormGroup;
  loginError: string | null = null;   // 👈 NUEVO

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private zone: NgZone) {

    // CAMPOS FORM LOGIN
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.loginForm.valueChanges.subscribe(() => {
      this.loginError = null;
    });
  }

  showNotice(text: string, type: NoticeType = 'error', ms = 3500) {
    this.notice = { type, text };
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => (this.notice = null), ms);
  }

  clearNotice() {
    this.notice = null;
    clearTimeout(this.noticeTimer);
  }

  showLogin() { }
  showRegister() {
    this.router.navigate(['/registrarse']);
  }

  token(): void {
    if (this.loginForm.invalid) return;

    this.loginError = null; // 👈 limpiamos error previo

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
        this.loginError = 'Usuario o contraseña incorrectos'; // 👈 seteamos mensaje
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
            this.zone.run(() => {
              console.log('OK LOGIN GOOGLE', data);
            });
          },
          error: (err) => {
            this.zone.run(() => {
              if (err.status === 409) {
                try { google?.accounts?.id?.cancel?.(); } catch { }
                // Cartel informativo
                this.showNotice(err.error?.detail ?? 'Tenés que registrarte primero', 'info', 2500);
                //this.router.navigate(['/registrarse'], { queryParams: { reason: 'google' } });
                // Navegación (con un mini delay para que el usuario alcance a leer)
                setTimeout(() => this.router.navigate(['/registrarse'], { queryParams: { reason: 'google' } }), 2500);
              } else {
                this.showNotice('Error al iniciar sesión con Google', 'error', 3500);
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
    } catch { }

    clearTimeout(this.noticeTimer);
  }
}


