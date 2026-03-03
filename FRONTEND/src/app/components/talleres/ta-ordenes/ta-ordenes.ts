import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { computed } from '@angular/core';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { OrdenService } from '../../../services/ordenes/orden.service';
import { TalleresService } from '../../../services/talleres/talleres.service';

// =========================
// MODELO FRONT (alineado a DRF)
// =========================
export type TipoMantenimiento = 'preventivo' | 'correctivo';
export type EstadoOrden = 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada';

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

  estado: EstadoOrden;
  estado_actual: EstadoOrden;

  cliente: number;   // FK id
  vehiculo: number;  // FK id
  taller: number | null;
  //tecnico: number | null;
  responsable_tecnico: string | null;
}

// Para el combo actual del buscador
type FiltroCampo = 'cliente' | 'vehiculo' | 'fecha_turno';

// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

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
  // ordenesFiltradasSig = computed(() => {
  //   const todas = this.ordenesSig();
  //   const t = this.terminoBusqueda.trim().toLowerCase();

  //   if (!t) return todas;

  //   if (this.filtroCampo === 'cliente') {
  //     return todas.filter(o => {
  //       const nombre = this.formatClienteNombre(o.cliente).toLowerCase();
  //       const extras = this.formatClienteExtras(o.cliente).toLowerCase();
  //       return nombre.includes(t) || extras.includes(t) || String(o.cliente).includes(t);
  //     });
  //   }

  //   if (this.filtroCampo === 'vehiculo') {
  //     return todas.filter(o => {
  //       const main = this.formatVehiculoMain(o.vehiculo).toLowerCase();
  //       const sub = this.formatVehiculoSub(o.vehiculo).toLowerCase();
  //       return main.includes(t) || sub.includes(t) || String(o.vehiculo).includes(t);
  //     });
  //   }

  //   return todas.filter(o => this.formatFechaTurno(o.fecha_turno).toLowerCase().includes(t));
  // });

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  mostrarConfirmacionEliminarOrden = false;
  mostrarConfirmacionAnularOrden = false; // ✅ FALTA ESTO

  showNotice(text: string, type: NoticeType = 'error', ms = 3500) {
    this.notice = { type, text };
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => (this.notice = null), ms);
  }

  clearNotice() {
    this.notice = null;
    clearTimeout(this.noticeTimer);
  }

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
      error: (e) => {
        console.error('Error cargando órdenes', e),
          this.showNotice('Error al cargar las órdenes. Intentá nuevamente.', 'error');
      },
    });

    // 2) Cargar clientes/vehículos para formateo legible
    // Si ya los precargás globalmente en un layout/aside,
    // podrías eliminar estas llamadas.
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.clienteService.clientes.set(clientes),
      error: (e) => {
        console.error('Error cargando clientes', e),
          this.showNotice('Error al cargar los clientes. Intentá nuevamente.', 'error');
      },
    });

    this.vehiculoService.listarTodos().subscribe({
      next: (vehiculos) => this.vehiculoService.vehiculos.set(vehiculos),
      error: (e) => {
        console.error('Error cargando vehículos', e),
          this.showNotice('Error al cargar los vehículos. Intentá nuevamente.', 'error');
      },
    });

    this.tallerService.getTalleres().subscribe({
      next: (talleres) => this.tallerService.listaTalleres.set(talleres),
      error: (e) => {
        console.error('Error cargando talleres', e),
          this.showNotice('Error al cargar los talleres. Intentá nuevamente.', 'error');
      },
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
  // seleccionarOrden(o: OrdenDeTrabajo): void {
  //   this.cerrarDetalle();

  //   this.ordenSeleccionada = o;

  //   console.log('Orden seleccionada:', this.ordenSeleccionada);
  // }
  seleccionarOrden(o: OrdenDeTrabajo): void {
    // si clickeo la misma, no hagas nada
    if (this.ordenSeleccionada?.id === o.id) return;

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
      this.showNotice('Seleccioná una orden primero.', 'info');
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
  // irAEditarOrden(o: OrdenDeTrabajo): void {
  //   if (o.fecha_entrega) return; // por las dudas
  //   this.router.navigate(['/taller', 'ordenes', o.id, 'editar']);
  // }
  irAEditarOrden(o: OrdenDeTrabajo): void {
    if (!this.puedeEditar(o)) return;
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

    const d = new Date(fechaISO);

    return new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
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

  // ===== Regla: solo futuras =====
  esOrdenEliminable(o: OrdenDeTrabajo): boolean {
    if (!o?.fecha_turno) return false;
    return new Date(o.fecha_turno).getTime() > Date.now();
  }



  abrirConfirmacionEliminarOrden() {
    this.mostrarConfirmacionEliminarOrden = true;
  }

  cancelarEliminarOrden() {
    this.mostrarConfirmacionEliminarOrden = false;
  }

  eliminarOrden(o: OrdenDeTrabajo): void {
    if (!this.esOrdenEliminable(o)) {
      this.showNotice('Solo se pueden eliminar órdenes futuras.', 'info');
      return;
    }

    // ✅ Cerrar modal YA (así no queda pegado)
    this.mostrarConfirmacionEliminarOrden = false;

    const id = o.id;

    this.ordenService.deleteOrden(id).subscribe({
      next: () => {
        // 1) actualizar signal
        const nuevas = this.ordenesSig().filter(x => x.id !== id);
        this.ordenService.ordenes.set(nuevas);

        // 2) actualizar tabla si tu HTML usa ordenesFiltradas
        this.ordenesFiltradas = this.ordenesFiltradas.filter(x => x.id !== id);

        // 3) actualizar selección/detalle
        if (this.ordenSeleccionada?.id === id) {
          this.ordenSeleccionada = this.ordenesFiltradas[0] ?? null;
        }

        this.showNotice('Orden eliminada.', 'success');
      },
      error: (err) => {
        console.error('Error eliminando orden:', err);

        // ✅ también cerralo en error (por las dudas)
        this.mostrarConfirmacionEliminarOrden = false;

        this.showNotice('Error al eliminar la orden. Intentá nuevamente.', 'error');
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }

  puedeEditar(o: OrdenDeTrabajo): boolean {
    return o.estado_actual !== 'finalizada' && o.estado_actual !== 'anulada';
  }

  puedeAnular(o: OrdenDeTrabajo): boolean {
    return o.estado_actual === 'en_proceso';
  }

  puedeFinalizar(o: OrdenDeTrabajo): boolean {
    return o.estado_actual === 'en_proceso';
  }
  puedeEliminar(o: OrdenDeTrabajo): boolean {
    return o.estado_actual === 'pendiente' && this.esOrdenEliminable(o);
  }
  //FINALIZAR
  mostrarModalFinalizar = false;
  fechaEntregaInput = ''; // 'YYYY-MM-DD'

  abrirFinalizarOrden(o: OrdenDeTrabajo) {
    if (!this.puedeFinalizar(o)) {
      this.showNotice('Solo se puede finalizar una orden EN PROCESO.', 'info');
      return;
    }
    this.fechaEntregaInput = new Date().toISOString().slice(0, 10);
    this.mostrarModalFinalizar = true;
  }

  cancelarFinalizar() {
    this.mostrarModalFinalizar = false;
    this.fechaEntregaInput = '';
  }

  confirmarFinalizar(o: OrdenDeTrabajo) {
    if (!this.fechaEntregaInput) {
      this.showNotice('Ingresá una fecha de entrega.', 'info');
      return;
    }

    this.ordenService.finalizarOrden(o.id, this.fechaEntregaInput).subscribe({
      next: () => {
        // refresh
        this.ordenService.listarOrdenesDelTaller().subscribe({
          next: (ordenes) => {
            this.ordenService.ordenes.set(ordenes);
            this.ordenesFiltradas = [...ordenes];
            this.buscar();

            const misma = ordenes.find(x => x.id === o.id);
            this.ordenSeleccionada = misma ?? (this.ordenesFiltradas[0] ?? null);

            this.mostrarModalFinalizar = false;
            this.showNotice('Orden finalizada.', 'success');
          },
          error: () => {
            this.mostrarModalFinalizar = false;
            this.showNotice('Orden finalizada, pero falló el refresh.', 'info');
          }
        });
      },
      error: (err) => {
        console.error('Error finalizando orden:', err);
        const msg =
          err?.error?.detail ||
          err?.error?.fecha_entrega?.[0] ||
          err?.error?.non_field_errors?.[0] ||
          'Error al finalizar la orden. Intentá nuevamente.';
        this.showNotice(msg, 'error');
      }
    });
  }
  anularOrden(o: OrdenDeTrabajo): void {
    if (!this.puedeAnular(o)) {
      this.showNotice('Solo se puede anular una orden EN PROCESO.', 'info');
      return;
    }

    const id = o.id;
    const ANULADA: EstadoOrden = 'anulada';

    // cierro modal primero
    this.mostrarConfirmacionAnularOrden = false;

    // ===== UPDATE OPTIMISTA (instantáneo)
    // 1) signal
    const sigActualizadas: OrdenDeTrabajo[] = this.ordenesSig().map((x): OrdenDeTrabajo =>
      x.id === id ? { ...x, estado: ANULADA, estado_actual: ANULADA } : x
    );
    this.ordenService.ordenes.set(sigActualizadas);

    // 2) tabla (TU HTML USA ESTO)
    this.ordenesFiltradas = this.ordenesFiltradas.map((x): OrdenDeTrabajo =>
      x.id === id ? { ...x, estado: ANULADA, estado_actual: ANULADA } : x
    );

    // 3) detalle
    if (this.ordenSeleccionada?.id === id) {
      this.ordenSeleccionada = { ...this.ordenSeleccionada, estado: ANULADA, estado_actual: ANULADA };
    }

    // ===== llamada real al backend
    this.ordenService.anularOrden(id).subscribe({
      next: () => {
        // opcional: si querés refrescar después por consistencia
        // (pero NO hace falta para que se vea instantáneo)
        this.showNotice('Orden anulada.', 'success');
      },
      error: (err) => {
        console.error('Error anulando orden:', err);

        // rollback: traigo desde signal anterior del backend (o recargo)
        this.ordenService.listarOrdenesDelTaller().subscribe({
          next: (ordenes) => {
            this.ordenService.ordenes.set(ordenes);
            this.ordenesFiltradas = [...ordenes];
            // re-selección coherente
            this.ordenSeleccionada = ordenes.find(x => x.id === id) ?? null;
          }
        });

        const msg =
          err?.error?.detail ||
          err?.error?.non_field_errors?.[0] ||
          'Error al anular la orden. Intentá nuevamente.';
        this.showNotice(msg, 'error');
      }
    });
  }
  abrirConfirmacionAnularOrden() {
    this.mostrarConfirmacionAnularOrden = true;
  }

  cancelarAnularOrden() {
    this.mostrarConfirmacionAnularOrden = false;
  }

  etiquetaEstado(e: EstadoOrden): string {
    switch (e) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En proceso';
      case 'finalizada': return 'Finalizada';
      case 'anulada': return 'Anulada';
      default: return e;
    }
  }

}
