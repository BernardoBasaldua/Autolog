import { Injectable } from '@angular/core';
import { Taller } from '../../models/talleres/taller.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TalleresService {
  private talleres: Taller[] = [
    {
      id: 1, nombre: 'Taller A', direccion: 'Calle Falsa 123', telefono: '123456789', email: 'tallerA@gmail.com',
      horarioAtencion: ['L-V', '9:00', '18:00'],
      serviciosOfrecidos: ['Cambio de aceite', 'Reparación de frenos', 'Alineación y balanceo']
    },
    {
      id: 2, nombre: 'Taller B', direccion: 'Avenida Siempre Viva 456', telefono: '987654321', email: 'tallerB@gmail.com',
      horarioAtencion: ['L-V', '8:00', '17:00'],
      serviciosOfrecidos: ['Reparación de motor', 'Cambio de neumáticos', 'Inspección técnica']
    },
    {
      id: 3, nombre: 'Taller C', direccion: 'Boulevard de los Sueños Rotos 789', telefono: '456123789', email: 'tallerC@gmail.com',
      horarioAtencion: ['L-V', '8:30', '16:30'],
      serviciosOfrecidos: ['Reparación de carrocería', 'Pintura de vehículos', 'Servicio de electricidad automotriz']
    },
    {
      id: 4, nombre: 'Taller D', direccion: 'Calle de la Amargura 321', telefono: '321654987', email: 'tallerD@gmail.com',
      horarioAtencion: ['L-V', '10:00', '19:00'], // Horario de atención con formato de array
      serviciosOfrecidos: ['Reparación de transmisión', 'Mantenimiento preventivo', 'Diagnóstico computarizado']
    },
    {
      id: 5, nombre: 'Taller E', direccion: 'Avenida de la Esperanza 654', telefono: '654321987', email: 'tallerE@gmail.com',
      horarioAtencion: ['L-V', '9:00', '17:00'],
      serviciosOfrecidos: ['Reparación de suspensión', 'Cambio de batería', 'Servicio de climatización']
    },
  ];

  getTalleres(): Observable<Taller[]> {
    return of(this.talleres);
  }
  getTallerById(id: number): Observable<Taller | undefined> {
    const taller = this.talleres.find(taller => taller.id === id);
    return of(taller);
  }
}
