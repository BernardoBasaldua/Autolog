import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { ClienteModel } from '../../../models/usuarios/usuario.model';

import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { OrdenDeTrabajo, OrdenDeTrabajoCreatePayload } from '../../../models/orden/orden.models';
import { OrdenService } from '../../../services/ordenes/orden.service';
import { TalleresService } from '../../../services/talleres/talleres.service';

// Si ya creaste el modelo:
// import { TipoMantenimiento, OrdenDeTrabajoCreatePayload } from '../../../../models/ordenes/orden-de-trabajo.model';
// Si ya creaste el service:
// import { OrdenDeTrabajoService } from '../../../../services/ordenes/orden-de-trabajo.service';

// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

@Component({
  selector: 'app-form-ornden',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-ordenes.html',
  styleUrl: './form-ordenes.css',
})

export class FormOrdenes {
  private router = inject(Router);
  private clienteService = inject(ClienteService);
  private vehiculoService = inject(VehiculoService);
  private ordenService = inject(OrdenService);
  private tallerService = inject(TalleresService);
  private route = inject(ActivatedRoute);

  private prefillClienteId: number | null = null;
  private prefillVehiculoId: number | null = null;
  private prefillFechaTurno: string | null = null; // "YYYY-MM-DD"
  private prefillHoraTurno: string | null = null;  // "HH:00"
  private fechaHoraVieneDeAgenda = false;
  modo: 'crear' | 'editar' = 'crear';
  ordenId: number | null = null;
  cargandoOrden = false;

  private fechaTurnoOriginalISO: string | null = null;
  private fechaTurnoFueModificada = false;

  esteTaller = this.tallerService.tallerActual;
  esteTallerId = this.esteTaller()?.id;

  // ✅ Guardamos la referencia al SIGNAL
  clientesSig = this.clienteService.clientes;
  vehiculosSig = this.vehiculoService.vehiculos;

  // =========================
  // CONFIG UX
  // =========================
  bloquearVehiculoPorCliente = false;

  // Esto lo usamos para saber si el cliente fue asignado
  // automáticamente por elegir un vehículo.
  clienteAutoPorVehiculo = false;

  // =========================
  // STATE AUTOCOMPLETE
  // =========================
  clienteQuery = '';
  vehiculoQuery = '';

  mostrarDropdownClientes = false;
  mostrarDropdownVehiculos = false;

  clientesFiltrados: ClienteModel[] = [];
  vehiculosFiltrados: Vehiculo[] = [];

  clienteSeleccionado: ClienteModel | null = null;
  vehiculoSeleccionado: Vehiculo | null = null;

  // =========================
  // RESTO DEL FORM (ALINEADO AL MODELO DJANGO)
  // =========================
  fechaTurno = '';  // yyyy-mm-dd
  horaTurno: string = '';
  horariosBase: string[] = [];
  horariosDisponibles: string[] = [];
  fechaEntrega: string | null = null;
  
  // TENGO QUE SEGUIR TRABAJANDO EN ESTO PARA QUE SE ALINEE CON TU MODELO DJANGO, PERO LO DEJO ASÍ PARA PODER PROBAR LA CREACIÓN DE ORDENES DESDE EL FRONTEND ANTES DE TENER TODO DEFINIDO EN BACKEND
  // // Agenda / Taller
  // agendaId!: number; // <- IMPORTANT: necesitás este id (o lo buscás por taller)
  
  // // Si querés usar capacidad de agenda (opcional)
  // turnosMaximosPorHora = 1;

  kilometraje: number | null = null;

  observacionesTecnicas: string | null = null;

  // En tu modelo: 'preventivo' | 'correctivo'
  mantenimiento: 'preventivo' | 'correctivo' = 'preventivo';

