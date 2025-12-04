import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';

import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { ClienteModel } from '../../../models/usuarios/usuario.model';

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
  mis_vehiculos?: Vehiculo[] = [];
  vehiculos_autorizados?: Vehiculo[] = [];
  clienteService = inject(ClienteService); 
  clienteActual: ClienteModel | null = null;
  
  

  constructor(private vehiculoService: VehiculoService, private router: Router) {}

  ngOnInit(): void {
    console.log('Iniciando componentec cliInicio y esperando vehículos...');
    this.clienteService.getMiCliente().subscribe({
      next: (data) =>{ 
        this.clienteActual = data;
        this.mis_vehiculos = this.clienteActual.mis_vehiculos;
        this.vehiculos_autorizados = this.clienteActual.vehiculos_externos;

      },
      error:(error)=>{
        console.log('error al obtener cliente, back no responde');}
    });
    //Una Promesa (Promise) te trae un solo valor en el futuro (por ejemplo, el resultado de una petición HTTP). Un Observable (Observable) puede traerte uno, varios o infinitos valores en distintos momentos del tiempo (como un stream/canal de datos). Cuando hacés una petición HTTP en Angular con HttpClient, no obtenés el resultado directo. En cambio, te devuelve un Observable. 
    // Un Observable es como un “canal de datos” al que vos te suscribís para recibir lo que emita (los datos o los errores).
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
