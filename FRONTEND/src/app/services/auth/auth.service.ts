// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';

type UserRole = 'cliente' | 'tecnico' | 'admin';
interface TokenPair { access: string; refresh: string; }
interface AccessPayload {
  role: UserRole;
  exp: number; iat: number; user_id: number;
  username?: string; email?: string;
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  private accessToken: string | null = null;   // access en memoria
  private role: UserRole | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<TokenPair> {
    const body = { username, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<TokenPair>(`${this.apiUrl}/token/`, body, { headers }).pipe(
      tap(tokens => {
        this.accessToken = tokens.access;
        // localStorage.setItem('access', tokens.access);
        localStorage.setItem('refresh', tokens.refresh);
        const payload = JSON.parse(atob(tokens.access.split('.')[1]));
        this.role = payload.role
        this.redirectByRole(this.role);
        console.log('ROL:', payload.role);
      }),
      
      // map(() => void 0) // <-- transforma Observable<TokenPair> en Observable<void>
    );
  }

  getAccess()  { return this.accessToken; }
  getRefresh() { return localStorage.getItem('refresh'); }
  logout()     { 
    this.accessToken = null; 
    this.role = null;
    localStorage.removeItem('refresh'); 
    this.router.navigate(['/login']);
  }
  // Desde aca direccionamos segun tipo de rol
  redirectByRole(role?: UserRole | null) {
    const r = role ?? this.role;
    if (r === 'cliente')      this.router.navigate(['/cliente']);
    else if (r === 'tecnico') this.router.navigate(['taller/ordenes']);
    else                      this.router.navigate(['/admin']);
  }

  getRole(){
    return this.role
  }

  // LLAMADA AL BACK CON EL TOKEN DE GOOGLE
  loginWithGoogle(idToken: string): Observable<TokenPair> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<TokenPair>(`${this.apiUrl}/auth/google/`, { id_token: idToken }, { headers }).pipe(
      tap(tokens => {
        this.accessToken = tokens.access;
        localStorage.setItem('refresh', tokens.refresh);

        const payload: AccessPayload = JSON.parse(atob(tokens.access.split('.')[1]));
        this.role = payload.role;

        this.redirectByRole(this.role);
        console.log('ROL (Google):', payload.role);
      })
    );
  }
}
