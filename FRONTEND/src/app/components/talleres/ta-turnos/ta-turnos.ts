import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ta-turnos',
  imports: [],
  templateUrl: './ta-turnos.html',
  styleUrl: './ta-turnos.css'
})
export class TaTurnos {
  constructor(private router: Router) {}

  verTurnos() {
    console.log('Ver turnos');
    this.router.navigate(['/taller', 'turnos']);
  }

  verDetalleTurno() {
    console.log('Ver detalle del turno con ID:');
    this.router.navigate(['/taller', 'turnos', 'detalle']);
  }
}
