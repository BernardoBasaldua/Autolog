import { Injectable } from '@angular/core';
import { Turno } from '../../models/turnos/turno.model';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  private turnos: Turno[] = [];
}
