import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehiculoService } from '../../../../services/vehiculo/vehiculo.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.css']   
})

export class Historial implements OnInit {
  vehiculoId: number;
  vehiculo: any;
  filtro = '';

  constructor(private router: Router, private vehiculoService: VehiculoService) {
    const url = this.router.url;
    const parts = url.split('/');
    this.vehiculoId = parseInt(parts[parts.length - 1], 10);
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.vehiculoService.getVehiculoById(this.vehiculoId).subscribe({
      next: (vehiculo) => {
        console.log('Vehículo recibido:', vehiculo);
        this.vehiculo = vehiculo;
      },
      error: (err) => {
        console.error('Error al obtener vehículo', err);
      }
    });
  }
}
