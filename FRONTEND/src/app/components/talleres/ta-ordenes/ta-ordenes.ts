import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { OrdenService } from '../../../services/ordenes/orden.service';
import { TalleresService } from '../../../services/talleres/talleres.service';

// =========================
// MODELO FRONT (alineado a DRF)
// =========================
export type TipoMantenimiento = 'preventivo' | 'correctivo';

export interface OrdenDeTrabajo {
  id: number;

  agenda: number | null;
  fecha_turno: string; // ISO datetime
  fecha_entrega: string | null; // ISO date

  kilometraje: number;
  observaciones_tecnicas: string | null;

  fecha_siguiente_servicio: string | null;
  kilometraje_siguiente_servicio: number | null;

  mantenimiento: TipoMantenimiento;

  cliente: number;   // FK id
  vehiculo: number;  // FK id
  taller: number | null;
  //tecnico: number | null;
  responsable_tecnico: string | null;
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
  private tallerService = inject(TalleresService);
  // =========================
  // SIGNALS DE SERVICIOS
  // =========================
  ordenesSig = this.ordenService.ordenes;
  clientesSig = this.clienteService.clientes;
  vehiculosSig = this.vehiculoService.vehiculos;
  talleresSig = this.tallerService.listaTalleres;
  // =========================
  // BUSCADOR
  // =========================
  filtroCampo: FiltroCampo = 'cliente';
  terminoBusqueda = '';

  // =========================
  // UI / SELECCIÓN
  // =========================
  ordenSeleccionada: OrdenDeTrabajo | null = null;
  ordenesFiltradas: OrdenDeTrabajo[] = [];

  ngOnInit(): void {
    // 1) Cargar órdenes del taller
    this.ordenService.listarOrdenesDelTaller().subscribe({
      next: (ordenes) => {
        this.ordenService.ordenes.set(ordenes);
        this.ordenesFiltradas = [...ordenes];
        
        //Detalle abierto por default
        if (ordenes.length > 0) {
          // Si no hay ninguna seleccionada aún, selecciono la primera
          this.ordenSeleccionada = ordenes[0] ?? null;
        }
      },
      error: (e) => console.error('Error cargando órdenes', e),
    });

    // 2) Cargar clientes/vehículos para formateo legible
    // Si ya los precargás globalmente en un layout/aside,
    // podrías eliminar estas llamadas.
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.clienteService.clientes.set(clientes),
      error: (e) => console.error('Error cargando clientes', e),
    });

    this.vehiculoService.listarTodos().subscribe({
      next: (vehiculos) => this.vehiculoService.vehiculos.set(vehiculos),
      error: (e) => console.error('Error cargando vehículos', e),
    });

      this.tallerService.getTalleres().subscribe({
      next: (talleres) => this.tallerService.listaTalleres.set(talleres),
      error: (e) => console.error('Error cargando talleres', e),
    });
}

  // =========================
  // TABS
  // =========================
  verOrdenesTrabajo(): void {
    this.router.navigate(['/taller', 'ordenes']);
  }

  crearNuevaOrden(): void {
    // Tu nuevo formulario renombrado
    this.router.navigate(['/taller', 'form-orden']);
  }

  // =========================
  // BUSCAR / FILTRAR
  // =========================
  buscar(): void {
    const todas = this.ordenesSig();
    const t = this.terminoBusqueda.trim().toLowerCase();

    if (!t) {
      this.ordenesFiltradas = [...todas];
    } else if (this.filtroCampo === 'cliente') {
      this.ordenesFiltradas = todas.filter(o => {
        const nombre = this.formatClienteNombre(o.cliente).toLowerCase();
        const extras = this.formatClienteExtras(o.cliente).toLowerCase();
        return nombre.includes(t) || extras.includes(t) || String(o.cliente).includes(t);
      });
    } else if (this.filtroCampo === 'vehiculo') {
      this.ordenesFiltradas = todas.filter(o => {
        const main = this.formatVehiculoMain(o.vehiculo).toLowerCase();
        const sub = this.formatVehiculoSub(o.vehiculo).toLowerCase();
        return main.includes(t) || sub.includes(t) || String(o.vehiculo).includes(t);
      });
    } else {
      this.ordenesFiltradas = todas.filter(o =>
        this.formatFechaTurno(o.fecha_turno).toLowerCase().includes(t)
      );
    }

    // ✅ Si la seleccionada ya no está en el resultado, selecciono la primera del filtro
    if (
      this.ordenSeleccionada &&
      !this.ordenesFiltradas.some(x => x.id === this.ordenSeleccionada!.id)
    ) {
      this.ordenSeleccionada = this.ordenesFiltradas[0] ?? null;
    }

    // ✅ Si no había nada seleccionada y hay resultados, elijo la primera
    if (!this.ordenSeleccionada && this.ordenesFiltradas.length > 0) {
      this.ordenSeleccionada = this.ordenesFiltradas[0];
    }
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda = '';
    this.ordenesFiltradas = [...this.ordenesSig()];

    // ✅ Re-selección por default
    if (this.ordenesFiltradas.length > 0) {
      this.ordenSeleccionada = this.ordenesFiltradas[0];
    } else {
      this.ordenSeleccionada = null;
    }
  }


  // =========================
  // SELECCIÓN / DETALLE
  // =========================
  seleccionarOrden(o: OrdenDeTrabajo): void {
      this.cerrarDetalle();
      
      this.ordenSeleccionada = o;
      
    console.log('Orden seleccionada:', this.ordenSeleccionada);
  }

  cerrarDetalle(): void {
    this.ordenSeleccionada = null;
  }

  // =========================
  // ACCIONES
  // =========================
  acciones(): void {
    if (!this.ordenSeleccionada) {
      alert('Seleccioná una orden primero.');
      return;
    }

    console.log('Acciones sobre:', this.ordenSeleccionada);
    // Futuro:
    // modal/menú de:
    // - ver presupuesto
    // - cancelar
    // - cambiar estado
  }

  // =========================
  // NAVEGACIÓN DESDE DETALLE
  // =========================
  irAEditarOrden(o: OrdenDeTrabajo): void {
    // Ruta recomendada con param id
    this.router.navigate(['/taller', 'ordenes', o.id, 'editar']);
  }

  verPresupuestoDeOrden(o: OrdenDeTrabajo): void {
    this.router.navigate(['/taller', 'presupuestos'], {
      queryParams: { ordenId: o.id }
    });
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

  // =========================
  // TALLERES
  // =========================
  formatTallerNombre(tallerId: number | null): string {
  if (!tallerId) return '-';

  const t = this.talleresSig().find(x => x.id === tallerId);
  if (!t) return `Taller #${tallerId}`;

  return t.nombre || `Taller #${tallerId}`;
}

formatTallerFull(tallerId: number | null): string {
  if (!tallerId) return '-';

  const t = this.talleresSig().find(x => x.id === tallerId);
  if (!t) return `Taller #${tallerId}`;

  const dir = [t.direccion].filter(Boolean).join(', ');
  return [t.nombre, dir].filter(Boolean).join(' - ') || `Taller #${tallerId}`;
}

}