  // UI placeholders (aún no mapeados a FK reales)
  responsableTecnicoTexto: string = '';
  practicaTexto = '';

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  private hoyLocalYYYYMMDD(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

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
    // 0) Leo params (query y opcional param)
    this.initPrefillFromRoute();

    // ✅ detectar edición
    const idParam = this.route.snapshot.paramMap.get('id');
    this.ordenId = idParam ? Number(idParam) : null;
    this.modo = this.ordenId ? 'editar' : 'crear';

    // ✅ cuando vuelvo desde /taller/turnos con ?fechaTurno&horaTurno
    // this.route.queryParamMap.subscribe(qp => {
    //   const fechaQP = qp.get('fechaTurno'); // "YYYY-MM-DD"
    //   const horaQP  = qp.get('horaTurno');  // "HH:mm"

    //   // si vuelve de la agenda, actualizo el form en vivo
    //   if (fechaQP && /^\d{4}-\d{2}-\d{2}$/.test(fechaQP)) {
    //     this.fechaTurno = fechaQP;
    //   }
    //   if (horaQP && /^\d{2}:\d{2}$/.test(horaQP)) {
    //     this.horaTurno = horaQP;
    //   }
    // });
   this.route.queryParamMap.subscribe(qp => {
      const fechaQP = qp.get('fechaTurno');
      const horaQP  = qp.get('horaTurno');

      // si vuelvo desde la agenda, actualizo
      if (fechaQP && /^\d{4}-\d{2}-\d{2}$/.test(fechaQP)) {
        this.fechaTurno = fechaQP;
        this.fechaHoraVieneDeAgenda = true;
      }
      if (horaQP && /^\d{2}:\d{2}$/.test(horaQP)) {
        this.horaTurno = horaQP;
        this.fechaHoraVieneDeAgenda = true;
      }
    });

    // ✅ si es editar, cargar orden y prellenar
    if (this.ordenId) {
      this.cargandoOrden = true;
      this.ordenService.obtenerOrden(this.ordenId).subscribe({
        next: (o: OrdenDeTrabajo) => {
          this.fechaTurnoOriginalISO = o.fecha_turno ?? null;
          this.fechaTurnoFueModificada = false;
          this.cargandoOrden = false;
          // Prellenar fecha/hora desde fecha_turno (solo si NO viene de agenda)
          if (o.fecha_turno && !this.fechaHoraVieneDeAgenda) {
            const fecha = this.extraerFechaAR_YYYYMMDD(o.fecha_turno);
            const hhmm  = this.extraerHoraAR(o.fecha_turno);

            this.fechaTurno = fecha ?? '';
            this.horaTurno  = hhmm ?? '';
          }
          // si ya fue entregada, no se edita (igual el back lo bloquea)
          if (o.fecha_entrega) {
            this.showNotice('Esta orden ya tiene fecha de entrega. No se puede editar.', 'info', 5000); 
            this.router.navigate(['/taller', 'ordenes']);
            return;
          }

          // Prellenar campos simples
          this.fechaEntrega = o.fecha_entrega;
          this.kilometraje = o.kilometraje ?? 0;
          this.observacionesTecnicas = o.observaciones_tecnicas ?? null;
          this.mantenimiento = o.mantenimiento ?? 'preventivo';
          this.responsableTecnicoTexto = o.responsable_tecnico ?? '';

          // Prellenar fecha/hora desde fecha_turno
           // "2026-02-26T16:00:00-03:00"
          // if (o.fecha_turno) {
           
          //   this.fechaTurno = o.fecha_turno.slice(0, 10);
          //   this.horaTurno = o.fecha_turno.slice(11, 16);
          // }

          // Prefill IDs para que tu tryApplyPrefill seleccione cliente/vehiculo
          this.prefillClienteId = o.cliente ?? null;
          this.prefillVehiculoId = o.vehiculo ?? null;

          // Intentar aplicar si ya están cargadas las listas
          this.tryApplyPrefill();
        },
        error: (e) => {
          this.cargandoOrden = false;
          console.error('Error cargando orden', e);
          this.showNotice('No se pudo cargar la orden para editar.', 'error', 5000);
          this.router.navigate(['/taller', 'ordenes']);
        }
      });
    }

    // 1) Clientes
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => {
        this.clienteService.clientes.set(clientes);
        this.clientesFiltrados = [...this.clientesSig()];
        this.tryApplyPrefill();
      },
    });

    // 2) Vehículos
    this.vehiculoService.listarTodos().subscribe({
      next: (vehiculos) => {
        this.vehiculoService.vehiculos.set(vehiculos);
        this.vehiculosFiltrados = [...this.vehiculosSig()];
        this.tryApplyPrefill();
      },
    });

    // 3) Defaults (respetando prefill si no es editar)
    if (!this.ordenId) {
      this.fechaTurno = this.prefillFechaTurno ?? this.hoyLocalYYYYMMDD();
      this.horaTurno = this.prefillHoraTurno ?? '';
    }

    this.generarHorarios();
  }


  get esEdicion(): boolean {
    return this.modo === 'editar' && !!this.ordenId;
  }
  // generarHorarios() {
  //   for (let h = 7; h <= 18; h++) {
  //     const horaFormateada = (h < 10 ? '0' + h : h) + ':00';
  //     this.horariosDisponibles.push(horaFormateada);
  //   }
  // }
  generarHorarios() {
    this.horariosDisponibles = [];
    for (let h = 7; h <= 18; h++) {
      this.horariosDisponibles.push(String(h).padStart(2, '0') + ':00');
    }
  }
  onFechaHoraChange() {
    if (!this.esEdicion) return;
    this.fechaTurnoFueModificada = true;
  }
  private extraerFechaAR_YYYYMMDD(fechaISO: string): string | null {
    if (!fechaISO) return null;

    const d = new Date(fechaISO);

    // AR timezone y devuelve yyyy-mm-dd
    const parts = new Intl.DateTimeFormat('en-CA', { // en-CA => YYYY-MM-DD
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);

    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    if (!y || !m || !day) return null;
    return `${y}-${m}-${day}`;
  }
  // TENGO QUE SEGUIR TRABAJANDO EN ESTO PARA QUE SE ALINEE CON TU MODELO DJANGO, PERO LO DEJO ASÍ PARA PODER PROBAR LA CREACIÓN DE ORDENES DESDE EL FRONTEND ANTES DE TENER TODO DEFINIDO EN BACKEND
  // private generarHorariosBase() {
  //   this.horariosBase = [];
  //   for (let h = 8; h <= 18; h++) {
  //     this.horariosBase.push(`${String(h).padStart(2, '0')}:00`);
  //   }
  // }

  // onFechaTurnoChange() {
  //   this.horaTurno = '';
  //   this.refrescarHorariosDisponibles();
  // }

  // private refrescarHorariosDisponibles(): void {
  //   // fallback si todavía no tenés agendaId
  //   if (!this.agendaId || !this.fechaTurno) {
  //     this.horariosDisponibles = [...this.horariosBase];
  //     return;
  //   }

  //   this.ordenService
  //     .obtenerTurnosAsignadosPorAgendaYFecha(this.agendaId, this.fechaTurno)
  //     .subscribe({
  //       next: (ordenes: OrdenDeTrabajo[]) => {
  //         // ✅ contar por "HH:mm" (en horario AR) SOLO para ese día
  //         const conteoPorHora = new Map<string, number>();

  //         for (const o of ordenes ?? []) {
  //           const hhmm = this.extraerHoraAR(o.fecha_turno as any); // ajustá tipo si hace falta
  //           if (!hhmm) continue;
  //           conteoPorHora.set(hhmm, (conteoPorHora.get(hhmm) ?? 0) + 1);
  //         }

  //         // ✅ filtrar: NO mostrar la hora si ya alcanzó el cupo
  //         this.horariosDisponibles = this.horariosBase.filter((h) => {
  //           const ocupados = conteoPorHora.get(h) ?? 0;
  //           return ocupados < this.turnosMaximosPorHora;
  //         });

  //         // si lo que estaba seleccionado ahora está ocupado, lo limpio
  //         if (this.horaTurno) {
  //           const ocupados = conteoPorHora.get(this.horaTurno) ?? 0;
  //           if (ocupados >= this.turnosMaximosPorHora) {
  //             this.horaTurno = '';
  //           }
  //         }
  //       },
  //       error: (e) => {
  //         console.error('Error cargando turnos asignados', e);
  //         // fallback (o podés bloquear el select)
  //         this.horariosDisponibles = [...this.horariosBase];
  //       },
  //     });
  // }

  // private refrescarHorariosDisponibles() {
  //   const tallerId = this.esteTallerId;
  //   const fecha = this.fechaTurno;

  //   if (!tallerId || !fecha) {
  //     this.horariosDisponibles = [...this.horariosBase];
  //     return;
  //   }

  //   this.ordenService.obtenerOrdenesPorTallerYFecha(tallerId, fecha).subscribe({
  //     next: (ordenes) => {
  //       // armo set de horas ocupadas en formato "HH:mm" en horario AR
  //       const ocupadas = new Set<string>(
  //         (ordenes ?? [])
  //           .map((o: any) => this.extraerHoraAR(o.fecha_turno))
  //           .filter((h: string | null): h is string => !!h)
  //       );

  //       this.horariosDisponibles = this.horariosBase.filter(h => !ocupadas.has(h));

  //       // si la hora elegida quedó ocupada (por ejemplo, otro usuario reservó)
  //       if (this.horaTurno && ocupadas.has(this.horaTurno)) {
  //         this.horaTurno = '';
  //       }
  //     },
  //     error: (e) => {
  //       console.error('Error cargando horarios ocupados', e);
  //       // fallback: muestro todos (o podrías bloquear)
  //       this.horariosDisponibles = [...this.horariosBase];
  //     }
  //   });
  // }

    private extraerHoraAR(fechaISO: string): string | null {
    if (!fechaISO) return null;

    const d = new Date(fechaISO);

    // Fuerzo AR y saco "HH:mm"
    const parts = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const hh = parts.find(p => p.type === 'hour')?.value;
    const mm = parts.find(p => p.type === 'minute')?.value;

    if (!hh || !mm) return null;
    return `${hh}:${mm}`;
  }

  // =========================
  // TABS
  // =========================
  verOrdenesTrabajo() {
    this.router.navigate(['/taller', 'ordenes']);
  }

  crearNuevaOrden() {
    this.router.navigate(['/taller', 'form-orden']);
  }

  // =========================
  // NAVEGACIÓN A ALTAS
  // =========================
  nuevoCliente(): void {
    this.router.navigate(['/taller/form-cliente'], {
      queryParams: { modo: 'alta-desde-taller-ORD' },
    });
  }

  nuevoVehiculo(): void {
    this.router.navigate(['/taller/form-vehiculo'], {
      queryParams: {
        modo: 'alta-desde-taller',
        propietarioId: this.clienteSeleccionado?.id,
        lockPropietario: 1,
        returnTo: '/taller/ordenes/nueva',
      },
    });
  }

  // =========================
  // CLIENTE AUTOCOMPLETE
  // =========================
  abrirDropdownClientes() {
    if (this.esEdicion) return;
    this.mostrarDropdownClientes = true;
    this.filtrarClientes();
  }

  onClienteQueryChange() {
    //if (this.esEdicion) return;
    this.mostrarDropdownClientes = true;
    this.filtrarClientes();

    if (!this.clienteQuery.trim()) {
      //this.clienteSeleccionado = null;
      this.clienteAutoPorVehiculo = false;
      this.vehiculosFiltrados = [...this.vehiculosSig()];
    }
  }

  seleccionarCliente(c: ClienteModel) {
    //if (this.esEdicion) return;

    const vehiculos = this.vehiculosSig();
    this.clienteAutoPorVehiculo = false;

    this.clienteSeleccionado = c;
    this.clienteQuery = this.formatCliente(c);
    this.mostrarDropdownClientes = false;

    this.vehiculosFiltrados = vehiculos.filter((v) => v.propietario === c.id);
    this.vehiculoSeleccionado = null;
    this.vehiculoQuery = '';
  }


  // abrirDropdownClientes() {
  //   this.mostrarDropdownClientes = true;
  //   this.filtrarClientes();
  // }

  cerrarDropdownClientesConDelay() {
    setTimeout(() => (this.mostrarDropdownClientes = false), 120);
  }

  // onClienteQueryChange() {
  //   this.mostrarDropdownClientes = true;
  //   this.filtrarClientes();

  //   // Si el usuario borra manualmente el texto del cliente,
  //   // interpretamos que quiere liberar filtros.
  //   if (!this.clienteQuery.trim()) {
  //     this.clienteSeleccionado = null;
  //     this.clienteAutoPorVehiculo = false;

  //     // Si no hay cliente, recupero lista global de vehículos
  //     this.vehiculosFiltrados = [...this.vehiculosSig()];
  //   }
  // }

  filtrarClientes() {
    const clientes = this.clientesSig();
    const t = this.clienteQuery.trim().toLowerCase();

    if (!t) {
      this.clientesFiltrados = [...clientes];
      return;
    }

    this.clientesFiltrados = clientes.filter((c) => {
      const nombre = `${c.usuario?.first_name ?? ''} ${c.usuario?.last_name ?? ''}`.toLowerCase();
      const tel = (c.usuario?.telefono ?? '').toLowerCase();
      const email = (c.usuario?.email ?? '').toLowerCase();
      return nombre.includes(t) || tel.includes(t) || email.includes(t);
    });
  }

  // seleccionarCliente(c: ClienteModel) {
  //   const vehiculos = this.vehiculosSig();

  //   this.clienteAutoPorVehiculo = false; // cliente elegido manualmente

  //   this.clienteSeleccionado = c;
  //   this.clienteQuery = this.formatCliente(c);
  //   this.mostrarDropdownClientes = false;

  //   // ✅ REGLA 1:
  //   // al elegir cliente, muestro solo vehículos de ese cliente
  //   this.vehiculosFiltrados = vehiculos.filter((v) => v.propietario === c.id);

  //   // limpio vehículo actual para no dejar inconsistencia
  //   this.vehiculoSeleccionado = null;
  //   this.vehiculoQuery = '';
  // }

  // =========================
  // VEHICULO AUTOCOMPLETE
  // =========================
  abrirDropdownVehiculos() {
    //if (this.esEdicion) return;
    this.mostrarDropdownVehiculos = true;
    this.filtrarVehiculos();
  }

  onVehiculoQueryChange() {
    //if (this.esEdicion) return;

    const texto = this.vehiculoQuery.trim();
    if (!texto) {
      this.vehiculoSeleccionado = null;

      if (this.clienteAutoPorVehiculo) {
        this.clienteSeleccionado = null;
        this.clienteQuery = '';
        this.clienteAutoPorVehiculo = false;
        this.vehiculosFiltrados = [...this.vehiculosSig()];
      } else {
        this.vehiculosFiltrados = this.clienteSeleccionado
          ? this.vehiculosSig().filter((v) => v.propietario === this.clienteSeleccionado!.id)
          : [...this.vehiculosSig()];
      }

      this.mostrarDropdownVehiculos = true;
      return;
    }

    this.mostrarDropdownVehiculos = true;
    this.filtrarVehiculos();
  }

  seleccionarVehiculo(v: Vehiculo) {
   // if (this.esEdicion) return;

    const clientes = this.clientesSig();
    const vehiculos = this.vehiculosSig();

    this.vehiculoSeleccionado = v;
    this.vehiculoQuery = this.formatVehiculo(v);
    this.mostrarDropdownVehiculos = false;

    const dueño = clientes.find((c) => c.id === v.propietario) ?? null;
    if (dueño) {
      this.clienteAutoPorVehiculo = true;
      this.clienteSeleccionado = dueño;
      this.clienteQuery = this.formatCliente(dueño);
      this.vehiculosFiltrados = vehiculos.filter((x) => x.propietario === dueño.id);
    }
  }


  // abrirDropdownVehiculos() {
  //   this.mostrarDropdownVehiculos = true;
  //   this.filtrarVehiculos();
  // }

  cerrarDropdownVehiculosConDelay() {
    setTimeout(() => (this.mostrarDropdownVehiculos = false), 120);
  }

  // onVehiculoQueryChange() {
  //   const texto = this.vehiculoQuery.trim();

  //   // ✅ Si borra el vehículo escrito:
  //   if (!texto) {
  //     this.vehiculoSeleccionado = null;

  //     // Si el cliente estaba auto-asignado por vehículo,
  //     // lo limpiamos para volver a lista global
  //     if (this.clienteAutoPorVehiculo) {
  //       this.clienteSeleccionado = null;
  //       this.clienteQuery = '';
  //       this.clienteAutoPorVehiculo = false;

  //       this.vehiculosFiltrados = [...this.vehiculosSig()];
  //     } else {
  //       // Si el cliente fue elegido manualmente,
  //       // mantenemos la restricción por cliente
  //       this.vehiculosFiltrados = this.clienteSeleccionado
  //         ? this.vehiculosSig().filter((v) => v.propietario === this.clienteSeleccionado!.id)
  //         : [...this.vehiculosSig()];
  //     }

  //     this.mostrarDropdownVehiculos = true;
  //     return;
  //   }

  //   this.mostrarDropdownVehiculos = true;
  //   this.filtrarVehiculos();
  // }

  filtrarVehiculos() {
    const vehiculos = this.vehiculosSig();
    const t = this.vehiculoQuery.trim().toLowerCase();

    const base = this.clienteSeleccionado
      ? vehiculos.filter((v) => v.propietario === this.clienteSeleccionado!.id)
      : vehiculos;

    if (!t) {
      this.vehiculosFiltrados = [...base];
      return;
    }

    this.vehiculosFiltrados = base.filter((v) => {
      const marca = (v.marca?.nombre ?? '').toLowerCase();
      const modelo = (v.modelo?.nombre ?? '').toLowerCase();
      const dom = (v.dominio ?? '').toLowerCase();
      return marca.includes(t) || modelo.includes(t) || dom.includes(t);
    });
  }

  // seleccionarVehiculo(v: Vehiculo) {
  //   const clientes = this.clientesSig();
  //   const vehiculos = this.vehiculosSig();

  //   this.vehiculoSeleccionado = v;
  //   this.vehiculoQuery = this.formatVehiculo(v);
  //   this.mostrarDropdownVehiculos = false;

  //   // ✅ REGLA 2:
  //   // si elijo vehículo primero => autoselecciono dueño
  //   const dueño = clientes.find((c) => c.id === v.propietario) ?? null;

  //   if (dueño) {
  //     this.clienteAutoPorVehiculo = true;
  //     this.clienteSeleccionado = dueño;
  //     this.clienteQuery = this.formatCliente(dueño);

  //     // actualizo lista de vehículos del dueño
  //     this.vehiculosFiltrados = vehiculos.filter((x) => x.propietario === dueño.id);
  //   }
  // }

  // =========================
  // ACCIONES DE ORDEN
  // =========================

  // verAgenda(): void {
  //   this.router.navigate(['/taller', 'turnos']);
  // }
  verAgenda(): void {
    const returnTo = this.esEdicion
      ? `/taller/ordenes/${this.ordenId}/editar`
      : `/taller/form-orden`;

    this.router.navigate(['/taller', 'turnos'], {
      queryParams: {
        returnTo,
        ordenId: this.ordenId ?? null,
        // opcional: mando lo actual para que la agenda lo seleccione/muestre
        fechaTurno: this.fechaTurno || null,
        horaTurno: this.horaTurno || null,
      },
      queryParamsHandling: 'merge',
    });
  }
//   verAgenda(): void {
//   this.router.navigate(['/taller', 'turnos'], {
//     queryParams: {
//       fechaTurno: this.fechaTurno || null,
//       horaTurno: this.horaTurno || null,
//     },
//     queryParamsHandling: 'merge',
//   });
// }

  cancelarOrden(): void {
    // UX simple: limpiar todo
    this.resetFormularioOrden();
    this.router.navigate(['/taller', 'ordenes']);
  }

  // errorHora = false;

  // validarHora() {
  //   if (!this.horaTurno) return;

  //   if (this.horaTurno < '08:00' || this.horaTurno > '18:00') {
  //     this.errorHora = true;
  //   } else {
  //     this.errorHora = false;
  //   }
  // }

  confirmarOrden(): void {
    // 1) Validaciones mínimas de front
    if (!this.clienteSeleccionado || !this.vehiculoSeleccionado) {
      this.showNotice('Seleccioná un cliente y un vehículo.', 'error', 4000);
      return;
    }

    const fechaTurnoISO = this.buildFechaTurnoISO();
    if (!fechaTurnoISO) {
      this.showNotice('Completá fecha y hora del turno.', 'error', 4000);
      return;
    }

    // if (this.errorHora) {
    //   alert('La hora del turno debe ser entre 08:00 y 18:00.');
    //   return;
    // }

    // 2) Payload alineado a tu modelo Django
    // const payload: OrdenDeTrabajoCreatePayload = {
    //   taller: this.esteTallerId,
    //   fecha_turno: fechaTurnoISO,
    //   fecha_entrega: this.fechaEntrega,
    //   kilometraje: this.kilometraje ?? 0,
    //   observaciones_tecnicas: this.observacionesTecnicas,
    //   mantenimiento: this.mantenimiento,
    //   cliente: this.clienteSeleccionado.id,
    //   vehiculo: this.vehiculoSeleccionado.id,
    //   responsable_tecnico: this.responsableTecnicoTexto?.trim() || null,
    //   // agenda, tecnico, taller cuando los tengas implementados
    // };
    const payload: any = {
      taller: this.esteTallerId,
      fecha_turno: fechaTurnoISO,
      fecha_entrega: this.fechaEntrega,
      kilometraje: this.kilometraje ?? 0,
      observaciones_tecnicas: this.observacionesTecnicas,
      mantenimiento: this.mantenimiento,
      responsable_tecnico: this.responsableTecnicoTexto?.trim() || null,
    };

    if (!this.esEdicion) {
      payload.cliente = this.clienteSeleccionado.id;
      payload.vehiculo = this.vehiculoSeleccionado.id;
    }

    const req$ = this.esEdicion
      ? this.ordenService.editarOrden(this.ordenId!, payload)
      : this.ordenService.crearOrden(payload);

    req$.subscribe({
      next: () => {
        this.showNotice(this.esEdicion ? 'Orden editada correctamente ✔' : 'Orden creada correctamente ✔', 'success', 3000);
        this.router.navigate(['/taller', 'ordenes']);
      },
      error: (e) => {
        console.error('Error en orden', e);
        this.showNotice(this.esEdicion ? 'No se pudo editar la orden. Revisa los datos ingresados.' : 'No se pudo crear la orden. Revisa los datos ingresados.', 'error', 5000);
        // dejá tu manejo de error actual
      }
    });

    // 3) Llamada real al servicio
    // this.ordenService.crearOrden(payload).subscribe({
    //   next: (ordenCreada) => {
    //     alert('Orden creada correctamente ✔');
    //     this.router.navigate(['/taller', 'ordenes']);
    //   },
    //   error: (e) => {
    //     console.error('Error creando orden RAW:', e);

    //     const status = e?.status;
    //     const data = e?.error;

    //     const lines: string[] = [];

    //     if (status === 0) {
    //       lines.push('No hay conexión con el backend (CORS / servidor caído).');
    //     } else if (typeof data === 'string') {
    //       lines.push(data);
    //     } else if (data?.detail) {
    //       lines.push(String(data.detail));
    //     } else if (data && typeof data === 'object') {
    //       for (const [k, v] of Object.entries(data)) {
    //         if (Array.isArray(v)) {
    //           v.forEach(msg => lines.push(`${k}: ${msg}`));
    //         } else if (v != null) {
    //           lines.push(`${k}: ${String(v)}`);
    //         }
    //       }
    //     }

    //     if (!lines.length) {
    //       lines.push('El backend no envió detalle del error. Mirá Network/Response.');
    //     }

    //     alert(`No se pudo crear la orden.\n\n${lines.join('\n')}`);
    //   }
    // });

    // console.log('Confirmar orden (payload pendiente de conectar a service)');
  }

  private buildFechaTurnoISO(): string | null {
    const f = (this.fechaTurno ?? '').trim();
    const h = (this.horaTurno ?? '').trim();

    if (!f || !h) return null;

    // Turno como hora local Argentina (sin convertir a UTC)
    return `${f}T${h}:00-03:00`;
  }

  private resetFormularioOrden(): void {
    // Limpio selección y texto
    this.clienteSeleccionado = null;
    this.vehiculoSeleccionado = null;
    this.clienteAutoPorVehiculo = false;

    this.clienteQuery = '';
    this.vehiculoQuery = '';

    // Restauro listas completas
    this.clientesFiltrados = [...this.clientesSig()];
    this.vehiculosFiltrados = [...this.vehiculosSig()];

    // Campos del resto del form
    //const hoy = new Date();
    //this.fechaTurno = hoy.toISOString().slice(0, 10);
    this.fechaTurno = this.hoyLocalYYYYMMDD();
    this.horaTurno = '10:00';

    this.fechaEntrega = null;
    this.kilometraje = null;
    this.observacionesTecnicas = null;
    this.mantenimiento = 'preventivo';

    this.responsableTecnicoTexto = '';
    this.practicaTexto = '';
  }

  // =========================
  // FORMATTERS
  // =========================
  formatCliente(c: ClienteModel): string {
    const nombre = `${c.usuario?.first_name ?? ''} ${c.usuario?.last_name ?? ''}`.trim();
    const telefono = c.usuario?.telefono ?? '';

    return [nombre, telefono].filter(Boolean).join(' - ') || `Cliente ${c.id}`;
  }

  formatVehiculo(v: Vehiculo): string {
    const marca = v.marca?.nombre ?? '';
    const modelo = v.modelo?.nombre ?? '';
    const mm = `${marca} ${modelo}`.trim();
    const dom = v.dominio ? ` - ${v.dominio}` : '';
    return `${mm}${dom}`.trim() || `Vehículo ${v.id}`;
  }
  // =========================
  // Parametro url
  // =========================
  private initPrefillFromRoute(): void {
    // Query params
    const qp = this.route.snapshot.queryParamMap;

    const clienteQ = qp.get('clienteId');
    const vehiculoQ = qp.get('vehiculoId');

    // (Opcional) también soportar params de ruta si algún día usás /form-orden/:clienteId
    const rp = this.route.snapshot.paramMap;
    const clienteR = rp.get('clienteId');
    const vehiculoR = rp.get('vehiculoId');

    const clienteIdStr = clienteQ ?? clienteR;
    const vehiculoIdStr = vehiculoQ ?? vehiculoR;

    this.prefillClienteId = clienteIdStr ? Number(clienteIdStr) : null;
    this.prefillVehiculoId = vehiculoIdStr ? Number(vehiculoIdStr) : null;

    // Sanitización básica
    if (this.prefillClienteId && Number.isNaN(this.prefillClienteId)) {
      this.prefillClienteId = null;
    }
    if (this.prefillVehiculoId && Number.isNaN(this.prefillVehiculoId)) {
      this.prefillVehiculoId = null;
    }

    // ✅ NUEVO: fecha/hora desde TaTurnos
    const fechaQP = qp.get('fechaTurno'); // "YYYY-MM-DD"
    const horaQP  = qp.get('horaTurno');  // "HH:00"

    this.prefillFechaTurno = fechaQP;
    this.prefillHoraTurno = horaQP;

    // Validación mínima (para no meter basura)
    if (this.prefillFechaTurno && !/^\d{4}-\d{2}-\d{2}$/.test(this.prefillFechaTurno)) {
      this.prefillFechaTurno = null;
    }
    if (this.prefillHoraTurno && !/^\d{2}:\d{2}$/.test(this.prefillHoraTurno)) {
      this.prefillHoraTurno = null;
    }
    if (this.prefillHoraTurno) {
      const hh = Number(this.prefillHoraTurno.split(':')[0]);
    if (Number.isNaN(hh) || hh < 7 || hh > 18) this.prefillHoraTurno = null;
}
  }

  private tryApplyPrefill(): void {
    // Si no hay nada que precargar, salgo
    if (!this.prefillClienteId && !this.prefillVehiculoId) return;

    // Necesito tener cargadas las listas
    const clientes = this.clientesSig();
    const vehiculos = this.vehiculosSig();

    if (!clientes.length || !vehiculos.length) return;

    // ✅ Prioridad: vehículo (porque autoselecciona cliente)
    if (this.prefillVehiculoId) {
      const v = vehiculos.find(x => x.id === this.prefillVehiculoId);
      if (v) {
        this.seleccionarVehiculo(v);
      }
      // consumimos el prefill para que no re-ejecute
      this.prefillVehiculoId = null;
      this.prefillClienteId = null;
      return;
    }

    // ✅ Si no vino vehículo, intento cliente
    if (this.prefillClienteId) {
      const c = clientes.find(x => x.id === this.prefillClienteId);
      if (c) {
        this.seleccionarCliente(c);
      }
      this.prefillClienteId = null;
      return;
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }
}
