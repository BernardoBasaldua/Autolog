import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { FormVehiculos } from '../../registro/form-vehiculos/form-vehiculos';

type Modo = 'default' | 'nuevo-desde-taller';

@Component({
  selector: 'app-seleccion-vehiculo',
  imports: [CommonModule, FormsModule, FormVehiculos],
  templateUrl: './seleccion-vehiculos.html',
  styleUrl: './seleccion-vehiculos.css',
})
export class SeleccionVehiculo {
  private vehiculosService = inject(VehiculoService);
  private router = inject(Router);

  modo: Modo = 'default';

  vehiculos: Vehiculo[] = [];
  vehiculosFiltrados: Vehiculo[] = [];
  terminoBusqueda = '';

  ngOnInit(): void {
    this.cargarVehiculos();
  }

  onVehiculoCreado(v: any) {
    
    this.cargarVehiculos();
    // cambiar tab
    this.modo = 'default';
  }

  cargarVehiculos(): void {
    
      this.vehiculosService.listarTodos().subscribe({
        next: (vehiculos) => {
          this.vehiculos = vehiculos;
          this.vehiculosFiltrados = vehiculos;
        },
        error: (e) => console.error('Error cargando vehículos', e),
      });
  
  }

  volver(): void {
    // Volver a la vista principal de vehículos del taller
    this.router.navigate(['/taller/vehiculos']);
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
    this.modo = 'nuevo-desde-taller';
  }

  verVehiculo(vehiculo: Vehiculo): void {
    // TODO opcional:
    // - Navegar a un detalle de vehículo
    //   this.router.navigate(['/taller/vehiculos', vehiculo.id]);
    console.log('Ver vehículo:', vehiculo);
  }
}
