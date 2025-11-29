import { Component, OnInit, inject } from '@angular/core';
import { ClienteService } from  '../../../../services/usuarios/clientes/cliente.service'
import { PermisoDeAcceso } from '../../../../models/permisos/permiso-acceso.model';
import { NgIf, NgForOf } from '@angular/common';


@Component({
  selector: 'app-permisos',
  templateUrl: './permisos.html',
  imports: [NgIf, NgForOf]
})
export class Permisos implements OnInit {

  solicitudesPendientes: PermisoDeAcceso[] = [];
  permisosOtorgados: PermisoDeAcceso[] = [];

  constructor() {}
  clienteService = inject(ClienteService); 


  ngOnInit(): void {
    const cliente = this.clienteService.clienteActual();

    if (cliente) {
      // // Permisos que le solicitaron al cliente
      // Como obtengo solicitudes?
      // this.solicitudesPendientes = cliente.permisos_que_recibi.filter(
      //   (p: PermisoDeAcceso) => !p.fecha_autorizacion
      // );

      // Permisos que el cliente otorgó
      this.permisosOtorgados = cliente.permisos_que_otorgo|| [];
    }
  }

  aceptarSolicitud(permiso: PermisoDeAcceso) {
    // Lógica para aceptar permiso (actualizar backend y frontend)
    permiso.fecha_autorizacion = new Date().toISOString().split('T')[0];
    // Aquí llamarías a tu servicio de API si querés persistirlo
  }

  denegarSolicitud(permiso: PermisoDeAcceso) {
    // Lógica para eliminar / rechazar
  }

  revocarPermiso(permiso: PermisoDeAcceso) {
    // Lógica de revocación
  }
}
