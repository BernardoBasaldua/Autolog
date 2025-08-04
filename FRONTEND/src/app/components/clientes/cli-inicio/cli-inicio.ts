import { Component, OnInit } from '@angular/core';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service'
import {Vehiculo} from '../../../models/vehiculo/vehiculo.model'

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cli-inicio.html',
  styleUrl: './cli-inicio.css'
})
export class CliInicio implements OnInit {
  vehiculos: Vehiculo[] = [];
  
  clienteId: number = 3 //id simulado

  constructor(private vehiculoService: VehiculoService, private router: Router) {}

  ngOnInit(): void {
    console.log('Iniciando componente y esperando vehículos...');
    this.vehiculoService.getVehiculos(this.clienteId).subscribe({
      next: (data) =>{ this.vehiculos = data;},
      error:(error)=>{
      console.log('error al obtener los vehiculos, back no responde');}
    })
  }   

  administrarPermisos(vehiculo: Vehiculo) {
    console.log(`Permisos para: ${vehiculo.dominio}`);
  //  this.router.navigate(['/permisos']);
  }

  verHistorial(vehiculo: Vehiculo) {
    console.log(`Historial de: ${vehiculo.dominio}`);
    this.router.navigate(['/cliente', 'historial', vehiculo.id]);
  }

  proximoMantenimiento(vehiculo: Vehiculo) {

  }

  kilometraje(vehiculo: Vehiculo) {
    
  }

}
