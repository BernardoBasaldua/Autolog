import { Injectable, signal } from '@angular/core';
import { OrdenDeTrabajo, OrdenDeTrabajoCreatePayload } from '../../models/orden/orden.models';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private apiOrdenesUrl = 'http://127.0.0.1:8000/api/ordenes/';
  apiUrl = 'http://127.0.0.1:8000/api/';

  ordenes = signal<OrdenDeTrabajo[]>([]);

  constructor(private http: HttpClient) { }

  crearOrden(orden: OrdenDeTrabajoCreatePayload): Observable<OrdenDeTrabajo> {

    const url = this.apiOrdenesUrl;
    return this.http.post<OrdenDeTrabajo>(url, orden);
  }

  listarOrdenesDelTaller() {
    return this.http.get<OrdenDeTrabajo[]>(this.apiOrdenesUrl).pipe(
      tap(data => this.ordenes.set(data))
    );
  }

  // Método para obtener una orden por su ID (se puede sacar si molesta)
  obtenerOrden(id: number): Observable<OrdenDeTrabajo> {
    const url = `${this.apiOrdenesUrl}${id}/`;
    return this.http.get<OrdenDeTrabajo>(url);
  }

  getOrdenesPorVehiculo(tecnicoId: number, vehiculoId: number) {
    const url = `${this.apiUrl}tecnicos/${tecnicoId}/vehiculo/${vehiculoId}/ordenes/`;
    return this.http.get<OrdenDeTrabajo[]>(url);
  }

  obtenerTurnosAsignadosPorAgendaYFecha(agendaId: number, fechaYYYYMMDD: string): Observable<OrdenDeTrabajo[]> {
    const params = new HttpParams().set('fecha', fechaYYYYMMDD);
    const url = `http://127.0.0.1:8000/api/agendas/${agendaId}/turnos-asignados/`;
    return this.http.get<OrdenDeTrabajo[]>(url, { params });
  }

  // // ✅ NUEVO: órdenes por taller + fecha (para filtrar horarios ocupados)
  // obtenerOrdenesPorTallerYFecha(tallerId: number, fechaYYYYMMDD: string): Observable<OrdenDeTrabajo[]> {
  //   const params = new HttpParams()
  //     .set('taller', String(tallerId))
  //     .set('fecha', fechaYYYYMMDD);

  //   return this.http.get<OrdenDeTrabajo[]>(this.apiOrdenesUrl, { params });
  // }

}
