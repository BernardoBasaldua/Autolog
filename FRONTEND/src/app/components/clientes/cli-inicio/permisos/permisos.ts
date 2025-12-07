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
import { ClienteModel, UsuarioModel } from  '../../../../models/usuarios/usuario.model'
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';

import { Observable } from 'rxjs';


@Component({
  selector: 'app-permisos',
  templateUrl: './permisos.html',
  imports: [NgIf, NgForOf, CommonModule,
    FormsModule, RouterModule] 
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

  clienteActual!: ClienteModel;


  vehiculoId!: number;

  cliente_ids: number[] = [];
  taller_ids: number [] = [];

  
  // hacer que pueda obtener todos los clientes existentes
  clientesExistentes : UsuarioModel[] = [];
  talleresExistentes : Taller[] = [];
  clientesConAcceso : UsuarioModel[] = [];
  talleresConAcceso: Taller[] = [];
  // hacer que pueda obtener todos los talleres existentes
  talleres : Taller[] = [];
  vehiculoActual?: Vehiculo;



  ngOnInit(): void {
    this.vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculoId'));
    this.usuarioService.listarTodos().subscribe({
      next: (usuarios: UsuarioModel[]) => {
        this.clientesExistentes = usuarios; // directamente
        console.log('clientes existentes', this.clientesExistentes);
        this.cargarPermisosYProcesar();
      },
      error: (err) => console.error(err)
    });
    // cargar listas de clientes y talleres si las necesitás en el select

    // this.clienteService.getClientes().subscribe((data: ClienteModel[]) => this.clientes = data);
    // this.clienteService.getTalleres().subscribe((data: Taller[]) => this.talleres = data);

    this.tallerService.getTalleres().subscribe(talleres => {
      this.talleresExistentes = talleres;
      console.log("TALLERES EXISTENTES:", this.talleresExistentes);
    });

  }


revocarPermiso(permiso: PermisoDeAcceso): void {
  if (!permiso.id) {
    alert("El permiso no tiene id definido");
    return;
  }

  this.clienteService.eliminarPermiso(this.vehiculoId, permiso.id).subscribe({
    next: () => {
      alert("Permiso revocado con éxito");
      this.cargarPermisosYProcesar(); // refrescás la lista
    },
    error: (err) => {
      console.error(err);
      alert("Error al revocar el permiso");
    }
  });
}



  mostrarFormulario = false;

  formNuevoPermiso = {
  tipo_destinatario: 'cliente', // cliente | taller
  destinatario_id: null,        // id del cliente o taller autorizado
  };

  cargarPermisosYProcesar() {
    this.clienteService.getMiCliente().subscribe(cliente => {
      //guardo el cliente
      this.clienteActual = cliente;
      // Luego de obtener a mi cliente obtenemos los permisos que otorgo como un atributo suyo
      this.permisosOtorgados = cliente.permisos_que_otorgo || [];
      console.log("PERMISOS:", this.permisosOtorgados);

      // Hallo de los vehiculos que le pertenecen al cliente, cual corresponde al id de la url
      this.vehiculoActual = cliente.mis_vehiculos?.find(v => v.id === this.vehiculoId);

      // extraer ids de clientes autorizados
      this.cliente_ids = this.permisosOtorgados
        .map(p => p.cliente_autorizado)
        .filter((id): id is number => id !== undefined);
      console.log("CLIENTE IDS:", this.cliente_ids);

      // Extraer ids de talleres autorizados
      this.taller_ids = this.permisosOtorgados
        .map(p => p.taller_autorizado)
        .filter((id): id is number => id !== undefined);
      console.log("TALLER IDS:", this.cliente_ids);

      // filtrar objetos clientes que tienen ids dentro de la lista cliente_ids
      this.clientesConAcceso = this.clientesExistentes?.filter(
        (c: UsuarioModel) => c.pk !== undefined && this.cliente_ids.includes(c.pk)
      ) || [];

      console.log("CLIENTES CON PERMISOS:", this.clientesConAcceso);

      // filtrar objetos talleres que tienen ids dentro de la lista taller_ids
      this.talleresConAcceso = this.talleresExistentes.filter(
        c => c.id !== undefined && this.taller_ids.includes(c.id)
      );
      console.log("TALLERES CON PERMISOS:", this.talleresConAcceso);

    });

  }


  getNombreCliente(id: number | null | undefined): string {
    if (!id) return '';
    const cliente = this.clientesConAcceso.find(c => c.pk === id);
    if (!cliente) return '';
    return cliente.first_name + ' ' + cliente.last_name;
  }

  getNombreTaller(id: number | null | undefined): string {
    if (!id) return '';
    const taller = this.talleresConAcceso.find(c => c.id === id);
    if (!taller) return '';
    return taller.nombre;
  }

  crearNuevoPermiso() {

  const nuevoPermiso: Partial<PermisoDeAcceso> = {
    vehiculo_autorizado: this.vehiculoId,
    autoriza: this.clienteActual.id,
  };

  const destinatarioId = Number(this.formNuevoPermiso.destinatario_id);

  if (this.formNuevoPermiso.tipo_destinatario === 'cliente') {
    const clienteSeleccionado = this.clientesExistentes.find((c: UsuarioModel) => c.pk === destinatarioId);
    if (!clienteSeleccionado) {
      return alert('Cliente no encontrado');
    } else {
      nuevoPermiso.cliente_autorizado = destinatarioId;
    }
      
  } else if (this.formNuevoPermiso.tipo_destinatario === 'taller') {
     const tallerSeleccionado = this.talleresExistentes.find((t: Taller) => t.id === destinatarioId);
     if (!tallerSeleccionado) {
      return alert('Taller no encontrado');
    } else {
      nuevoPermiso.taller_autorizado = destinatarioId;
    }
  }

  this.clienteService.crearPermiso(nuevoPermiso as PermisoDeAcceso, this.vehiculoId).subscribe({
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
