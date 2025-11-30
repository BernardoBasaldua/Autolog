import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Taller } from '../../models/talleres/taller.model';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TalleresService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  //Lista de talleres en memoria (signal)
  readonly listaTalleres = signal<Taller[]>([]);

  readonly tallerActual = signal<Taller | null>(null);

  constructor(private http: HttpClient) {}

  // Trae los talleres del backend y los guarda en el signal
  getTalleres(): Observable<Taller[]> {
    const url = `${this.apiUrl}/talleres`;
    return this.http.get<Taller[]>(url).pipe(
      tap((talleres) => {
        this.listaTalleres.set(talleres);
      })
    );
  }

  // detalle de un taller por id
  getTallerById(id: number): Observable<Taller> {
    const url = `${this.apiUrl}/talleres/${id}/`;
    return this.http.get<Taller>(url).pipe(
      tap((taller) => this.tallerActual.set(taller))
    );
  }


}
