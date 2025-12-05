import { Component, OnInit } from '@angular/core';
import { inject, signal } from '@angular/core';

import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { ClienteModel } from '../../../models/usuarios/usuario.model';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Historial } from './historial/historial';


@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cli-inicio.html',
  styleUrl: './cli-inicio.css'
})


export class CliInicio implements OnInit {
  clienteService = inject(ClienteService); 

  clienteActual = this.clienteService.clienteActual //: ClienteModel | null = null;
  

  constructor(private vehiculoService: VehiculoService, private router: Router) {}

  ngOnInit(): void {
    console.log('Iniciando componentec cliInicio y esperando vehículos...');
    this.clienteService.getMiCliente().subscribe({
      next: () =>{},
      error:(error)=>{
        console.log('error al obtener cliente, back no responde', error);}
    });
    
  }
  

  administrarPermisos(vehiculo: Vehiculo) {
    console.log(`Permisos para: ${vehiculo.dominio}`);
    this.router.navigate(['/cliente', 'permisos', vehiculo.id]);
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
