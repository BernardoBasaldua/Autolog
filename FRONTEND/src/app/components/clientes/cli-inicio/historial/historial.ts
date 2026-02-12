import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehiculoService } from '../../../../services/vehiculo/vehiculo.service';
import { ClienteService } from '../../../../services/usuarios/clientes/cliente.service';
import { HistorialModel, Vehiculo } from '../../../../models/vehiculo/vehiculo.model';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.css']   
})

export class Historial implements OnInit {
  clienteService = inject(ClienteService);
  mis_vehiculos = this.clienteService.mis_vehiculos;
  historial : HistorialModel[] = [];

  vehiculoId: number;
  vehiculos : Vehiculo[];
  vehiculo : Vehiculo | null = null;
  

  constructor(private router: Router, private vehiculoService: VehiculoService) {
    const url = this.router.url;
    const parts = url.split('/');
    this.vehiculoId = parseInt(parts[parts.length - 1], 10);
    this.vehiculos = this.mis_vehiculos();
  }

  // ngOnInit(): void {

  //   this.vehiculo = this.vehiculos[this.vehiculoId];
  //   this.historial = this.vehiculo.historial;
    
  //   // window.scrollTo(0, 0);
  //   // this.vehiculoService.getVehiculoById(this.vehiculoId).subscribe({
  //   //   next: (vehiculo) => {
  //   //     console.log('Vehículo recibido:', vehiculo);
  //   //     this.vehiculo = vehiculo;
  //   //   },
  //   //   error: (err) => {
  //   //     console.error('Error al obtener vehículo', err);
  //   //   }
  //   // });
  // }
  ngOnInit(): void {
    this.vehiculo = this.vehiculos.find(v => v.id === this.vehiculoId) ?? null;
    this.historial = this.vehiculo?.historial ?? [];
  }
}
