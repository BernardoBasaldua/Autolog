import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { OrdenService } from '../../../services/ordenes/orden.service';

// =========================
// MODELO FRONT
// =========================
export type TipoMantenimiento = 'preventivo' | 'correctivo';

export interface OrdenDeTrabajo {
  id: number;

  agenda: number | null;
  fecha_turno: string; // ISO datetime
  fecha_entrega: string | null; // ISO date

  kilometraje: number;
  observaciones_tecnicas: string | null;

  fecha_siguiente_servicio: string | null; // ISO date
  kilometraje_siguiente_servicio: number | null;

  mantenimiento: TipoMantenimiento;

  cliente: number;   // FK id
  vehiculo: number;  // FK id
  taller: number | null;
  tecnico: number | null;
}

// Para el combo actual del buscador
type FiltroCampo = 'cliente' | 'vehiculo' | 'fecha_turno';

@Component({
  selector: 'app-ta-ordenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-ordenes.html',
  styleUrl: './ta-ordenes.css',
})
export class TaOrdenes {
  private router = inject(Router);
  private ordenService = inject(OrdenService);
  private clienteService = inject(ClienteService);
  private vehiculoService = inject(VehiculoService);

  // ✅ Signals de servicios
  ordenesSig = this.ordenService.ordenes;
  clientesSig = this.clienteService.clientes;
  vehiculosSig = this.vehiculoService.vehiculos;

  // =========================
  // BUSCADOR
  // =========================
  filtroCampo: FiltroCampo = 'cliente';
  terminoBusqueda = '';

  // =========================
  // UI / SELECCIÓN
  // =========================
  ordenSeleccionada: OrdenDeTrabajo | null = null;

  // Lista filtrada
  ordenesFiltradas: OrdenDeTrabajo[] = [];

  ngOnInit(): void {
    // 1) Cargar órdenes del taller
    this.ordenService.listarOrdenesDelTaller().subscribe({
      next: (ordenes) => {
        this.ordenService.ordenes.set(ordenes);
        this.ordenesFiltradas = [...ordenes];
      },
      error: (e) => console.error('Error cargando órdenes', e),
    });

    // 2) Cargar clientes/vehículos para formateo legible
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.clienteService.clientes.set(clientes),
      error: (e) => console.error('Error cargando clientes', e),
    });

    this.vehiculoService.listarTodos().subscribe({
      next: (vehiculos) => this.vehiculoService.vehiculos.set(vehiculos),
      error: (e) => console.error('Error cargando vehículos', e),
    });
  }

  // =========================
  // TABS
  // =========================
  verOrdenesTrabajo() {
    this.router.navigate(['/taller', 'ordenes']);
  }

  crearNuevaOrden() {
    this.router.navigate(['/taller', 'ordenes', 'nueva']);
  }

  // =========================
  // BUSCAR / FILTRAR
  // =========================
  buscar(): void {
    const todas = this.ordenesSig();
    const t = this.terminoBusqueda.trim().toLowerCase();

    if (!t) {
      this.ordenesFiltradas = [...todas];
      return;
    }

    if (this.filtroCampo === 'cliente') {
      this.ordenesFiltradas = todas.filter(o => {
        const nombre = this.formatClienteNombre(o.cliente).toLowerCase();
        const extras = this.formatClienteExtras(o.cliente).toLowerCase();
        return nombre.includes(t) || extras.includes(t) || String(o.cliente).includes(t);
      });
      return;
    }

    if (this.filtroCampo === 'vehiculo') {
      this.ordenesFiltradas = todas.filter(o => {
        const main = this.formatVehiculoMain(o.vehiculo).toLowerCase();
        const sub = this.formatVehiculoSub(o.vehiculo).toLowerCase();
        return main.includes(t) || sub.includes(t) || String(o.vehiculo).includes(t);
      });
      return;
    }

    if (this.filtroCampo === 'fecha_turno') {
      this.ordenesFiltradas = todas.filter(o =>
        (this.formatFechaTurno(o.fecha_turno) ?? '').toLowerCase().includes(t)
      );
      return;
    }
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.ordenesFiltradas = [...this.ordenesSig()];
  }

  // =========================
  // SELECCIÓN
  // =========================
  seleccionarOrden(o: OrdenDeTrabajo): void {
    this.ordenSeleccionada = o;
  }

  // =========================
  // EDITAR
  // =========================
  editarOrden(o: OrdenDeTrabajo): void {
    // Ruta recomendada:
    // /taller/ordenes/:id/editar
    this.router.navigate(['/taller', 'ordenes', o.id, 'editar']);
  }

  // =========================
  // ACCIONES
  // =========================
  acciones(): void {
    console.log('Acciones sobre:', this.ordenSeleccionada);

    // Idea futura:
    // - si no hay orden seleccionada => alert
    // - abrir modal menú:
    //   ver presupuesto, cancelar, etc.
  }

  // =========================
  // FORMATTERS (2 líneas)
  // =========================
  formatClienteNombre(clienteId: number): string {
    const c = this.clientesSig().find(x => x.id === clienteId);
    if (!c) return `Cliente #${clienteId}`;

    const nombre = `${c.usuario?.first_name ?? ''} ${c.usuario?.last_name ?? ''}`.trim();
    return nombre || `Cliente #${clienteId}`;
  }

  formatClienteExtras(clienteId: number): string {
    const c = this.clientesSig().find(x => x.id === clienteId);
    if (!c) return '';

    const tel = c.usuario?.telefono ?? '';
    const mail = c.usuario?.email ?? '';
    return [tel, mail].filter(Boolean).join(' • ');
  }

  formatVehiculoMain(vehiculoId: number): string {
    const v = this.vehiculosSig().find(x => x.id === vehiculoId);
    if (!v) return `Vehículo #${vehiculoId}`;

    const marca = v.marca?.nombre ?? '';
    const modelo = v.modelo?.nombre ?? '';
    const mm = `${marca} ${modelo}`.trim();

    return mm || `Vehículo #${vehiculoId}`;
  }

  formatVehiculoSub(vehiculoId: number): string {
    const v = this.vehiculosSig().find(x => x.id === vehiculoId);
    if (!v) return '';

    return v.dominio ?? '';
  }

  // =========================
  // FECHAS
  // =========================
  formatFechaTurno(fechaISO: string): string {
    if (!fechaISO) return '-';
    try {
      const d = new Date(fechaISO);

      const fecha = d.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const hora = d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return `${fecha} ${hora}`;
    } catch {
      return fechaISO;
    }
  }

  formatFechaSimple(fechaISO: string | null | undefined): string {
    if (!fechaISO) return '-';
    try {
      const d = new Date(fechaISO);
      return d.toLocaleDateString('es-AR');
    } catch {
      return String(fechaISO);
    }
  }
}
