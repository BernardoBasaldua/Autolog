import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ta-detail',
  imports: [],
  templateUrl: './ta-detail.html',
  styleUrl: './ta-detail.css'
})
export class TaDetail {
  constructor(private router: Router) {}

  verTurnos() {
    console.log('Ver turnos');
    this.router.navigate(['/taller', 'turnos']);
  }

  crearNuevaOrden() {
    console.log('Crear nueva orden');
    this.router.navigate(['/taller', 'ordenes', 'nueva']);
  }
}
