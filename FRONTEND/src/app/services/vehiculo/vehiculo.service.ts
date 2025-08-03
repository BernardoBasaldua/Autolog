
import { Injectable } from '@angular/core';
import { Vehiculo } from '../../models/vehiculo/vehiculo.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private vehiculos: Vehiculo[] = [
    { id: 1, marca: 'Volkswagen', modelo: 'Amarok', patente: 'AB 123 CD' },
    { id: 2, marca: 'BMW', modelo: '530i', patente: 'AG 123 CD' },
    { id: 3, marca: 'Toyota', modelo: 'Hilux', patente: 'AM 134 BG' }
  ];

  getVehiculos(): Observable<Vehiculo[]> {
    return of(this.vehiculos);
  }

  getVehiculoById(id: number): Observable<Vehiculo | undefined> {
    const vehiculo = this.vehiculos.find(v => v.id === id);
    return of(vehiculo);
  }
}
