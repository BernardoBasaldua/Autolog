import { Component, OnInit, inject } from '@angular/core';
import { ClienteService } from  '../../../../services/usuarios/clientes/cliente.service'
import { VehiculoService } from  '../../../../services/vehiculo/vehiculo.service'
import { PermisoDeAcceso } from '../../../../models/permisos/permiso-acceso.model';
import { NgIf, NgForOf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vehiculo } from  '../../../../models/vehiculo/vehiculo.model'
import { Taller } from  '../../../../models/talleres/taller.model'
import { ClienteModel } from  '../../../../models/usuarios/usuario.model'
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-permisos',
  templateUrl: './permisos.html',
  imports: [NgIf, NgForOf, CommonModule,
    FormsModule]
})
export class Permisos implements OnInit {

  solicitudesPendientes: PermisoDeAcceso[] = [];
  permisosOtorgados: PermisoDeAcceso[] = [];

  constructor() {}
  clienteService = inject(ClienteService); 
  vehiculoService = inject(VehiculoService); 
  route = inject(ActivatedRoute);

  vehiculoId!: number;

  
  // hacer que pueda obtener todos los clientes existentes
  clientes : ClienteModel[] = [];
  // hacer que pueda obtener todos los talleres existentes
  talleres : Taller[] = [];
  vehiculoActual?: Vehiculo;



  ngOnInit(): void {
    const cliente = this.clienteService.clienteActual();
    this.vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculoId'));
    // cargar permisos del cliente
    this.cargarPermisos();

    // cargar listas de clientes y talleres si las necesitás en el select

    // this.clienteService.getClientes().subscribe((data: ClienteModel[]) => this.clientes = data);
    // this.clienteService.getTalleres().subscribe((data: Taller[]) => this.talleres = data);
    const vehiculoActual = cliente?.mis_vehiculos?.find(v => v.id === this.vehiculoId);

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

  mostrarFormulario = false;

  formNuevoPermiso = {
  tipo_destinatario: 'cliente', // cliente | taller
  destinatario_id: null,        // id del cliente o taller autorizado
  };

  cargarPermisos() {
  this.clienteService.getMiCliente().subscribe({
    next: (cliente: ClienteModel) => {
      this.permisosOtorgados = cliente.permisos_que_otorgo || [];
    },
    error: (err: any) => console.error('Error al cargar permisos:', err)
  });
  }

  crearNuevoPermiso() {

  const nuevoPermiso: Partial<PermisoDeAcceso> = {
    vehiculo_autorizado: this.vehiculoActual,
    autoriza: this.clienteService.clienteActual(),
  };

  if (this.formNuevoPermiso.tipo_destinatario === 'cliente') {
    const clienteSeleccionado = this.clientes.find((c: ClienteModel) => c.id === this.formNuevoPermiso.destinatario_id);
    if (!clienteSeleccionado) return alert('Cliente no encontrado');
    nuevoPermiso.cliente_autorizado = clienteSeleccionado;
  } else if (this.formNuevoPermiso.tipo_destinatario === 'taller') {
    const tallerSeleccionado = this.talleres.find((t: Taller) => t.id === this.formNuevoPermiso.destinatario_id);
    if (!tallerSeleccionado) return alert('Taller no encontrado');
    nuevoPermiso.taller_autorizado = tallerSeleccionado;
  }

  this.clienteService.crearPermiso(nuevoPermiso as PermisoDeAcceso).subscribe({
    next: () => {
      alert('Permiso creado con éxito');
      this.mostrarFormulario = false;
      this.cargarPermisos();
    },
    error: (err: any) => {
      console.error(err);
      alert('Error al crear el permiso');
    }
  });
}



}
