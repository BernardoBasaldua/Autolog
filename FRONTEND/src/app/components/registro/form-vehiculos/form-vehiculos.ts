import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { Marca, MarcaCreatePayload, Modelo, ModeloCreatePayload, Vehiculo, VehiculoCreatePayload } from '../../../models/vehiculo/vehiculo.model';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { UsuarioService } from '../../../services/usuarios/usuarios/usuario.service';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';

import { Location } from '@angular/common';

// Si tenés un modelo Cliente/Usuario tipado, usalo acá.
// import { ClienteModel } from '../../../models/clientes/cliente.model';
// import { ClienteService } from '../../../services/clientes/cliente.service';

type ModoVehiculo = 'alta-desde-taller' | 'editar';
// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

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
  private route = inject(ActivatedRoute);

  vehiculoCreado = output<any>();

  // Modo de uso del formulario
  //INPUT COMO HIJO
  modo = input<ModoVehiculo>('alta-desde-taller');
  //propietario preseleccionado desde el lado del cliente
  propietarioId = input<number | null>(null);
  esDesdeCliente = input<boolean>(false);

  // ✅ Internos (uso real)
  modoInterno = signal<ModoVehiculo>('alta-desde-taller');
  propietarioIdInterno = signal<number | null>(null);
  lockPropietario = signal<boolean>(false);
  returnTo = signal<string | null>(null);

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

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  constructor(private location: Location) {
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
    this.cargarMarcasYModelos();

    const modeloCtrl = this.vehiculoForm.get('modeloId');
    modeloCtrl?.disable();

    // 1) base desde inputs
    this.modoInterno.set(this.modo());
    this.propietarioIdInterno.set(this.propietarioId());

    // 2) override por query params
    const qp = this.route.snapshot.queryParamMap;

    const modoQP = qp.get('modo') as ModoVehiculo | null;
    if (modoQP) this.modoInterno.set(modoQP);

    const propQP = qp.get('propietarioId');
    if (propQP) this.propietarioIdInterno.set(Number(propQP));

    const lockQP = qp.get('lockPropietario');
    if (lockQP === '1' || lockQP === 'true') this.lockPropietario.set(true);

    const returnToQP = qp.get('returnTo');
    if (returnToQP) this.returnTo.set(returnToQP);

    //  Comportamiento propietario
    if (this.esDesdeCliente()) {
      this.clienteService.getMiCliente().subscribe({
        next: (cli) => {
          const ctrl = this.vehiculoForm.get('propietarioId');
          ctrl?.setValue(cli.id);
          ctrl?.disable();
        },
        error: (e) => {
          console.error('Error obteniendo cliente actual', e)
          this.showNotice('Error obteniendo datos del cliente. Intentá nuevamente.', 'error');
        },
      });
      return;
    }

    // Taller
    this.cargarPropietarios();

    const pre = this.propietarioIdInterno();
    if (pre) {
      const ctrl = this.vehiculoForm.get('propietarioId');
      ctrl?.setValue(pre);

      // si vino por URL y lock = true
      if (this.lockPropietario()) {
        ctrl?.disable();
      }
    }

    // TODO: si modo() === 'editar', cargar datos del vehículo a editar
  }


  // ---------------- PROPIETARIOS ----------------

  cargarPropietarios(): void {
    this.clienteService.listarTodos().subscribe({
      next: (clientes) => this.propietarios.set(clientes),
      error: (e) => {
        console.error('Error cargando propietarios', e)
        this.showNotice('Error al cargar propietarios. Intentá nuevamente.', 'error');
      },
    });
  }

  nuevoCliente(): void {
    this.router.navigate(['/taller/form-cliente'], {
      queryParams: { modo: 'alta-desde-taller-VEHI' },
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
      error: (e) => {
        console.error('Error cargando marcas/modelos', e)
        this.showNotice('Error al cargar marcas y modelos. Intentá nuevamente.', 'error');
      },
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

    const payload: MarcaCreatePayload = {
      nombre: nombreNormalizado
    };

    this.vehiculoService.crearMarca(payload).subscribe({
      next: (marca) => {
        console.log('Marca creada:', marca);
        this.showNotice('Marca creada correctamente', 'success');

        this.cargarMarcasYModelos();
        this.cancelarNuevaMarca();
      },
      error: (e) => {
        console.error('Error creando marca:', e);
        this.showNotice('No se pudo crear la marca. Intentá nuevamente.', 'error');
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

    const payload: ModeloCreatePayload = {
      nombre: nombreNormalizado,
      marca: marcaId,
    };

    this.vehiculoService.crearModelo(payload).subscribe({
      next: () => {
        this.vehiculoService.getMarcasYModelos().subscribe({
          next: (marcas) => {
            this.marcas.set(marcas);
            this.onMarcaChange(); // ✅ ahora sí con data nueva
            this.cancelarNuevoModelo();
          },
          error: (e) => {
            console.error('Error recargando marcas', e)
            this.showNotice('Error al recargar marcas y modelos. Intentá nuevamente.', 'error');
          },
        });
      },
      error: (e) => {
        console.error('Error creando modelo:', e);
        this.showNotice('No se pudo crear el modelo. Intentá nuevamente.', 'error');
      },
    });

    console.log('Crear modelo:', nombre, 'para marca', marcaId);

  }

  // ---------------- GUARDAR ----------------

  // guardarVehiculo(): void {
  //   if (this.vehiculoForm.invalid) {
  //     this.vehiculoForm.markAllAsTouched();
  //     return;
  //   }

  //   const formValue = this.vehiculoForm.getRawValue();

  //   const payload: VehiculoCreatePayload = {
  //     propietario: formValue.propietarioId,
  //     año: formValue.anio,
  //     dominio: formValue.dominio,
  //     intervalo_servicio_km: formValue.intervaloKm,
  //     intervalo_servicio_meses: formValue.intervaloMeses,
  //     modelo_id: formValue.modeloId,
  //   };

  //   if (this.modo() === 'alta-desde-taller') {
  //   console.log('Payload para crear vehículo:', payload);

  //   this.vehiculoService.crearVehiculo(payload).subscribe({
  //     next: (vehiculoCreado) => {
  //       console.log('Vehículo creado:', vehiculoCreado);
  //       alert('Vehículo creado correctamente');

  //       this.vehiculoForm.reset();


  //       this.vehiculoCreado.emit(vehiculoCreado);
  //     },
  //     error: (e) => {
  //       console.error('Error creando vehículo:', e);
  //       // alert('No se pudo crear el vehículo');
  //       // DRF suele mandar errores en err.error
  //       const data = e?.error;

  //       // Caso típico: { dominio: ["..."] }
  //       const msgDominio =
  //         Array.isArray(data?.dominio) ? data.dominio.join(' ') : null;

  //       // Fallbacks
  //       const msgGeneral =
  //         data?.detail ||
  //         data?.message ||
  //         'No se pudo crear el vehículo ';

  //       alert(msgDominio ?? msgGeneral);
  //         },
  //   });

  // } else {
  //   // editar...
  // }

  // }

  guardarVehiculo(): void {
    if (this.vehiculoForm.invalid) {
      this.vehiculoForm.markAllAsTouched();
      return;
    }

    const formValue = this.vehiculoForm.getRawValue();
    console.log('Form raw value:', formValue);

    const payload: VehiculoCreatePayload = {
      propietario: formValue.propietarioId,
      año: formValue.anio,
      dominio: formValue.dominio,
      intervalo_servicio_km: formValue.intervaloKm,
      intervalo_servicio_meses: formValue.intervaloMeses,
      modelo_id: formValue.modeloId,
    };

    console.log('Payload que se envía:', payload);

    if (this.modo() === 'editar') {
      // TODO editar
      return;
    }

    if (this.esDesdeCliente()) {
      const clienteId = formValue.propietarioId;
      this.vehiculoService.crearVehiculoCliente(clienteId, payload).subscribe({
        next: (vehiculoCreado) => {
          console.log('Vehículo creado DESDE CLIENTE:', vehiculoCreado);
          this.showNotice('Vehículo creado correctamente', 'success');
          this.vehiculoForm.reset();
          this.vehiculoCreado.emit(vehiculoCreado);
          this.location.back();
        },
        error: (e) => {
          console.error('Error creando vehículo DESDE CLIENTE:', e);
          const data = e?.error;
          const msgDominio =
            Array.isArray(data?.dominio) ? data.dominio.join(' ') : null;
          const msgGeneral =
            data?.detail ||
            data?.message ||
            'No se pudo crear el vehículo desde cliente';
          this.showNotice(msgDominio ?? msgGeneral, 'error');
        },
      });
    } else {
      this.vehiculoService.crearVehiculo(payload).subscribe({
        next: (vehiculoCreado) => {
          console.log('Vehículo creado DESDE TALLER:', vehiculoCreado);
          this.showNotice('Vehículo creado correctamente', 'success');
          this.vehiculoForm.reset();
          this.vehiculoCreado.emit(vehiculoCreado);
          const rt = this.returnTo();
          if (rt) {
            this.router.navigateByUrl(rt);
            return;
          }
        },
        error: (e) => {
          console.error('Error creando vehículo DESDE TALLER:', e);
          const data = e?.error;
          const msgDominio =
            Array.isArray(data?.dominio) ? data.dominio.join(' ') : null;
          const msgGeneral =
            data?.detail ||
            data?.message ||
            'No se pudo crear el vehículo ';
          this.showNotice(msgDominio ?? msgGeneral, 'error');
        },
      });
    }
  }
  // Helpers
  isInvalid(controlName: string): boolean {
    const ctrl = this.vehiculoForm.get(controlName);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }
}
