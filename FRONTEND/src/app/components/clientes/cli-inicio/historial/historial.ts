import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { VehiculoService } from '../../../../services/vehiculo/vehiculo.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './historial.html',
  styleUrl: './historial.css'
})
export class Historial {
  vehiculoId: number;
  vehiculo: any;

  constructor(private router: Router, private vehiculoService: VehiculoService) {
    // Obtener el ID del vehículo desde la ruta
    const url = this.router.url;
    const parts = url.split('/');
    this.vehiculoId = parseInt(parts[parts.length - 1], 10);
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    console.log(`Historial para el vehículo con ID: ${this.vehiculoId}`);
    // Cargar el historial del vehículo usando el ID
    this.vehiculoService.getVehiculoById(this.vehiculoId).subscribe(vehiculo => {
      if (vehiculo) {
        console.log(`Vehículo encontrado: ${vehiculo.marca} ${vehiculo.modelo}`);
        this.vehiculo = vehiculo;
      } else {
        console.log('Vehículo no encontrado');
      }
    });
  }
}