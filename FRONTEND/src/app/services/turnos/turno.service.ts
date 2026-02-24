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

  private baseUrl = 'http://localhost:8000/api';
  constructor(private http: HttpClient) {}

  getHistorialTodos(): Observable<Turno[]> {
    return this.http.get<Turno[]>(this.url);
  }
  deleteTurno(id: number) {
    return this.http.delete(`http://localhost:8000/api/clientes/orden/${id}/eliminar/`);
  }

  // ---- NUEVO: turnos por agenda ----
  getTurnosAgenda(agendaId: number) {
    return this.http.get<Turno[]>(
      `${this.baseUrl}/agendas/${agendaId}/turnos-asignados/`
    );
  }

  getTurnosAsignadosDia(agendaId: number, fecha: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(
      `${this.baseUrl}/agendas/${agendaId}/turnos-asignados/?fecha=${fecha}`
    );
  }

}


