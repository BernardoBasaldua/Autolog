import { Component, OnInit, inject } from '@angular/core';
import { ClienteService } from  '../../../../services/usuarios/clientes/cliente.service'
import { UsuarioService } from  '../../../../services/usuarios/usuarios/usuario.service'
import { VehiculoService } from  '../../../../services/vehiculo/vehiculo.service'
import { TalleresService } from  '../../../../services/talleres/talleres.service'
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
  usuarioService = inject(UsuarioService); 
  vehiculoService = inject(VehiculoService); 
  tallerService = inject(TalleresService); 
  route = inject(ActivatedRoute);

  vehiculoId!: number;

  
  // hacer que pueda obtener todos los clientes existentes
  clientesExistentes : ClienteModel[] = [];
  talleresExistentes : Taller[] = [];
  cliente_ids: number[] = [];
  taller_ids: number [] = [];
  clientesConAcceso : ClienteModel[] = [];
  talleresConAcceso: Taller[] = [];
  // hacer que pueda obtener todos los talleres existentes
  talleres : Taller[] = [];
  vehiculoActual?: Vehiculo;



  ngOnInit(): void {
    this.vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculoId'));

    // 1) Cargar clientes primero
    this.usuarioService.getClientes().subscribe(clientes => {
      this.clientesExistentes = clientes;
      console.log("CLIENTES EXISTENTES:", this.clientesExistentes);

      // 2) Luego cargar permisos
      this.cargarPermisosYProcesar();
    });
    // cargar listas de clientes y talleres si las necesitás en el select

    // this.clienteService.getClientes().subscribe((data: ClienteModel[]) => this.clientes = data);
    // this.clienteService.getTalleres().subscribe((data: Taller[]) => this.talleres = data);

    this.tallerService.getTalleres().subscribe(talleres => {
      this.talleresExistentes = talleres;
      console.log("TALLERES EXISTENTES:", this.talleresExistentes);
    });

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

  cargarPermisosYProcesar() {
    this.clienteService.getMiCliente().subscribe(cliente => {
      
      this.permisosOtorgados = cliente.permisos_que_otorgo || [];
      console.log("PERMISOS:", this.permisosOtorgados);

      // extraer ids
      this.cliente_ids = this.permisosOtorgados
        .map(p => p.cliente_autorizado)
        .filter((id): id is number => id !== undefined);


      console.log("CLIENTE IDS:", this.cliente_ids);

      // filtrar objetos clientes
      this.clientesConAcceso = this.clientesExistentes.filter(
        c => c.id !== undefined && this.cliente_ids.includes(c.id)
      );

      console.log("CLIENTES CON PERMISOS:", this.clientesConAcceso);
      this.vehiculoActual = cliente.mis_vehiculos?.find(v => v.id === this.vehiculoId);

    });

  }


  getNombreCliente(id: number | undefined): string {
    if (!id) return '';
    const cliente = this.clientesConAcceso.find(c => c.id === id);
    if (!cliente) return '';
    return cliente.usuario.first_name + ' ' + cliente.usuario.last_name;
  }

  crearNuevoPermiso() {

  const nuevoPermiso: Partial<PermisoDeAcceso> = {
    vehiculo_autorizado: this.vehiculoActual,
    autoriza: this.clienteService.clienteActual(),
  };

  const destinatarioId = Number(this.formNuevoPermiso.destinatario_id);

  if (this.formNuevoPermiso.tipo_destinatario === 'cliente') {
    const clienteSeleccionado = this.clientesExistentes.find((c: ClienteModel) => c.id === destinatarioId);
    if (!clienteSeleccionado) return alert('Cliente no encontrado');
      if (destinatarioId != null) {
        nuevoPermiso.cliente_autorizado = destinatarioId;
      } else {
        alert('Cliente no seleccionado');
        return;
      }
  } else if (this.formNuevoPermiso.tipo_destinatario === 'taller') {
     const tallerSeleccionado = this.talleresExistentes.find((t: Taller) => t.id === destinatarioId);
    if (!tallerSeleccionado) return alert('Taller no encontrado');
    nuevoPermiso.taller_autorizado = tallerSeleccionado;
  }

  this.clienteService.crearPermiso(nuevoPermiso as PermisoDeAcceso).subscribe({
    next: () => {
      alert('Permiso creado con éxito');
      this.mostrarFormulario = false;
      this.cargarPermisosYProcesar();
    },
    error: (err: any) => {
      console.error(err);
      alert('Error al crear el permiso');
    }
    });
  }
}
