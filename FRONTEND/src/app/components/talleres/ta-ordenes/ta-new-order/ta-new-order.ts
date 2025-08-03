import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ta-new-order',
  imports: [],
  templateUrl: './ta-new-order.html',
  styleUrl: './ta-new-order.css'
})
export class TaNewOrder {
  constructor(private router: Router) {}

  verOrdenesTrabajo() {
    console.log('Ver órdenes de trabajo');
    this.router.navigate(['/taller', 'ordenes']);
  }

  crearNuevaOrden() {
    console.log('Crear nueva orden');
    this.router.navigate(['/taller', 'ordenes', 'nueva']);
  }
}
