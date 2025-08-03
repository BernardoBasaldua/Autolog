import { Injectable } from '@angular/core';
import { Turno } from '../../models/turnos/turno.model';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private turnos: Turno[] = [
    {
      id: 1,
      vehiculo: { id: 1, marca: 'Volkswagen', modelo: 'Amarok', patente: 'AB 123 CD' },
      taller: {
        id: 1, nombre: 'Taller A', direccion: 'Calle Falsa 123', telefono: '123456789', email: '',
        horarioAtencion: [],
        serviciosOfrecidos: []
      },
      fecha: '2023-10-01', 
      hora: '10:00',
      referente: 'Cliente A'
    },
    {
      id: 2,
      vehiculo: { id: 2, marca: 'BMW', modelo: '530i', patente: 'AG 123 CD' },
      taller: {
        id: 2, nombre: 'Taller B', direccion: 'Avenida Siempre Viva 456', telefono: '987654321', email: '',
        horarioAtencion: [],
        serviciosOfrecidos: []
      },
      fecha: '2023-10-02',
      hora: '11:00',
      referente: 'Cliente B'
    },
  ];
}
