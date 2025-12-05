import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  Marca,
  Modelo,
} from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { FormsModule } from '@angular/forms'; 

type ModoVehiculo = 'alta-desde-taller' | 'editar';

@Component({
  selector: 'app-form-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './form-vehiculos.html',
  styleUrl: './form-vehiculos.css',
})
export class FormVehiculos {
  private fb = inject(FormBuilder);
  private vehiculosService = inject(VehiculoService);

  // Modo de uso del formulario
  modo = input<ModoVehiculo>('alta-desde-taller');

  // Opcional: id del propietario (cliente)
  propietarioId = input<number | null>(null);

  vehiculoForm: FormGroup;

  // Listas auxiliares
  marcas: Marca[] = [];
  modelos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];

  // UI para crear marca/modelo "al vuelo"
  mostrarFormMarca = false;
  mostrarFormModelo = false;
  nuevaMarcaNombre = '';
  nuevoModeloNombre = '';

  constructor() {
    this.vehiculoForm = this.fb.group({
      marcaId: [null, Validators.required],
      modeloId: [null, Validators.required],
      dominio: ['', [Validators.required, Validators.maxLength(7)]],
      anio: [null, [Validators.required, Validators.min(1900)]],
      intervaloKm: [10000, [Validators.required, Validators.min(1000)]],
      intervaloMeses: [12, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.cargarMarcasYModelos();
    // TODO: si modo() === 'editar', cargar datos del vehículo a editar
  }

  cargarMarcasYModelos(): void {
    // TODO: Ajustar al endpoint real.
    // Ideal: un endpoint que devuelva marcas y modelos.
    //
    // this.vehiculosService.getMarcasYModelos().subscribe({
    //   next: (resp) => {
    //     this.marcas = resp.marcas;
    //     this.modelos = resp.modelos;
    //     this.modelosFiltrados = resp.modelos;
    //   },
    //   error: (e) => console.error('Error cargando marcas/modelos', e),
    // });
  }

  onMarcaChange(): void {
    const marcaId = this.vehiculoForm.get('marcaId')?.value;

    if (!marcaId) {
      this.modelosFiltrados = this.modelos;
      this.vehiculoForm.get('modeloId')?.setValue(null);
      return;
    }

    this.modelosFiltrados = this.modelos.filter(
      (m: any) => m.marca?.id === marcaId || m.marca_id === marcaId
    );
    this.vehiculoForm.get('modeloId')?.setValue(null);
  }

  // --------- Crear MARCA "al vuelo" ---------

  abrirFormMarca(): void {
    this.mostrarFormMarca = true;
    this.nuevaMarcaNombre = '';
  }

  cancelarNuevaMarca(): void {
    this.mostrarFormMarca = false;
    this.nuevaMarcaNombre = '';
  }

  guardarNuevaMarca(): void {
    const nombre = this.nuevaMarcaNombre.trim();
    if (!nombre) {
      return;
    }

    // TODO: llamar al endpoint para crear Marca
    // this.vehiculosService.crearMarca({ nombre }).subscribe({
    //   next: (marcaCreada) => {
    //     this.marcas.push(marcaCreada);
    //     // seleccionar la nueva marca en el formulario
    //     this.vehiculoForm.get('marcaId')?.setValue(marcaCreada.id);
    //     // actualizar modelos filtrados si hace falta
    //     this.onMarcaChange();
    //     this.mostrarFormMarca = false;
    //   },
    //   error: (e) => console.error('Error creando marca', e),
    // });

    console.log('Crear marca:', nombre);
    this.mostrarFormMarca = false;
  }

  // --------- Crear MODELO "al vuelo" ---------

  abrirFormModelo(): void {
    this.mostrarFormModelo = true;
    this.nuevoModeloNombre = '';
  }

  cancelarNuevoModelo(): void {
    this.mostrarFormModelo = false;
    this.nuevoModeloNombre = '';
  }

  guardarNuevoModelo(): void {
    const nombre = this.nuevoModeloNombre.trim();
    const marcaId = this.vehiculoForm.get('marcaId')?.value;

    if (!nombre || !marcaId) {
      // opcional: mostrar algún mensaje de error
      console.warn('Para crear un modelo, primero seleccioná una marca');
      return;
    }

    // TODO: llamar al endpoint para crear Modelo
    // this.vehiculosService.crearModelo({ nombre, marca: marcaId }).subscribe({
    //   next: (modeloCreado) => {
    //     this.modelos.push(modeloCreado);
    //     // filtrar modelos por marca y seleccionar el nuevo
    //     this.onMarcaChange();
    //     this.vehiculoForm.get('modeloId')?.setValue(modeloCreado.id);
    //     this.mostrarFormModelo = false;
    //   },
    //   error: (e) => console.error('Error creando modelo', e),
    // });

    console.log('Crear modelo:', nombre, 'para marca', marcaId);
    this.mostrarFormModelo = false;
  }

  guardarVehiculo(): void {
    if (this.vehiculoForm.invalid) {
      this.vehiculoForm.markAllAsTouched();
      return;
    }

    const formValue = this.vehiculoForm.value;

    const payload: any = {
      año: formValue.anio,
      dominio: formValue.dominio,
      intervalo_servicio_km: formValue.intervaloKm,
      intervalo_servicio_meses: formValue.intervaloMeses,
      modelo_id: formValue.modeloId,
    };

    const propietario = this.propietarioId();
    if (propietario) {
      payload.propietario = propietario;
    }

    if (this.modo() === 'alta-desde-taller') {
      // TODO: usar tu servicio real
      // this.vehiculosService.crearVehiculo(payload).subscribe({
      //   next: (vehiculoCreado) => {
      //     console.log('Vehículo creado', vehiculoCreado);
      //   },
      //   error: (e) => console.error('Error creando vehículo', e),
      // });
      console.log('Payload para crear vehículo:', payload);
    } else {
      // TODO editar vehículo
    }
  }

  // Helpers
  isInvalid(controlName: string): boolean {
    const ctrl = this.vehiculoForm.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }
}
