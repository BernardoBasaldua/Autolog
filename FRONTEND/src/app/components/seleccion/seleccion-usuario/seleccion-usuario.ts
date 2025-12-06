import { Component, inject } from '@angular/core';
import { UsuarioModel } from '../../../models/usuarios/usuario.model';
import { UsuarioService } from '../../../services/usuarios/usuarios/usuario.service';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { ClienteModel } from '../../../models/usuarios/usuario.model';
import { PermisoDeAcceso } from '../../../models/permisos/permiso-acceso.model';

import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormClientes } from '../../registro/form-clientes/form-clientes';

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

  // 🔹 Exponer el enum al template
  modo: string = 'default';
  tipo: string = "";


  clienteActual!: ClienteModel;
  vehiculoId!: number;

  usuarios: UsuarioModel[] = [];
  usuariosFiltrados: UsuarioModel[] = [];
  terminoBusqueda = '';

  ngOnInit(): void {
    this.cargarUsuarios();
    this.vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculoId'));

   this.route.data.subscribe((data: any) => {
      const modoParam = data['modo'];
      this.tipo = modoParam;
    });
    this.modo = "default";
  }

  cargarUsuarios(): void {
    this.usuarioService.listarTodos().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = usuarios;
      },
      error: (e) => console.error('Error cargando usuarios', e),
    });
  }

  volver(): void {
    this.router.navigate(['taller/clientes/']);
  }

  filtrar(): void {
    const termino = this.terminoBusqueda.toLowerCase().trim();

    if (!termino) {
      this.usuariosFiltrados = this.usuarios;
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter((u) => {
      const nombreCompleto = `${u.first_name} ${u.last_name}`.toLowerCase();
      return (
        nombreCompleto.includes(termino) ||
        u.dni?.toString().includes(termino) ||
        u.email?.toLowerCase().includes(termino)
      );
    });
  }

  crearOrden(usuario: UsuarioModel): void {
    // Ejemplo de navegación si querés crear orden
    // this.router.navigate(['/taller/clientes/form'], {
    //   queryParams: { modo: 'alta-desde-taller', usuarioId: usuario.id },
    // });
  }

  mostrarUsuariosExistentes(): void {
    this.modo = "default";
  }

  mostrarTalleresExistentes(): void {
    this.modo = "permisos";
  }


  crearUsuarioNuevo(): void {
    this.modo = "nuevo-desde-taller";
  }

  verUsuario(usuario: UsuarioModel): void {
    console.log('click en ver usuario', usuario);
  }

  otorgarPermiso(usuario: UsuarioModel): void {
    const nuevoPermiso: Partial<PermisoDeAcceso> = {
      vehiculo_autorizado: this.vehiculoId,
      autoriza: this.clienteActual.id,
      cliente_autorizado: usuario.pk // usar id correcto
    };

    this.clienteService.crearPermiso(nuevoPermiso as PermisoDeAcceso, this.vehiculoId).subscribe({
      next: () => {
        alert('Permiso creado con éxito');
        this.router.navigate(['/permisos', this.vehiculoId]);
      },
      error: (err: any) => {
        console.error(err);
        alert('Error al crear el permiso');
      }
    });
  }
}
