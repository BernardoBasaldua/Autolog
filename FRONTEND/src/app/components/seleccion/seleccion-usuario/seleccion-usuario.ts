import { Component, inject, input } from '@angular/core';
import { UsuarioModel } from '../../../models/usuarios/usuario.model';
import { UsuarioService } from '../../../services/usuarios/usuarios/usuario.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormClientes } from '../../registro/form-clientes/form-clientes';

type Modo = 'default' | 'nuevo-desde-taller'| 'permisos';

@Component({
  selector: 'app-seleccion-usuario',
  imports: [CommonModule, FormsModule, FormClientes],
  templateUrl: './seleccion-usuario.html',
  styleUrl: './seleccion-usuario.css'
})
export class SeleccionUsuario {

  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  modo : Modo = 'default'

  usuarios: UsuarioModel[] = [];
  usuariosFiltrados: UsuarioModel[] = [];
  terminoBusqueda = '';

  ngOnInit(): void {
    this.cargarUsuarios();
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

  volver(): void{
    this.router.navigate(['taller/clientes/'])
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
    // // vamos al form de cliente, pero indicando qué usuario usar
    // this.router.navigate(['/taller/clientes/form'], {
    //   queryParams: {
    //     modo: 'alta-desde-taller',
    //     usuarioId: usuario.id,
    //   },
    // });
  }

  mostrarUsuariosExistentes(): void {
    
    this.modo = 'default';
  }

  crearUsuarioNuevo(): void {
    
    this.modo = 'nuevo-desde-taller';
    // this.router.navigate(['taller/form-cliente'], {
    //   queryParams: {
    //     modo: 'alta-desde-taller',
    //   },
    // });
  }
  verUsuario(usuario: UsuarioModel){
    console.log('click en ver usuario')
  }
  
}
