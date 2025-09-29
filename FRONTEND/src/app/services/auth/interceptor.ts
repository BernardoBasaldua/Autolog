// src/app/services/auth/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse} from '@angular/common/http';
import { Observable, throwError, switchMap, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;

  constructor(private auth: AuthService, private http: HttpClient) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const access = this.auth.getAccess();

    // clonamos la request y le metemos el header si hay token
    const authReq = access
      ? req.clone({ setHeaders: { Authorization: `Bearer ${access}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // si el access expiró → intentamos refrescar
        if (err.status === 401 && !this.refreshing) {
          this.refreshing = true;

          // refresh: con cookie httpOnly o desde localStorage
          const refresh = localStorage.getItem('refresh');
          if (!refresh) {
            this.auth.logout();
            return throwError(() => err);
          }

          return this.http.post<{ access: string }>(
            'http://localhost:8000/api/token/refresh/', { refresh }
          ).pipe(
            switchMap(({ access }) => {
              this.refreshing = false;
              // actualizo el access en memoria
              (this.auth as any).accessToken = access;
              // reintento la request original
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${access}` } });
              return next.handle(retried);
            }),
            catchError(e => {
              this.refreshing = false;
              this.auth.logout();
              return throwError(() => e);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }
}
