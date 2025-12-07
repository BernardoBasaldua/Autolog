import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClienteService } from '../../../../services/usuarios/clientes/cliente.service';
import { ClienteModel } from '../../../../models/usuarios/usuario.model';
import { Vehiculo } from '../../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../../services/vehiculo/vehiculo.service';

@Component({
  selector: 'app-ta-new-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-new-order.html',
  styleUrl: './ta-new-order.css',
})
export class TaNewOrder {
  private router = inject(Router);
  private clienteService = inject(ClienteService);
  private vehiculoService = inject(VehiculoService);

  // ✅ Guardamos la referencia al SIGNAL
  clientesSig = this.clienteService.clientes;
  vehiculosSig = this.vehiculoService.vehiculos;

  // =========================
  // CONFIG UX
  // =========================
  bloquearVehiculoPorCliente = false;
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

  ngOnInit(): void {
    
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.clienteService.clientes.set(clientes),
    });

    this.vehiculoService.listarTodos().subscribe({
      next: (vehiculos) => this.vehiculoService.vehiculos.set(vehiculos),
    });

    // Inicializo filtrados con lo que haya en signals en ese momento
    this.clientesFiltrados = [...this.clientesSig()];
    this.vehiculosFiltrados = [...this.vehiculosSig()];
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
  // NAVEGACIÓN A ALTAS
  // =========================
  nuevoCliente(): void {
    // TODO:
    this.router.navigate(['/taller/clientes/seleccionUsuario'], {
      queryParams: { modo: 'alta-desde-taller-ORD' }
    });
    console.log('Ir a crear cliente');
  }

  nuevoVehiculo(): void {
    // TODO:
    // this.router.navigate(['/taller/vehiculos/seleccion-vehiculo'], {
    //   queryParams: {
    //     modo: 'nuevo-desde-taller-VEHI',
    //     propietarioId: this.clienteSeleccionado?.id ?? null
    //   }
    // });
    console.log('Ir a crear vehículo');
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

    this.clienteAutoPorVehiculo = false; //cliente elegido manualmente

    this.clienteSeleccionado = c;
    this.clienteQuery = this.formatCliente(c);
    this.mostrarDropdownClientes = false;

    // ✅ REGLA 1:
    // al elegir cliente, muestro solo vehículos de ese cliente
    this.vehiculosFiltrados = vehiculos.filter(v => v.propietario === c.id);

    // limpio vehículo actual
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

    // ✅ Si borra el vehículo escrito, interpretamos "quiero buscar de nuevo"
    if (!texto) {
      this.vehiculoSeleccionado = null;

      // Si el cliente estaba auto-asignado por vehículo,
      // lo limpiamos para volver a lista global
      if (this.clienteAutoPorVehiculo) {
        this.clienteSeleccionado = null;
        this.clienteQuery = '';
        this.clienteAutoPorVehiculo = false;

        // reset full list
        this.vehiculosFiltrados = [...this.vehiculosSig()];
      } else {
        // si el cliente fue elegido manualmente,
        // mantenemos la restricción por cliente
        this.vehiculosFiltrados = this.clienteSeleccionado
          ? this.vehiculosSig().filter(v => v.propietario === this.clienteSeleccionado!.id)
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
      ? vehiculos.filter(v => v.propietario === this.clienteSeleccionado!.id)
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
    const dueño = clientes.find(c => c.id === v.propietario) ?? null;

    if (dueño) {
      this.clienteAutoPorVehiculo = true;
      this.clienteSeleccionado = dueño;
      this.clienteQuery = this.formatCliente(dueño);

      // actualizo lista de vehículos del dueño
      this.vehiculosFiltrados = vehiculos.filter(x => x.propietario === dueño.id);
    }
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
}
