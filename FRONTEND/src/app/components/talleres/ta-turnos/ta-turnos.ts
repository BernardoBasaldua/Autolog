import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TurnoService } from '../../../services/turnos/turno.service';
import { Turno } from '../../../models/turnos/turno.model';

import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute} from '@angular/router';

type Vista = 'semana' | 'dia' | 'mes';
type EstadoOrden = 'pendiente' | 'en_proceso' | 'finalizada' | 'anulada';
// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

@Component({
  selector: 'app-ta-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-turnos.html',
  styleUrl: './ta-turnos.css',
})
export class TaTurnos implements OnInit {
  private router = inject(Router);
  private turnoService = inject(TurnoService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  
  // caches
  talleresById = new Map<number, any>();
  clientesById = new Map<number, any>();
  vehiculosById = new Map<number, any>();

  agendaId = 1;

  vista: Vista = 'semana';
  fechaBase = new Date();

  diasSemana: Date[] = [];
  diasMes: Date[] = [];
  horas: number[] = [];

  turnosAll: Turno[] = [];
  turnosVista: Turno[] = [];

  cargando = false;
  mesSeleccionado = new Date().getMonth();      // 0..11
  anioSeleccionado = new Date().getFullYear();  // 2026...
  anios: number[] = [];

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  tallerNombre(id: number | null | undefined): string {
    if (!id) return '-';
    const t = this.talleresById.get(Number(id));
    return t?.nombre ?? `Taller #${id}`;
  }

  clienteNombreApellido(id: number | null | undefined): string {
    if (!id) return '-';
    const c = this.clientesById.get(Number(id));
    if (!c) return `Cliente #${id}`;

    const first = c?.usuario?.first_name ?? '';
    const last = c?.usuario?.last_name ?? '';
    const full = `${first} ${last}`.trim();
    return full || `Cliente #${id}`;
  }

  vehiculoLabel(id: number | null | undefined): string {
    if (!id) return '-';
    const v = this.vehiculosById.get(Number(id));
    if (!v) return `Vehículo #${id}`;

    const marca = v?.marca?.nombre ?? '';
    const modelo = v?.modelo?.nombre ?? '';
    const dom = v?.dominio ?? '';
    const base = `${marca} ${modelo}`.trim();
    return dom ? `${base} (${dom})`.trim() : (base || `Vehículo #${id}`);
  }

  readonly mesesES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];
  // Español manual (sin locale de Angular)
  private diasCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  private diasLargos = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  private meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

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
    this.generarHoras(7, 18);
    this.refrescarVista();      // arma grilla ya
    this.cargarTurnosAgenda();  // trae turnos
    this.anios = Array.from({ length: 16 }, (_, i) => (new Date().getFullYear() - 5) + i); // -5..+10
    this.syncSelectoresConFechaBase();
  }
  syncSelectoresConFechaBase() {
  this.mesSeleccionado = this.fechaBase.getMonth();
  this.anioSeleccionado = this.fechaBase.getFullYear();
  }

  // salto rápido mes/año
  cambiarMesAnio() {
    // mantiene el día si existe; si no, JS ajusta solo
    const d = new Date(this.fechaBase);
    d.setFullYear(this.anioSeleccionado, this.mesSeleccionado, 1);
    this.fechaBase = d;
    this.refrescarVista();
  }

  // salto exacto por fecha (input type="date")
  irAFecha(value: string) {
    if (!value) return;
    // value viene YYYY-MM-DD
    const d = new Date(value + 'T00:00:00');
    this.fechaBase = d;
    this.syncSelectoresConFechaBase();
    this.refrescarVista();
  }
  irHoy(): void {
    this.fechaBase = new Date();
    this.syncSelectoresConFechaBase(); // si tenés mes/año
    this.refrescarVista();
  }
  // =========================
  // BACKEND
  // =========================
  // cargarTurnosAgenda(): void {
  //   this.cargando = true;
  //   this.turnoService.getTurnosAgenda(this.agendaId).subscribe({
  //     next: (all) => {
  //       this.turnosAll = all ?? [];
  //       this.cargando = false;
  //       this.refrescarVista();
  //     },
  //     error: (err) => {
  //       console.error('Error cargando turnos agenda', err);
  //       this.turnosAll = [];
  //       this.turnosVista = [];
  //       this.cargando = false;
  //     }
  //   });
  // }
  cargarTurnosAgenda(): void {
    this.cargando = true;

    forkJoin({
      turnos: this.turnoService.getTurnosAgenda(this.agendaId)
        .pipe(catchError((err) => { console.error(err); return of([] as Turno[]); })),

      talleres: this.http.get<any[]>('http://127.0.0.1:8000/api/talleres/')
        .pipe(catchError(() => of([]))),

      clientes: this.http.get<any[]>('http://127.0.0.1:8000/api/clientes/')
        .pipe(catchError(() => of([]))),

      vehiculos: this.http.get<any[]>('http://127.0.0.1:8000/api/vehiculo/')
        .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ turnos, talleres, clientes, vehiculos }) => {
        this.turnosAll = turnos ?? [];
        this.cargando = false;
        this.refrescarVista();

        // Maps
        this.talleresById = new Map<number, any>((talleres ?? []).map(t => [Number(t.id), t]));
        this.clientesById = new Map<number, any>((clientes ?? []).map(c => [Number(c.id), c]));
        this.vehiculosById = new Map<number, any>((vehiculos ?? []).map(v => [Number(v.id), v]));
      },
      error: (err) => {
        console.error('Error cargando todo', err);
        this.showNotice('Error al cargar turnos y datos relacionados. Intentá nuevamente.', 'error');
        this.turnosAll = [];
        this.turnosVista = [];
        this.cargando = false;
      }
    });
  }

  // =========================
  // VISTAS
  // =========================
  setVista(v: Vista) {
    this.vista = v;
    this.fechaBase = new Date();      // ir al actual
    this.syncSelectoresConFechaBase();
    this.refrescarVista();
  }

  anterior() {
    if (this.vista === 'semana') this.fechaBase = this.addDays(this.fechaBase, -7);
    if (this.vista === 'dia') this.fechaBase = this.addDays(this.fechaBase, -1);
    if (this.vista === 'mes') this.fechaBase = this.addMonths(this.fechaBase, -1);
    this.refrescarVista();
    this.syncSelectoresConFechaBase();
  }

  siguiente() {
    if (this.vista === 'semana') this.fechaBase = this.addDays(this.fechaBase, 7);
    if (this.vista === 'dia') this.fechaBase = this.addDays(this.fechaBase, 1);
    if (this.vista === 'mes') this.fechaBase = this.addMonths(this.fechaBase, 1);
    this.refrescarVista();
    this.syncSelectoresConFechaBase();
  }

  refrescarVista() {
    if (this.vista === 'semana') {
      this.diasSemana = this.buildSemana(this.fechaBase);
      const inicio = new Date(this.diasSemana[0]); inicio.setHours(0,0,0,0);
      const fin = new Date(this.diasSemana[6]); fin.setHours(23,59,59,999);
      this.turnosVista = this.filtrarPorRango(inicio, fin);
    }

    if (this.vista === 'dia') {
      const d = new Date(this.fechaBase); d.setHours(0,0,0,0);
      const inicio = new Date(d);
      const fin = new Date(d); fin.setHours(23,59,59,999);
      this.turnosVista = this.filtrarPorRango(inicio, fin);
    }

    if (this.vista === 'mes') {
      this.diasMes = this.buildMesGrid(this.fechaBase);
      const inicio = new Date(this.fechaBase.getFullYear(), this.fechaBase.getMonth(), 1, 0,0,0,0);
      const fin = new Date(this.fechaBase.getFullYear(), this.fechaBase.getMonth()+1, 0, 23,59,59,999);
      this.turnosVista = this.filtrarPorRango(inicio, fin);
    }
  }

  // =========================
  // FILTROS
  // =========================
  filtrarPorRango(inicio: Date, fin: Date): Turno[] {
    return (this.turnosAll || []).filter((t) => {
      const ft = new Date(t.fecha_turno);
      return ft >= inicio && ft <= fin;
    });
  }

  getTurnosCelda(dia: Date, hora: number): Turno[] {
    return (this.turnosVista || []).filter((t) => {
      const ft = new Date(t.fecha_turno);
      return (
        ft.getFullYear() === dia.getFullYear() &&
        ft.getMonth() === dia.getMonth() &&
        ft.getDate() === dia.getDate() &&
        ft.getHours() === hora
      );
    });
  }

  getTurnosDia(dia: Date): Turno[] {
    return (this.turnosVista || []).filter((t) => {
      const ft = new Date(t.fecha_turno);
      return (
        ft.getFullYear() === dia.getFullYear() &&
        ft.getMonth() === dia.getMonth() &&
        ft.getDate() === dia.getDate()
      );
    });
  }

  // =========================
  // BUILDERS CALENDARIO
  // =========================
  buildSemana(base: Date): Date[] {
    const d = new Date(base);
    const domingo = new Date(d);
    domingo.setDate(d.getDate() - d.getDay());
    domingo.setHours(0,0,0,0);

    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(domingo);
      x.setDate(domingo.getDate() + i);
      return x;
    });
  }

  buildMesGrid(base: Date): Date[] {
    const y = base.getFullYear();
    const m = base.getMonth();

    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // arranca domingo

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      d.setHours(0,0,0,0);
      return d;
    });
  }

  // generarHoras(desde: number, hasta: number): void {
  //   this.horas = [];
  //   for (let h = desde; h <= hasta; h++) this.horas.push(h);
  // }
  generarHoras(desde: number, hasta: number): void {
    this.horas = [];
    for (let h = desde; h <= hasta; h++) this.horas.push(h);
  }
  // =========================
  // FORMATEO ESPAÑOL (manual)
  // =========================
  tituloSemana(): string {
    if (!this.diasSemana.length) return '';
    return `${this.formatoDiaMes(this.diasSemana[0])} - ${this.formatoDiaMesAnio(this.diasSemana[6])}`;
  }

  tituloDia(): string {
    return this.formatoFullDate(this.fechaBase);
  }

  tituloMes(): string {
    const m = this.meses[this.fechaBase.getMonth()];
    return `${this.cap(m)} ${this.fechaBase.getFullYear()}`;
  }

  labelHeaderDia(d: Date): string {
    return `${this.diasCortos[d.getDay()]} ${d.getDate()}`;
  }

  formatoFullDate(d: Date): string {
    return `${this.cap(this.diasLargos[d.getDay()])}, ${d.getDate()} de ${this.meses[d.getMonth()]} de ${d.getFullYear()}`;
  }

  formatoDiaMes(d: Date): string {
    return `${d.getDate()} ${this.cap(this.meses[d.getMonth()].slice(0,3))}`;
  }

  formatoDiaMesAnio(d: Date): string {
    return `${d.getDate()} ${this.cap(this.meses[d.getMonth()].slice(0,3))} ${d.getFullYear()}`;
  }

  cap(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  labelHora(h: number): string {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr12 = ((h + 11) % 12) + 1;
    return `${hr12} ${ampm}`;
  }

  // =========================
  // UTILS
  // =========================
  esHoy(dia: Date): boolean {
    const hoy = new Date();
    return (
      dia.getFullYear() === hoy.getFullYear() &&
      dia.getMonth() === hoy.getMonth() &&
      dia.getDate() === hoy.getDate()
    );
  }

  esDelMesActual(dia: Date): boolean {
    return dia.getMonth() === this.fechaBase.getMonth() && dia.getFullYear() === this.fechaBase.getFullYear();
  }

  addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  addMonths(d: Date, months: number) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + months);
    return x;
  }

  // toYYYYMMDD(d: Date): string {
  //   return d.toISOString().split('T')[0];
  // }
  toYYYYMMDD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // =========================
  // NAVEGACIÓN
  // =========================
  abrirDetalleSlot(dia: Date, hora: number): void {
    const fechaStr = this.toYYYYMMDD(dia);
    this.router.navigate(['/taller', 'turnos', 'detalle', this.agendaId, fechaStr, hora]);
  }

  abrirDetalleTurno(turno: Turno): void {
    const ft = new Date(turno.fecha_turno);
    this.abrirDetalleSlot(ft, ft.getHours());
  }

  abrirDiaDesdeMes(dia: Date) {
    this.fechaBase = dia;
    this.vista = 'dia';
    this.refrescarVista();
  }
  abrirDiaDesdeSemana(dia: Date) {
    this.fechaBase = new Date(dia);
    this.vista = 'dia';
    this.syncSelectoresConFechaBase();
    this.refrescarVista();
  }
  // crearOrdenEnSlot(dia: Date, hora: number): void {
  //   const fecha = this.toYYYYMMDD(dia); // "YYYY-MM-DD"
  //   const hh = String(hora).padStart(2, '0') + ':00';

  //   this.router.navigate(['/taller', 'form-orden'], {
  //     queryParams: {
  //       fechaTurno: fecha,  // YYYY-MM-DD
  //       horaTurno: hh       // "HH:00"
  //     }
  //   });
  // }
  crearOrdenEnSlot(dia: Date, hora: number): void {
    const fecha = this.toYYYYMMDD(dia);                 // "YYYY-MM-DD"
    const hh = String(hora).padStart(2, '0') + ':00';   // "HH:00"

    const qp = this.route.snapshot.queryParamMap;
    const returnTo = qp.get('returnTo');

    if (returnTo) {
      // ✅ Volver al form (editar o crear) con fecha/hora elegidas
      this.router.navigateByUrl(
        this.router.createUrlTree([returnTo], {
          queryParams: { fechaTurno: fecha, horaTurno: hh },
          queryParamsHandling: 'merge',
        })
      );
      return;
    }

    // fallback
    this.router.navigate(['/taller', 'form-orden'], {
      queryParams: { fechaTurno: fecha, horaTurno: hh },
    });
  }

  modalDetalle = false;
  ordenSeleccionada: any | null = null;

  abrirDetalle(o: any) {
    this.ordenSeleccionada = o;
    this.modalDetalle = true;
  }

  cerrarDetalle() {
    this.modalDetalle = false;
    this.ordenSeleccionada = null;
  }

  // ===== Regla: solo futuras =====
  esOrdenEliminable(o: any): boolean {
    if (!o?.fecha_turno) return false;
    return new Date(o.fecha_turno).getTime() > Date.now();
  }

  // No se usa
  eliminarOrden(o: any): void {
    if (!this.esOrdenEliminable(o)) {
      this.showNotice('Solo se pueden eliminar órdenes futuras.', 'error');
      return;
    }

    const ok = confirm(`¿Eliminar la orden #ORD-${o.id}?`);
    if (!ok) return;

    this.cargando = true;

    // IMPORTANTE: usá el método correcto del service para taller (deleteOrden / deleteTurno)
    this.turnoService.deleteTurno(o.id).subscribe({
      next: () => {
        // ✅ remover de la lista global
        this.turnosAll = (this.turnosAll || []).filter(t => t.id !== o.id);

        // ✅ recalcular semana/día/mes
        this.refrescarVista();

        // ✅ cerrar modal si estaba abierto con esa orden
        if (this.ordenSeleccionada?.id === o.id) {
          this.cerrarDetalle();
        }

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error eliminando orden:', err);
        this.cargando = false;
        this.showNotice(err?.error?.detail ?? 'No se pudo eliminar la orden. Intentá nuevamente.', 'error');
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }

  getEstado(o: any): EstadoOrden | null {
    return (o?.estado_actual ?? o?.estado ?? null) as EstadoOrden | null;
  }

  etiquetaEstado(e: EstadoOrden | null): string {
    switch (e) {
      case 'pendiente': return 'Pendiente';
      case 'en_proceso': return 'En proceso';
      case 'finalizada': return 'Finalizada';
      case 'anulada': return 'Anulada';
      default: return '-';
    }
  }

}