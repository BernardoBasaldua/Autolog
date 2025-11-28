
import { Injectable } from '@angular/core';
import { Vehiculo } from '../../models/vehiculo/vehiculo.model';
import { Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  public vehiculos: Vehiculo[] = [];

  constructor(private http: HttpClient, private auth:AuthService){}

  getVehiculos(): Observable<Vehiculo[]> {
    const url = `${this.apiUrl}/clientes/vehiculos/`;
    return this.http.get<Vehiculo[]>(url).pipe(
      tap(v => {
        this.vehiculos = v;
        console.log('vehiculos:', v);
      })
    );
  }


  getVehiculoById(id: number): Observable<Vehiculo | undefined> {
    const vehiculo = this.vehiculos.find(v => v.id === id);
    return of(vehiculo);
  }

  getTalleresAutorizados(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clienteId}/talleres_autorizados/`);
  }

}
