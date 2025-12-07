import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteModel } from '../../../models/usuarios/usuario.model';
import { Router } from '@angular/router';
import { TalleresService } from '../../../services/talleres/talleres.service';



@Component({
  selector: 'app-ta-clientes',
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-clientes.html',
  styleUrl: './ta-clientes.css',
})
export class TaClientes implements OnInit {
  // lista completa de clientes del taller
  clientes: ClienteModel[] = [];

  // lista filtrada para mostrar en pantalla
  clientesFiltrados: ClienteModel[] = [];

  // texto del buscador (nombre, DNI, etc.)
  terminoBusqueda: string = '';
  router = inject(Router);

  tallerService = inject(TalleresService);

  ngOnInit(): void {
    // TODO: acá deberías llamar a un servicio que traiga
    // los clientes del taller (por ejemplo GET /api/clientes-del-taller)
    // y cuando llegue la respuesta, asignar:
    //
    // this.clientes = respuesta;
    // this.clientesFiltrados = respuesta;
    //
    // this.cargarClientes();
  }

  volver(): void{}
  cargarClientes(): void {
    // TODO:
    // - Llamar al servicio de clientes del taller
    // - Suscribirte al observable
    // - Asignar this.clientes y this.clientesFiltrados
    this.tallerService.getClientesDeTaller().subscribe({
  next: clientes => {
    this.clientes = clientes;
    this.clientesFiltrados = clientes;
  }
});
  }

  filtrar(): void {
    // TODO:
    // - Tomar this.terminoBusqueda
    // - Pasarlo a lowerCase + trim
    // - Si está vacío, this.clientesFiltrados = this.clientes
    // - Si no, filtrar por:
    //   - nombre completo: cliente.usuario.first_name + cliente.usuario.last_name
    //   - dni: cliente.usuario.dni
    //   - email: cliente.usuario.email
  }

  nuevoCliente(): void {
    
    // - Navegar a un formulario de alta de cliente
      this.router.navigate(['/taller/clientes/seleccionUsuario'],{
       queryParams: { modo: 'alta-desde-taller-CLI' },
      });
  }

  verCliente(cliente: ClienteModel): void {
    // TODO:
    // - Navegar a una vista de detalle de cliente
    //   this.router.navigate(['/taller/clientes', cliente.id]);
  }

  editarCliente(cliente: ClienteModel): void {
    // TODO:
    // - Navegar a un formulario de edición
    //   this.router.navigate(['/taller/clientes', cliente.id, 'editar']);
  }

  eliminarCliente(cliente: ClienteModel): void {
    // TODO:
    // - Confirmar con window.confirm(...)
    // - Llamar al servicio DELETE /api/clientes/<id>/
    // - Si sale bien, quitarlo de this.clientes y this.clientesFiltrados
  }
}
