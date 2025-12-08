import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { ClienteModel } from '../../../models/usuarios/usuario.model';

import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { OrdenDeTrabajoCreatePayload } from '../../../models/orden/orden.models';
import { OrdenService } from '../../../services/ordenes/orden.service';
import { TalleresService } from '../../../services/talleres/talleres.service';

// Si ya creaste el modelo:
// import { TipoMantenimiento, OrdenDeTrabajoCreatePayload } from '../../../../models/ordenes/orden-de-trabajo.model';
// Si ya creaste el service:
// import { OrdenDeTrabajoService } from '../../../../services/ordenes/orden-de-trabajo.service';

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
  horaTurno = '';   // hh:mm
  fechaEntrega: string | null = null;

  kilometraje : number | null = null;

  observacionesTecnicas: string | null = null;

  // En tu modelo: 'preventivo' | 'correctivo'
  mantenimiento: 'preventivo' | 'correctivo' = 'preventivo';

  // UI placeholders (aún no mapeados a FK reales)
  responsableTecnicoTexto = '';
  practicaTexto = '';

  ngOnInit(): void {

    // 0) Leo params (query y opcional param)
    this.initPrefillFromRoute();

    // 1) Clientes
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => {
        this.clienteService.clientes.set(clientes);
        this.clientesFiltrados = [...this.clientesSig()];

        // intento precargar por si vino clienteId
        this.tryApplyPrefill();
      },
    });

    // 2) Vehículos
    this.vehiculoService.listarTodos().subscribe({
      next: (vehiculos) => {
        this.vehiculoService.vehiculos.set(vehiculos);
        this.vehiculosFiltrados = [...this.vehiculosSig()];

        // intento precargar por si vino vehiculoId
        this.tryApplyPrefill();
      },
    });

    // 3) Valores default amigables
    const hoy = new Date();
    this.fechaTurno = hoy.toISOString().slice(0, 10);
    this.horaTurno = '10:00';
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
    this.mostrarDropdownClientes = true;
    this.filtrarClientes();
  }

  cerrarDropdownClientesConDelay() {
    setTimeout(() => (this.mostrarDropdownClientes = false), 120);
  }

  onClienteQueryChange() {
    this.mostrarDropdownClientes = true;
    this.filtrarClientes();

    // Si el usuario borra manualmente el texto del cliente,
    // interpretamos que quiere liberar filtros.
    if (!this.clienteQuery.trim()) {
      this.clienteSeleccionado = null;
      this.clienteAutoPorVehiculo = false;

      // Si no hay cliente, recupero lista global de vehículos
      this.vehiculosFiltrados = [...this.vehiculosSig()];
    }
  }

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

  seleccionarCliente(c: ClienteModel) {
    const vehiculos = this.vehiculosSig();

    this.clienteAutoPorVehiculo = false; // cliente elegido manualmente

    this.clienteSeleccionado = c;
    this.clienteQuery = this.formatCliente(c);
    this.mostrarDropdownClientes = false;

    // ✅ REGLA 1:
    // al elegir cliente, muestro solo vehículos de ese cliente
    this.vehiculosFiltrados = vehiculos.filter((v) => v.propietario === c.id);

    // limpio vehículo actual para no dejar inconsistencia
    this.vehiculoSeleccionado = null;
    this.vehiculoQuery = '';
  }

  // =========================
  // VEHICULO AUTOCOMPLETE
  // =========================
  abrirDropdownVehiculos() {
    this.mostrarDropdownVehiculos = true;
    this.filtrarVehiculos();
  }

  cerrarDropdownVehiculosConDelay() {
    setTimeout(() => (this.mostrarDropdownVehiculos = false), 120);
  }

  onVehiculoQueryChange() {
    const texto = this.vehiculoQuery.trim();

    // ✅ Si borra el vehículo escrito:
    if (!texto) {
      this.vehiculoSeleccionado = null;

      // Si el cliente estaba auto-asignado por vehículo,
      // lo limpiamos para volver a lista global
      if (this.clienteAutoPorVehiculo) {
        this.clienteSeleccionado = null;
        this.clienteQuery = '';
        this.clienteAutoPorVehiculo = false;

        this.vehiculosFiltrados = [...this.vehiculosSig()];
      } else {
        // Si el cliente fue elegido manualmente,
        // mantenemos la restricción por cliente
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

  seleccionarVehiculo(v: Vehiculo) {
    const clientes = this.clientesSig();
    const vehiculos = this.vehiculosSig();

    this.vehiculoSeleccionado = v;
    this.vehiculoQuery = this.formatVehiculo(v);
    this.mostrarDropdownVehiculos = false;

    // ✅ REGLA 2:
    // si elijo vehículo primero => autoselecciono dueño
    const dueño = clientes.find((c) => c.id === v.propietario) ?? null;

    if (dueño) {
      this.clienteAutoPorVehiculo = true;
      this.clienteSeleccionado = dueño;
      this.clienteQuery = this.formatCliente(dueño);

      // actualizo lista de vehículos del dueño
      this.vehiculosFiltrados = vehiculos.filter((x) => x.propietario === dueño.id);
    }
  }

  // =========================
  // ACCIONES DE ORDEN
  // =========================

  verAgenda(): void {
    // TODO:
    // 1) Si tenés AgendaService, abrir agenda disponible según:
    //    - fechaTurno + horaTurno
    //    - tecnico/taller (cuando estén implementados)
    // 2) Podrías abrir un modal o navegar a /taller/agendas
    console.log('Ver agenda (pendiente implementar)');
  }

  cancelarOrden(): void {
    // UX simple: limpiar todo
    this.resetFormularioOrden();
  }

  confirmarOrden(): void {
    // 1) Validaciones mínimas de front
    if (!this.clienteSeleccionado || !this.vehiculoSeleccionado) {
      alert('Seleccioná un cliente y un vehículo.');
      return;
    }

    const fechaTurnoISO = this.buildFechaTurnoISO();
    if (!fechaTurnoISO) {
      alert('Completá fecha y hora del turno.');
      return;
    }

    // 2) Payload alineado a tu modelo Django
    const payload: OrdenDeTrabajoCreatePayload = {
      taller : this.esteTallerId,
      fecha_turno: fechaTurnoISO,
      fecha_entrega: this.fechaEntrega,
      kilometraje: this.kilometraje ?? 0,
      observaciones_tecnicas: this.observacionesTecnicas,
      mantenimiento: this.mantenimiento,
      cliente: this.clienteSeleccionado.id,
      vehiculo: this.vehiculoSeleccionado.id,
      // agenda, tecnico, taller cuando los tengas implementados
    };

    // 3) Llamada real al servicio
    this.ordenService.crearOrden(payload).subscribe({
      next: (ordenCreada) => {
        alert('Orden creada correctamente ✔');
        this.router.navigate(['/taller', 'ordenes']);
      },
      error: (e) => {
        console.error('Error creando orden', e);
        const msg = e?.error?.detail || 'No se pudo crear la orden';
        alert(msg);
      }
    });

    console.log('Confirmar orden (payload pendiente de conectar a service)');
  }

  private buildFechaTurnoISO(): string | null {
    const f = (this.fechaTurno ?? '').trim();
    const h = (this.horaTurno ?? '').trim();

    if (!f || !h) return null;

    // Forma simple ISO local
    // Si querés exactitud de zona horaria, lo ajustamos después.
    return `${f}T${h}:00`;
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
    const hoy = new Date();
    this.fechaTurno = hoy.toISOString().slice(0, 10);
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
    const extras = [c.usuario?.telefono, c.usuario?.email].filter(Boolean).join(' - ');
    return [nombre, extras].filter(Boolean).join(' - ') || `Cliente ${c.id}`;
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

}
