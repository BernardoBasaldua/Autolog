import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { TalleresService } from '../../../services/talleres/talleres.service';
import { Router } from '@angular/router';

type TipoServicio = {
  id: number;
  nombre: string;
};

@Component({
  selector: 'app-ta-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ta-vehiculos.html',
  styleUrl: './ta-vehiculos.css',
})
export class TaVehiculos implements OnInit {
  private talleresService = inject(TalleresService);
  private router = inject(Router);

  // =========================
  // SIGNALS
  // =========================
  vehiculosSig = this.talleresService.vehiculosTaller;
  clientesTallerSig = this.talleresService.clientesTaller;

  // Ojo: esta asignación es "foto inicial".
  // Igual vos después la actualizás bien en cargarVehiculos().
  vehiculos: Vehiculo[] = this.vehiculosSig();

  // Lista filtrada para mostrar en pantalla
  vehiculosFiltrados: Vehiculo[] = [];

  // =========================
  // FILTROS
  // =========================
  terminoBusqueda: string = '';
  filtroMarca: string = '';
  filtroModelo: string = '';
  filtroAnio: number | null = null;
  filtroTipoServicio: number | null = null;

  // Combos
  marcasDisponibles: string[] = [];
  modelosDisponibles: string[] = [];
  tiposServicio: TipoServicio[] = [];

  ngOnInit(): void {
    this.cargarVehiculos();

    // ✅ Necesario para poder resolver propietario por id
    this.talleresService.getClientesDeTaller().subscribe({
      next: (clientes) => {
        // el service ya hace set() en el signal
        // pero lo dejamos por claridad mental
        this.talleresService.clientesTaller.set(clientes);
      },
      error: () => console.log('Clientes del taller no encontrados'),
    });

    // TODO:
    // this.cargarTiposServicio();
    // this.cargarMarcasYModelosDisponibles();
  }

  cargarVehiculos(): void {
    this.talleresService.getVehiculosDeTaller().subscribe({
      next: (vehiculos) => {
        this.vehiculos = vehiculos;
        this.vehiculosFiltrados = vehiculos;

        // ✅ útil para filtros de marca/modelo
        this.cargarMarcasYModelosDisponibles();
      },
      error: () => console.log('Vehículos no encontrados'),
    });
  }

  cargarTiposServicio(): void {
    // TODO
  }

  cargarMarcasYModelosDisponibles(): void {
    const marcas = new Set(
      this.vehiculos
        .map(v => v.marca?.nombre)
        .filter(Boolean) as string[]
    );

    const modelos = new Set(
      this.vehiculos
        .map(v => v.modelo?.nombre)
        .filter(Boolean) as string[]
    );

    this.marcasDisponibles = Array.from(marcas).sort();
    this.modelosDisponibles = Array.from(modelos).sort();
  }

  onBuscar(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroMarca = '';
    this.filtroModelo = '';
    this.filtroAnio = null;
    this.filtroTipoServicio = null;

    this.vehiculosFiltrados = [...this.vehiculos];
  }

  aplicarFiltros(): void {
    let result = [...this.vehiculos];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      result = result.filter(v => {
        const dominio = (v.dominio ?? '').toLowerCase();
        const marca = (v.marca?.nombre ?? '').toLowerCase();
        const modelo = (v.modelo?.nombre ?? '').toLowerCase();

        return dominio.includes(t) || marca.includes(t) || modelo.includes(t);
      });
    }

    if (this.filtroMarca) {
      result = result.filter(v =>
        (v.marca?.nombre ?? '') === this.filtroMarca
      );
    }

    if (this.filtroModelo) {
      result = result.filter(v =>
        (v.modelo?.nombre ?? '') === this.filtroModelo
      );
    }

    if (this.filtroAnio) {
      // tu modelo usa vehiculo['año']
      result = result.filter(v => (v as any)['año'] === this.filtroAnio);
    }

    // filtroTipoServicio queda pendiente según tu lógica real de negocio
    // if (this.filtroTipoServicio) { ... }

    this.vehiculosFiltrados = result;
  }

  // =========================
  // FORMATTERS PROPIETARIO
  // =========================
  formatPropietarioNombre(propietarioId: number | null | undefined): string {
    if (!propietarioId) return '-';

    const c = this.clientesTallerSig().find(x => x.id === propietarioId);
    if (!c) return `Cliente #${propietarioId}`;

    const nombre = `${c.usuario?.first_name ?? ''} ${c.usuario?.last_name ?? ''}`.trim();
    return nombre || `Cliente #${propietarioId}`;
  }

  formatPropietarioExtras(propietarioId: number | null | undefined): string {
    if (!propietarioId) return '';

    const c = this.clientesTallerSig().find(x => x.id === propietarioId);
    if (!c) return '';

    const tel = c.usuario?.telefono ?? '';
    const mail = c.usuario?.email ?? '';

    return [tel, mail].filter(Boolean).join(' • ');
  }

  // =========================
  // NAVEGACIÓN
  // =========================
  verVehiculo(vehiculo: Vehiculo): void {
    // TODO:
    // this.router.navigate(['/taller/vehiculos', vehiculo.id]);
  }

  crearOrdenParaVehiculo(vehiculo: Vehiculo): void {
    // TODO:
    this.router.navigate(['/taller/form-orden'], {
      queryParams: { vehiculoId: vehiculo.id },
    });
  }

  irASelectorVehiculo(): void {
    this.router.navigate(['/taller/vehiculos/seleccion-vehiculo']);
  }
}
