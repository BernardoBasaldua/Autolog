import { Component } from '@angular/core';
import { Taller } from '../../../../../models/talleres/taller.model';
import { Router } from '@angular/router';
import { TalleresService } from '../../../../../services/talleres/talleres.service';

@Component({
  selector: 'app-cli-sel-turno',
  imports: [],
  templateUrl: './cli-sel-turno.html',
  styleUrl: './cli-sel-turno.css'
})
export class CliSelTurno {
  constructor(private router: Router, private talleresService: TalleresService) {}

  pedirTurno(taller: Taller) {
    this.router.navigate(['/cliente', 'talleres', taller.id, 'pedir_turno']);
  }
}
