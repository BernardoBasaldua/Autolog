import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router , ActivatedRoute} from '@angular/router';

import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { FormVehiculos } from '../../registro/form-vehiculos/form-vehiculos';

type Modo = 'default' | 'alta-desde-taller-VEHI'| 'nuevo-desde-cliente';


@Component({
  selector: 'app-seleccion-vehiculo',
  imports: [CommonModule, FormsModule, FormVehiculos],
  templateUrl: './seleccion-vehiculos.html',
  styleUrl: './seleccion-vehiculos.css',
})
export class SeleccionVehiculo {
  private vehiculosService = inject(VehiculoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  modo: Modo = 'default';
  esDesdeCliente = false;

  vehiculos: Vehiculo[] = [];
  vehiculosFiltrados: Vehiculo[] = [];
  terminoBusqueda = '';

  ngOnInit(): void {
      this.route.queryParams.subscribe((params) => {
    const modoParam = params['modo'] as Modo | string | undefined;

    // ✅ Marca si viene del cliente
    this.esDesdeCliente = modoParam === 'alta-desde-cliente';

    // ✅ Define modo del componente
    if (modoParam === 'alta-desde-taller-VEHI') {
      this.modo = 'alta-desde-taller-VEHI';
    } else {
      this.modo = 'default';
    }

    // ✅ Una sola carga
    this.cargarVehiculos();
  });
  }

  onVehiculoCreado(v: any) {
    
    this.cargarVehiculos();
    // cambiar tab
    this.modo = 'default';
  }

  // 
  cargarVehiculos(): void {
    const req$ = this.esDesdeCliente
      ? this.vehiculosService.listarMisVehiculos()
      : this.vehiculosService.listarTodos();

    req$.subscribe({
      next: (vehiculos) => {
        this.vehiculos = vehiculos;
        this.vehiculosFiltrados = vehiculos;
      },
      error: (e) => console.error('Error cargando vehículos', e),
    });
  }


  volver(): void {
  if (this.esDesdeCliente) {
    this.router.navigate(['/cliente']);
  } else {
    this.router.navigate(['/taller/vehiculos']);
  }
}


  filtrar(): void {
    const termino = this.terminoBusqueda.toLowerCase().trim();

    if (!termino) {
      this.vehiculosFiltrados = this.vehiculos;
      return;
    }

    this.vehiculosFiltrados = this.vehiculos.filter((v) => {
      const patente = v.dominio?.toLowerCase() ?? '';
      const marca = v.marca?.nombre?.toLowerCase() ?? '';
      const modelo = v.modelo?.nombre?.toLowerCase() ?? '';

      return (
        patente.includes(termino) ||
        marca.includes(termino) ||
        modelo.includes(termino)
      );
    });
  }

  seleccionarVehiculo(vehiculo: Vehiculo): void {
    // TODO:
    // - Acá definís qué significa "usar este vehículo".
    //   Por ejemplo, navegar al alta de orden de trabajo:
    //
    //   this.router.navigate(['/taller/ordenes/nueva'], {
    //     queryParams: { vehiculoId: vehiculo.id },
    //   });
    //
    //   Por ahora dejo un log:
    console.log('Vehículo seleccionado:', vehiculo);
  }

  mostrarVehiculosExistentes(): void {
    this.modo = 'default';
  }

  crearVehiculoNuevo(): void {
    // Si ya vengo como cliente, mantengo el modo cliente.
    // Si no, uso el modo taller.
    if (this.esDesdeCliente) {
      this.modo = 'nuevo-desde-cliente';
    } else {
      this.modo = 'alta-desde-taller-VEHI';
    }
  }


  verVehiculo(vehiculo: Vehiculo): void {
    // TODO opcional:
    // - Navegar a un detalle de vehículo
    //   this.router.navigate(['/taller/vehiculos', vehiculo.id]);
    console.log('Ver vehículo:', vehiculo);
  }
}
