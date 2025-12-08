import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteModel } from '../../../models/usuarios/usuario.model';
import { Router } from '@angular/router';
import { TalleresService } from '../../../services/talleres/talleres.service';

@Component({
  selector: 'app-ta-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-clientes.html',
  styleUrl: './ta-clientes.css', // si no te toma estilos: usar styleUrls
})
export class TaClientes implements OnInit {
  private tallerService = inject(TalleresService);
  private router = inject(Router);

  // =========================
  // DATA
  // =========================
  clientesSig = this.tallerService.clientesTaller;

  clientes: ClienteModel[] = [];
  clientesFiltrados: ClienteModel[] = [];

  // =========================
  // UI
  // =========================
  terminoBusqueda = '';
  clienteSeleccionado: ClienteModel | null = null;

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.tallerService.getClientesDeTaller().subscribe({
      next: (clientes) => {
        // guardo en signal
        this.clientesSig.set(clientes);

        // copias locales
        this.clientes = [...clientes];
        this.clientesFiltrados = [...clientes];

        // ✅ detalle abierto por default
        if (this.clientesFiltrados.length > 0) {
          this.clienteSeleccionado ??= this.clientesFiltrados[0];
        }
      },
      error: (e) => console.error('Error cargando clientes del taller', e),
    });
  }

  // =========================
  // SELECCIÓN
  // =========================
  seleccionarCliente(cliente: ClienteModel): void {
    this.clienteSeleccionado = null;
    this.clienteSeleccionado = cliente;
  }

  // =========================
  // FILTRADO
  // =========================
  filtrar(): void {
    const t = this.terminoBusqueda.trim().toLowerCase();

    if (!t) {
      this.clientesFiltrados = [...this.clientes];
    } else {
      this.clientesFiltrados = this.clientes.filter((c) => {
        const nombre = `${c.usuario?.first_name ?? ''} ${c.usuario?.last_name ?? ''}`
          .trim()
          .toLowerCase();

        const dni = String(c.usuario?.dni ?? '').toLowerCase();
        const email = String(c.usuario?.email ?? '').toLowerCase();
        const tel = String(c.usuario?.telefono ?? '').toLowerCase();

        return (
          nombre.includes(t) ||
          dni.includes(t) ||
          email.includes(t) ||
          tel.includes(t)
        );
      });
    }

    // ✅ comportamiento tipo Órdenes:
    // si la seleccionada no queda en el filtro, seleccionar la primera
    if (
      this.clienteSeleccionado &&
      !this.clientesFiltrados.some((x) => x.id === this.clienteSeleccionado!.id)
    ) {
      this.clienteSeleccionado = this.clientesFiltrados[0] ?? null;
    }

    // si no había seleccionada y hay resultados
    if (!this.clienteSeleccionado && this.clientesFiltrados.length > 0) {
      this.clienteSeleccionado = this.clientesFiltrados[0];
    }
  }

  // =========================
  // NAV
  // =========================
  nuevoCliente(): void {
    this.router.navigate(['/taller/clientes/seleccionUsuario'], {
      queryParams: { modo: 'alta-desde-taller-CLI' },
    });
  }

  editarCliente(cliente: ClienteModel): void {
    this.router.navigate(['/taller/clientes', cliente.id, 'editar']);
  }

  crearOrdenParaCliente(cliente: ClienteModel): void {
    this.router.navigate(['/taller', 'form-orden'], {
      queryParams: { clienteId: cliente.id },
    });
  }
}
