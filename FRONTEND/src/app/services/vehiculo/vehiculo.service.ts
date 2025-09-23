
import { Injectable } from '@angular/core';
import { Vehiculo } from '../../models/vehiculo/vehiculo.model';
import { Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private vehiculos: Vehiculo[] = [];

  constructor(private http: HttpClient){}

  getVehiculos(clienteId: number): Observable<Vehiculo[]> {
  const url = `${this.apiUrl}/clientes/${clienteId}/vehiculos/`;
  return this.http.get<Vehiculo[]>(url).pipe(
    tap((vehiculos: Vehiculo[]) => this.vehiculos = vehiculos) // ahora sí se llena
  );
}


  getVehiculoById(id: number): Observable<Vehiculo | undefined> {
    const vehiculo = this.vehiculos.find(v => v.id === id);
    return of(vehiculo);
  }
}
