import { Component, inject } from '@angular/core';
import { UsuarioModel } from '../../../models/usuarios/usuario.model';
import { UsuarioService } from '../../../services/usuarios/usuarios/usuario.service';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { ClienteModel } from '../../../models/usuarios/usuario.model';
import { Taller } from '../../../models/talleres/taller.model';
import { PermisoDeAcceso } from '../../../models/permisos/permiso-acceso.model';

import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormClientes } from '../../registro/form-clientes/form-clientes';
import { TalleresService } from '../../../services/talleres/talleres.service';
import { ClientePublicoModel } from '../../../models/usuarios/usuario.model';





// 🔹 Enum declarado FUERA de la clase
export enum ModoSeleccion {
  Default = 'default',
  Permisos = 'permisos',
  NuevoDesdeTaller = 'nuevo-desde-taller'
}

@Component({
  selector: 'app-seleccion-usuario',
  imports: [CommonModule, FormsModule, FormClientes],
  templateUrl: './seleccion-usuario.html',
  styleUrl: './seleccion-usuario.css'
})
export class SeleccionUsuario {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clienteService = inject(ClienteService);

  private talleresService = inject(TalleresService);

  // clientes: ClienteModel[] = [];
  // clientesFiltrados: ClienteModel[] = [];

  clientes: ClientePublicoModel[] = [];
  clientesFiltrados: ClientePublicoModel[] = [];

  talleres: Taller[] = [];
  talleresFiltrados: Taller[] = [];


  // 🔹 Exponer el enum al template
  modo: string = 'default';
  tipo: string = "";


  clienteActual: ClienteModel | null = null;

  vehiculoId!: number;

  
  terminoBusqueda = '';

  ngOnInit(): void {
  this.vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculoId'));
  this.clienteActual = this.clienteService.clienteActual();

  this.tipo = this.route.snapshot.data?.['modo'] ?? '';
  this.modo = 'default';

  this.cargarClientes(); // carga tab default
}



//   cargarUsuarios(): void {
//   this.usuarioService.getClientes().subscribe({
//     next: (clientes) => {
//       const miPk = this.clienteActual?.usuario?.pk;

//       // clientes vienen con { id, usuario: {...} }
//       // Excluirme a mí (comparando por pk del usuario)
//       const filtrados = miPk
//         ? clientes.filter(c => c.usuario?.pk !== miPk)
//         : clientes;

//       // Acá guardamos como "usuarios" pero realmente son clientes
//       // Si querés, renombramos después a "clientes"
//       // this.usuarios = filtrados as any;
//       // this.usuariosFiltrados = filtrados as any;

//       console.log('clientes total', clientes.length);
//       console.log('miPk', miPk);
//       console.log('clientes sin mi', filtrados.length);
//       console.log('primer cliente', filtrados[0]);
//     },
//     error: (e) => console.error('Error cargando clientes', e),
//   });
// }
cargarClientes(): void {
  this.clienteService.getClientesPublicos().subscribe({
    next: (clientes) => {
      const miPk = this.clienteActual?.usuario?.pk;

      this.clientes = miPk
        ? clientes.filter(c => c.usuario_pk !== miPk)
        : clientes;

      this.clientesFiltrados = this.clientes;
    },
    error: (e) => console.error('Error cargando clientes', e),
  });
}


cargarTalleres(): void {
  this.talleresService.getTalleres().subscribe({
    next: (talleres) => {
      this.talleres = talleres;
      this.talleresFiltrados = talleres;
    },
    error: (e) => console.error('Error cargando talleres', e),
  });
}




  volver(): void {
    this.router.navigate(['/taller/clientes']);
  }

  filtrar(): void {
  const termino = this.terminoBusqueda.toLowerCase().trim();

    if (this.modo === 'default') {
      if (!termino) {
        this.clientesFiltrados = this.clientes;
        return;
      }

      this.clientesFiltrados = this.clientes.filter(c => {
        const nombre = `${c.first_name} ${c.last_name}`.toLowerCase();
        const email = c.email.toLowerCase();

        return nombre.includes(termino) || email.includes(termino);
      });
    }
}




  crearOrden(usuario: UsuarioModel): void {
    // Ejemplo de navegación si querés crear orden
    // this.router.navigate(['/taller/clientes/form'], {
    //   queryParams: { modo: 'alta-desde-taller', usuarioId: usuario.id },
    // });
  }

  mostrarUsuariosExistentes(): void {
    this.modo = 'default';
    this.terminoBusqueda = '';
    if (this.clientes.length === 0) this.cargarClientes();
    else this.clientesFiltrados = this.clientes;
  }

  mostrarTalleresExistentes(): void {
    this.modo = 'permisos';
    this.terminoBusqueda = '';
    if (this.talleres.length === 0) this.cargarTalleres();
    else this.talleresFiltrados = this.talleres;
  }



  crearUsuarioNuevo(): void {
    this.modo = "nuevo-desde-taller-CLI";
  }

  verUsuario(usuario: UsuarioModel): void {
    console.log('click en ver usuario', usuario);
  }

//  otorgarPermisoUsuario(usuario: UsuarioModel): void {
//   if (!this.vehiculoId || !this.clienteActual?.id || !usuario.pk) {
//     console.error('Faltan datos para crear permiso', {
//       vehiculoId: this.vehiculoId,
//       autoriza: this.clienteActual?.id,
//       cliente: usuario.pk
//     });
//     return;
//   }

  

//   const nuevoPermiso: PermisoDeAcceso = {
//     vehiculo_autorizado: this.vehiculoId,
//     autoriza: this.clienteActual.id,        // ← bien
//     cliente_autorizado: usuario.pk,         // ← bien
//     taller_autorizado: null                 // ← dejalo null si no aplica
//   };

//   this.crearPermiso(nuevoPermiso, this.vehiculoId);
// }

  otorgarPermisoCliente(cliente: ClientePublicoModel): void {
    if (!this.vehiculoId || !this.clienteActual?.id) return;

    const nuevoPermiso: PermisoDeAcceso = {
      vehiculo_autorizado: this.vehiculoId,
      autoriza: this.clienteActual.id,
      // 👇 si tu backend espera ID de Cliente (lo normal)
      cliente_autorizado: cliente.id,
      taller_autorizado: null
    };

    this.crearPermiso(nuevoPermiso, this.vehiculoId);
  }




  otorgarPermisoTaller(taller: Taller): void {
    if (this.vehiculoId && this.clienteActual?.id && taller.id) {
      const nuevoPermiso: PermisoDeAcceso = {
        vehiculo_autorizado: this.vehiculoId,
        autoriza: this.clienteActual.id,
        taller_autorizado: taller.id
      };

      this.crearPermiso(nuevoPermiso, this.vehiculoId);
    } else {
      console.error('Faltan datos para crear permiso');
    }

  }

  crearPermiso(nuevoPermiso : PermisoDeAcceso, vehiculoId : number): void {
    this.clienteService.crearPermiso(nuevoPermiso as PermisoDeAcceso, this.vehiculoId).subscribe({
      next: () => {
        alert('Permiso creado con éxito');
        this.router.navigate(['/cliente/permisos', this.vehiculoId]);
      },
      error: (err: any) => {
        console.error(err);
        alert('Error al crear el permiso');
      }
    });
  }
}
