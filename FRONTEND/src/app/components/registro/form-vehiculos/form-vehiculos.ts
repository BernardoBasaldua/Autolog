import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Marca, MarcaCreatePayload, Modelo, ModeloCreatePayload, Vehiculo, VehiculoCreatePayload } from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { UsuarioService } from '../../../services/usuarios/usuarios/usuario.service';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';

// Si tenés un modelo Cliente/Usuario tipado, usalo acá.
// import { ClienteModel } from '../../../models/clientes/cliente.model';
// import { ClienteService } from '../../../services/clientes/cliente.service';

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
  private vehiculoService = inject(VehiculoService);
  private clienteService = inject(ClienteService)
  private router = inject(Router);

  vehiculoCreado = output<any>();
  // Modo de uso del formulario
  modo = input<ModoVehiculo>('alta-desde-taller');

  //propietario preseleccionado desde el lado del cliente
  propietarioId = input<number | null>(null);

  vehiculoForm: FormGroup;

  // Listas auxiliares
  vehiculos = this.vehiculoService.vehiculos;
  marcas = this.vehiculoService.marcas;

  modelosFiltrados: Modelo[] = [];

  // Lista de propietarios para el select
  // Idealmente tipalo con tu ClienteModel/UsuarioModel
  propietarios = this.clienteService.clientes;

  // UI para crear marca/modelo "al vuelo"
  mostrarFormMarca = false;
  mostrarFormModelo = false;
  nuevaMarcaNombre = '';
  nuevoModeloNombre = '';

  constructor() {
    this.vehiculoForm = this.fb.group({
      // NUEVO: propietario obligatorio
      propietarioId: [null, Validators.required],

      marcaId: [null, Validators.required],
      modeloId: [null, Validators.required],
      dominio: ['', [Validators.required, Validators.maxLength(7)]],
      anio: [null, [Validators.required, Validators.min(1900)]],
      intervaloKm: [10000, [Validators.required, Validators.min(1000)]],
      intervaloMeses: [12, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.cargarPropietarios();
    this.cargarMarcasYModelos();

    // Si viene un propietarioId desde afuera, lo precargamos
    const pre = this.propietarioId();
    if (pre) {
      this.vehiculoForm.get('propietarioId')?.setValue(pre);
    }
      // Al inicio, sin marca => deshabilito modelo
    const modeloCtrl = this.vehiculoForm.get('modeloId');
    modeloCtrl?.disable();

    // TODO: si modo() === 'editar', cargar datos del vehículo a editar
  }

  // ---------------- PROPIETARIOS ----------------

  cargarPropietarios(): void {
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.propietarios.set(clientes),
      error: (e) => console.error('Error cargando propietarios', e),
    });
  }

  nuevoCliente(): void {
    this.router.navigate(['/taller/form-cliente'], {
      queryParams: { modo: 'alta-desde-taller' },
    });
  }

  formatPropietario(p: ClienteModel): string {
    const nombre = [p.usuario.first_name, p.usuario.last_name]
      .map((x: string) => (x ?? '').trim())
      .filter((x: string) => x.length > 0)
      .join(' ');

    const extras = [p.usuario.email, p.usuario.telefono]
      .map((x: string) => (x ?? '').trim())
      .filter((x: string) => x.length > 0)
      .join(' - ');

    const full = [nombre, extras].filter(Boolean).join(' - ');

    return full || `Cliente ${p.id ?? ''}`.trim();
  }


  // ---------------- MARCAS / MODELOS ----------------

  cargarMarcasYModelos(): void {
    this.vehiculoService.getMarcasYModelos().subscribe({
      next: (marcas) => {
        this.marcas.set(marcas);
        console.log('marcas json', JSON.stringify(marcas, null, 2));
      },
      error: (e) => console.error('Error cargando marcas/modelos', e),
    });
  }

  onMarcaChange(): void {
    const marcaId = this.vehiculoForm.get('marcaId')?.value;
    const modeloCtrl = this.vehiculoForm.get('modeloId');

    if (!marcaId) {
      this.modelosFiltrados = [];
      modeloCtrl?.reset();
      modeloCtrl?.disable();
      return;
    }

    const marca = this.marcas().find(m => m.id === marcaId);

    this.modelosFiltrados = marca?.modelos ?? [];

    modeloCtrl?.enable();
    modeloCtrl?.reset();

    if (this.modelosFiltrados.length > 0) {
      this.vehiculoForm.get('modeloId')?.setValue(this.modelosFiltrados[0].id);
    }
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
    if (!nombre) return;

    const nombreNormalizado = nombre.toUpperCase();

    const payload : MarcaCreatePayload ={
      nombre : nombreNormalizado
    };

    this.vehiculoService.crearMarca(payload).subscribe({
      next: (marca) => {
        console.log('Marca creada:', marca);
        alert('Marca creada correctamente');

        this.cargarMarcasYModelos();
        this.cancelarNuevaMarca();
      },
      error: (e) => {
        console.error('Error creando marca:', e);
        alert('No se pudo crear el marca');
      },
    });
    console.log('Crear marca:', nombreNormalizado);
    this.mostrarFormMarca = false;
    this.nuevaMarcaNombre = '';
  }

  // --------- Crear MODELO  ---------

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
      console.warn('Para crear un modelo, primero seleccioná una marca');
      return;
    }
    const nombreNormalizado = nombre.toUpperCase();

    const payload : ModeloCreatePayload ={
      nombre : nombreNormalizado,
      marca : marcaId,
    };

    this.vehiculoService.crearModelo(payload).subscribe({
      next: () => {
        this.vehiculoService.getMarcasYModelos().subscribe({
          next: (marcas) => {
            this.marcas.set(marcas);
            this.onMarcaChange(); // ✅ ahora sí con data nueva
            this.cancelarNuevoModelo();
          },
          error: (e) => console.error('Error recargando marcas', e),
        });
      },
      error: (e) => {
        console.error('Error creando modelo:', e);
        alert('No se pudo crear el modelo ');
      },
    });

    console.log('Crear modelo:', nombre, 'para marca', marcaId);
    
  }

  // ---------------- GUARDAR ----------------

  guardarVehiculo(): void {
    if (this.vehiculoForm.invalid) {
      this.vehiculoForm.markAllAsTouched();
      return;
    }

    const formValue = this.vehiculoForm.value;

    const payload: VehiculoCreatePayload = {
      propietario: formValue.propietarioId,
      año: formValue.anio,
      dominio: formValue.dominio,
      intervalo_servicio_km: formValue.intervaloKm,
      intervalo_servicio_meses: formValue.intervaloMeses,
      modelo_id: formValue.modeloId,
    };

    if (this.modo() === 'alta-desde-taller') {
    console.log('Payload para crear vehículo:', payload);

    this.vehiculoService.crearVehiculo(payload).subscribe({
      next: (vehiculoCreado) => {
        console.log('Vehículo creado:', vehiculoCreado);
        alert('Vehículo creado correctamente');

        this.vehiculoForm.reset();

        
        this.vehiculoCreado.emit(vehiculoCreado);
      },
      error: (e) => {
        console.error('Error creando vehículo:', e);
        // alert('No se pudo crear el vehículo');
        // DRF suele mandar errores en err.error
        const data = e?.error;

        // Caso típico: { dominio: ["..."] }
        const msgDominio =
          Array.isArray(data?.dominio) ? data.dominio.join(' ') : null;

        // Fallbacks
        const msgGeneral =
          data?.detail ||
          data?.message ||
          'No se pudo crear el vehículo ';

        alert(msgDominio ?? msgGeneral);
          },
    });

  } else {
    // editar...
  }

  }

  // Helpers
  isInvalid(controlName: string): boolean {
    const ctrl = this.vehiculoForm.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }
}
