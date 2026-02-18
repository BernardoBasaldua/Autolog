import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormClientes } from '../../../registro/form-clientes/form-clientes';
import { UsuarioService } from '../../../../services/usuarios/usuarios/usuario.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService } from '../../../../services/usuarios/clientes/cliente.service';
import { ClienteModel, ClientePublicoModel, UsuarioModel } from '../../../../models/usuarios/usuario.model';
import { VehiculoService } from '../../../../services/vehiculo/vehiculo.service';
import { PermisoDeAcceso } from '../../../../models/permisos/permiso-acceso.model';

// 🔹 Enum declarado FUERA de la clase
export enum ModoSeleccion {
  Default = 'default',
  Permisos = 'permisos',
  NuevoDesdeTaller = 'nuevo-desde-taller'
}

@Component({
  selector: 'app-ta-cli-seleccion',
  imports: [CommonModule, FormsModule, FormClientes],
  templateUrl: './ta-cli-seleccion.html',
  styleUrl: './ta-cli-seleccion.css'
})
export class TaCliSeleccion {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clienteService = inject(ClienteService);

  private vehiculoService = inject(VehiculoService);

  clientes: ClientePublicoModel[] = [];
  clientesFiltrados: ClientePublicoModel[] = [];

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


  confirmarCederTitularidad(c: any) {
    const nombre = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || 'este cliente';

    const ok = confirm(
      `¿Estás segura que querés ceder la titularidad a ${nombre}?\n\n` +
      `Vas a perder acceso a este vehículo y a todo su historial/órdenes.`
    );

    if (!ok) return;

    this.cederTitularidad(c);
  }

  cederTitularidad(c: any) {
    // Ajustá "this.vehiculoId" al nombre real que uses en este componente
    this.vehiculoService.transferirTitularidad(this.vehiculoId, c.id).subscribe({
      next: () => {
        alert('Titularidad transferida correctamente');
        // Ajustá la ruta a donde quieras volver
        this.router.navigate(['/taller/clientes']);
      },
      error: (err) => {
        console.error(err);
        alert('Error al transferir titularidad');
      }
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

  // crearOrden(usuario: UsuarioModel): void {
  //   // Ejemplo de navegación si querés crear orden
  //   // this.router.navigate(['/taller/clientes/form'], {
  //   //   queryParams: { modo: 'alta-desde-taller', usuarioId: usuario.id },
  //   // });
  // }

  mostrarUsuariosExistentes(): void {
    this.modo = 'default';
    this.terminoBusqueda = '';
    if (this.clientes.length === 0) this.cargarClientes();
    else this.clientesFiltrados = this.clientes;
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

  crearPermiso(nuevoPermiso: PermisoDeAcceso, vehiculoId: number): void {
    this.clienteService.crearPermiso(nuevoPermiso as PermisoDeAcceso, this.vehiculoId).subscribe({
      next: () => {
        alert('Permiso creado con éxito');
        this.router.navigate(['/taller/clientes', this.vehiculoId]);
      },
      error: (err: any) => {
        console.error(err);
        alert('Error al crear el permiso');
      }
    });
  }
}
