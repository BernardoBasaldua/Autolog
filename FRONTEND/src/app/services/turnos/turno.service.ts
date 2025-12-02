import { Injectable } from '@angular/core';
import { Turno } from '../../models/turnos/turno.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class TurnoService {
//   private turnos: Turno[] = [];
// }


import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TurnoService {

  private url = 'http://localhost:8000/api/clientes/historial_todos/';

  constructor(private http: HttpClient) {}

  getHistorialTodos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.url);
  }
}


