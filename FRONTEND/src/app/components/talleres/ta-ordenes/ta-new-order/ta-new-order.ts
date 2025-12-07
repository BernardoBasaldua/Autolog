import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ClienteLite {
  id: number;
  first_name?: string;
  last_name?: string;
  telefono?: string;
  email?: string;
}

interface VehiculoLite {
  id: number;
  clienteId: number; // dueño
  marca?: string;
  modelo?: string;
  dominio?: string;
}

@Component({
  selector: 'app-ta-new-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-new-order.html',
  styleUrl: './ta-new-order.css',
})
export class TaNewOrder {
  private router = inject(Router);

  // =========================
  // CONFIG UX
  // =========================
  bloquearVehiculoPorCliente = false;
  // Si lo ponés en true:
  // - no deja tipear vehículo hasta elegir cliente
  // Pero como vos querés permitir seleccionar vehículo primero,
  // lo dejamos en false.

  // =========================
  // DATA (mock por ahora)
  // =========================
  clientes: ClienteLite[] = [
    { id: 1, first_name: 'Juan', last_name: 'Ramirez', telefono: '11-5555', email: 'juan@mail.com' },
    { id: 2, first_name: 'Ana', last_name: 'Lopez', telefono: '11-2222', email: 'ana@mail.com' },
    { id: 3, first_name: 'Pedro', last_name: 'Gomez', telefono: '11-9999', email: 'pedro@mail.com' },
  ];

  vehiculos: VehiculoLite[] = [
    { id: 10, clienteId: 1, marca: 'Volkswagen', modelo: 'Amarok', dominio: 'AG999ZZ' },
    { id: 11, clienteId: 1, marca: 'Ford', modelo: 'Ranger', dominio: 'AA123BB' },
    { id: 12, clienteId: 2, marca: 'Toyota', modelo: 'Hilux', dominio: 'AC444DD' },
  ];

  // =========================
  // STATE AUTOCOMPLETE
  // =========================
  clienteQuery = '';
  vehiculoQuery = '';

  mostrarDropdownClientes = false;
  mostrarDropdownVehiculos = false;

  clientesFiltrados: ClienteLite[] = [...this.clientes];
  vehiculosFiltrados: VehiculoLite[] = [...this.vehiculos];

  clienteSeleccionado: ClienteLite | null = null;
  vehiculoSeleccionado: VehiculoLite | null = null;

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
    
      // ✅ Debería navegar a tu flujo real de alta de cliente
      // Ej:
      this.router.navigate(['/taller/clientes/seleccionUsuario'], {
        queryParams: { modo: 'alta-desde-taller' }
      });
     
    console.log('Ir a crear cliente');
  }

  nuevoVehiculo(): void {
    /**
     * ✅ Debería navegar a tu flujo real de alta de vehículo
     * Podrías pasar el cliente seleccionado si existe:
     * this.router.navigate(['/taller/vehiculos/nuevo'], {
     *   queryParams: { propietarioId: this.clienteSeleccionado?.id }
     * });
     */
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

    // Si el usuario está escribiendo de nuevo, se puede considerar
    // que quiere cambiar el cliente
    // => opcionalmente podrías limpiar selecciones
    // this.clienteSeleccionado = null;
    // this.vehiculoSeleccionado = null;
  }

  filtrarClientes() {
    const t = this.clienteQuery.trim().toLowerCase();

    if (!t) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clientesFiltrados = this.clientes.filter((c) => {
      const nombre = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
      const tel = (c.telefono ?? '').toLowerCase();
      const email = (c.email ?? '').toLowerCase();
      return nombre.includes(t) || tel.includes(t) || email.includes(t);
    });
  }

  seleccionarCliente(c: ClienteLite) {
    // set seleccionado
    this.clienteSeleccionado = c;
    this.clienteQuery = this.formatCliente(c);
    this.mostrarDropdownClientes = false;

    // ✅ REGLA 1:
    // Al seleccionar cliente, vehículos deben ser solo de ese cliente
    this.vehiculosFiltrados = this.vehiculos.filter(v => v.clienteId === c.id);

    // Limpio vehículo actual para evitar inconsistencias
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
    this.mostrarDropdownVehiculos = true;
    this.filtrarVehiculos();
  }

  filtrarVehiculos() {
    const t = this.vehiculoQuery.trim().toLowerCase();

    // Base depende de si hay cliente seleccionado
    const base = this.clienteSeleccionado
      ? this.vehiculos.filter(v => v.clienteId === this.clienteSeleccionado!.id)
      : this.vehiculos;

    if (!t) {
      this.vehiculosFiltrados = [...base];
      return;
    }

    this.vehiculosFiltrados = base.filter((v) => {
      const marca = (v.marca ?? '').toLowerCase();
      const modelo = (v.modelo ?? '').toLowerCase();
      const dom = (v.dominio ?? '').toLowerCase();
      return marca.includes(t) || modelo.includes(t) || dom.includes(t);
    });
  }

  seleccionarVehiculo(v: VehiculoLite) {
    this.vehiculoSeleccionado = v;
    this.vehiculoQuery = this.formatVehiculo(v);
    this.mostrarDropdownVehiculos = false;

    // ✅ REGLA 2:
    // Si selecciono vehículo primero, autoselecciono propietario
    const dueño = this.clientes.find(c => c.id === v.clienteId) ?? null;

    if (dueño) {
      this.clienteSeleccionado = dueño;
      this.clienteQuery = this.formatCliente(dueño);

      // Y además actualizo el listado de vehículos a los del dueño
      this.vehiculosFiltrados = this.vehiculos.filter(x => x.clienteId === dueño.id);
    }
  }

  // =========================
  // FORMATTERS
  // =========================
  formatCliente(c: ClienteLite): string {
    const nombre = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
    const extras = [c.telefono, c.email].filter(Boolean).join(' - ');
    return [nombre, extras].filter(Boolean).join(' - ') || `Cliente ${c.id}`;
  }

  formatVehiculo(v: VehiculoLite): string {
    const mm = [v.marca, v.modelo].filter(Boolean).join(' ');
    const dom = v.dominio ? ` - ${v.dominio}` : '';
    return `${mm}${dom}`.trim() || `Vehículo ${v.id}`;
  }
}
