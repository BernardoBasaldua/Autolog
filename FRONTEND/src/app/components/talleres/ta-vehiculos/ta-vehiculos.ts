import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Ajustá estos imports a tu estructura real
import { Vehiculo } from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
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
  // Inyecciones de servicios
  private talleresService = inject(TalleresService);
  private router = inject(Router);

  // Lista completa de vehículos del taller
  vehiculos: Vehiculo[] = [];

  // Lista filtrada para mostrar en pantalla
  vehiculosFiltrados: Vehiculo[] = [];

  // Filtros
  terminoBusqueda: string = '';        // patente, marca, modelo
  filtroMarca: string = '';            // marca elegida en el select
  filtroModelo: string = '';           // modelo elegido en el select
  filtroAnio: number | null = null;    // año del vehículo
  filtroTipoServicio: number | null = null; // id de práctica / tipo servicio

  // Datos auxiliares para los combos
  marcasDisponibles: string[] = [];
  modelosDisponibles: string[] = [];
  tiposServicio: TipoServicio[] = [];

  ngOnInit(): void {
    // TODO:
    // - Llamar a cargarVehiculos() para traer los vehículos del taller.
    this.cargarVehiculos();
    // - Llamar a cargarTiposServicio() para traer las prácticas de mantenimiento.
    // - Llamar a cargarMarcasYModelosDisponibles() para traer marcas/modelos.
    
  }

  cargarVehiculos(): void {
    // TODO:
    // - Usar this.vehiculosService para pedir al backend los vehículos del taller.
    // - En el subscribe:
    //     this.vehiculos = respuesta;
    //     this.vehiculosFiltrados = respuesta;
    // - Luego llamar a this.cargarMarcasYModelosDisponibles() para armar
    //   las listas de marcas y modelos únicas para los filtros.
    this.talleresService.getVehiculosDeTaller().subscribe(
      {
        next:(vehiculos) => {
          this.vehiculos = vehiculos;
          this.vehiculosFiltrados = vehiculos;
        },
        error:(e)=>{console.log('vehiculos no encontrados')}
    });
  }

  cargarTiposServicio(): void {
    // TODO:
    // - Usar this.talleresService para pedir las prácticas de mantenimiento
    //   configuradas para el taller actual.
    // - Mapear la respuesta a { id, nombre } y asignarla a this.tiposServicio
    //   para poblar el select de "Tipo de servicio".
  }

  cargarMarcasYModelosDisponibles(): void {
    // TODO:
    // - A partir de this.vehiculos, armar:
    //     this.marcasDisponibles = [...marcas únicas];
    //     this.modelosDisponibles = [...modelos únicos];
    // - Por ejemplo usando Set:
    //     const marcas = new Set(this.vehiculos.map(v => v.modelo.marca.nombre));
    //     const modelos = new Set(this.vehiculos.map(v => v.modelo.nombre));
  }

  onBuscar(): void {
    // TODO:
    // - Aplicar todos los filtros sobre this.vehiculos y guardar el resultado
    //   en this.vehiculosFiltrados.
    // - Podés delegar la lógica a this.aplicarFiltros().
  }

  limpiarFiltros(): void {
    // TODO:
    // - Resetear todos los filtros:
    //     this.terminoBusqueda = '';
    //     this.filtroMarca = '';
    //     this.filtroModelo = '';
    //     this.filtroAnio = null;
    //     this.filtroTipoServicio = null;
    // - Volver a mostrar todos los vehículos:
    //     this.vehiculosFiltrados = this.vehiculos;
  }

  aplicarFiltros(): void {
    // TODO:
    // - A partir de this.vehiculos, ir filtrando paso a paso:
    //   1) terminoBusqueda:
    //      - buscar en dominio/patente, marca, modelo (en lowerCase).
    //   2) filtroMarca:
    //      - si tiene valor, quedarte solo con vehículos de esa marca.
    //   3) filtroModelo:
    //      - igual que marca, pero por nombre de modelo.
    //   4) filtroAnio:
    //      - si tiene valor, comparar con el año del vehículo.
    //   5) filtroTipoServicio:
    //      - filtrar según tu diseño:
    //        * o bien por órdenes de trabajo asociadas al vehículo,
    //        * o si el backend ya devuelve eso calculado, ajustar ahí.
    // - Al final, asignar:
    //     this.vehiculosFiltrados = resultado;
  }

  verVehiculo(vehiculo: Vehiculo): void {
    // TODO:
    // - Navegar a un detalle de vehículo.
    //   Ejemplo:
    //     this.router.navigate(['/taller/vehiculos', vehiculo.id]);
  }

  crearOrdenParaVehiculo(vehiculo: Vehiculo): void {
    // TODO:
    // - Navegar al flujo de creación de orden de trabajo
    //   pasando el vehículo (y opcionalmente el cliente) como parámetro.
    //   Ejemplo:
    //     this.router.navigate(['/taller/ordenes/nueva'], {
    //       queryParams: { vehiculoId: vehiculo.id },
    //     });
  }

  irASelectorVehiculo(): void {
    // TODO:
    // - Navegar al componente "selector de vehículo" (similar a SeleccionUsuario).
    //   Ejemplo:
        this.router.navigate(['/taller/vehiculos/seleccion-vehiculo'], {
          queryParams: { modo: 'alta-desde-taller' },
        });
  }
}