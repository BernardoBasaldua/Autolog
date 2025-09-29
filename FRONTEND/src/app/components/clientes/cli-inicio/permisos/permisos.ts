import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermisosService } from '../../../../services/permisos/permisos.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './permisos.html',
  styleUrls: ['./permisos.css']   
})
export class Permisos implements OnInit {
  clienteId!: number;        // ID del cliente
  vehiculoId!: number;       // ID del vehículo
  talleres: any[] = [];      // Lista de talleres autorizados
  filtro = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private permisosService: PermisosService
  ) {
    // Obtenemos clienteId y vehiculoId de la ruta o query params
    this.route.params.subscribe(params => {
      this.clienteId = +params['id'];        // /clientes/:id/permisos
      this.vehiculoId = +params['vehiculoId']; // si está en la ruta
    });
    this.route.queryParams.subscribe(q => {
      if (q['vehiculo_id']) {
        this.vehiculoId = +q['vehiculo_id']; // si viene como query param
      }
    });
  }
  
  ngOnInit(): void {
    if (this.clienteId && this.vehiculoId) {
      this.cargarTalleres(this.vehiculoId);
    }
  }

  cargarTalleres(vehiculoId: number) {
    this.permisosService.getTalleresAutorizados(this.clienteId, vehiculoId).subscribe({
      next: data => this.talleres = data,
      error: err => console.error(err)
    });
  }

  aceptarSolicitud(solicitud: any) {
    console.log('Aceptar', solicitud);
  }

  denegarSolicitud(solicitud: any) {
    console.log('Denegar', solicitud);
  }

  revocarPermiso(permiso: any) {
    console.log('Revocar', permiso);
  }

}

