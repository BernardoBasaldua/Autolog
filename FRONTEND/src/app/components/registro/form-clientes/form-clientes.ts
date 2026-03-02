import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../services/usuarios/usuarios/usuario.service';

type Modo = 'crear' | 'editar' | 'registroEstablecimiento' | 'alta-desde-taller-CLI' | 'alta-desde-taller-VEHI' | 'alta-desde-taller-ORD';

// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

@Component({
  selector: 'app-form-clientes',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-clientes.html',
  styleUrl: './form-clientes.css'
})
export class FormClientes {
  modo = input<Modo>('crear');  // por defecto registrar
  modoInterno = signal<Modo>('crear');
  clienteActual: ClienteModel | null = null;
  usuarioActual: UsuarioModel | null = null;
  clienteForm: FormGroup;
  formInvalido = output<boolean>();
  perfilCreado = output<void>();
  perfilActualizado = output<void>();
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  camposPassword = true;
  errorMessages = []

  esAltaDesdeTaller(m: Modo): boolean {
    return (
      m === 'alta-desde-taller-CLI' ||
      m === 'alta-desde-taller-VEHI' ||
      m === 'alta-desde-taller-ORD'
    );
  }

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private usuarioService: UsuarioService) {

    // CAMPOS CLIENTE FORM CLIENTE
    this.clienteForm = this.fb.group({
      username: ['', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },

      // validador de contraseñas iguales
      {
        validators: this.passwordMatchValidator.bind(this)
      });

    // Emito el estado inicial
    this.formInvalido.emit(this.clienteForm.invalid);

    // Cada vez que cambie el estado del form, aviso al padre
    this.clienteForm.statusChanges.subscribe(() => {
      this.formInvalido.emit(this.clienteForm.invalid);
    });
  }



  ngOnInit(): void {

    // 1) Empezamos con lo que venga del padre (input)
    this.modoInterno.set(this.modo());   // si el padre usa [modo]="'editar'", arranca en 'editar'

    // 2) Si la ruta trae ?modo=..., tiene prioridad
    const modoParam = this.route.snapshot.queryParamMap.get('modo') as Modo | null;
    if (modoParam) {
      this.modoInterno.set(modoParam);   // esto pisa al valor del padre si venís por URL
    }

    this.camposPassword = !this.esAltaDesdeTaller(this.modoInterno());

    //2)CONFIGURAR SEGUN EL MODOINTERNO
    //MODO EDICION DE CLIENTE
    if (this.modoInterno() === 'editar') {
      // Traerel cliente del servicio 
      //this.clienteActual = this.clienteService.clienteActual();
      this.usuarioActual = this.usuarioService.usuarioActual();

      if (this.usuarioActual) {
        const u = this.usuarioActual;

        // Cargar datos en el formulario
        this.clienteForm.patchValue({
          username: u.username,
          nombre: u.first_name,
          apellido: u.last_name,
          dni: u.dni,
          telefono: u.telefono,
          direccion: u.direccion,
          email: u.email,
          // password y confirmPassword los dejamos vacíos
        });

        // Campos que NO quiero que se editen:
        this.clienteForm.get('username')?.disable();
        this.clienteForm.get('dni')?.disable();

        // En modo editar, la contraseña NO es obligatoria
        this.clienteForm.get('password')?.clearValidators();
        this.clienteForm.get('confirmPassword')?.clearValidators();
        this.clienteForm.updateValueAndValidity();
      }
    }

    // MODO ALTA CLIENTE DESDE TALLER
    if (this.modoInterno() === 'alta-desde-taller-CLI' ||
      this.modoInterno() === 'alta-desde-taller-VEHI' ||
      this.modoInterno() === 'alta-desde-taller-ORD') {
      // En este modo NO quiero pedir password al técnico
      // (el HTML ya oculta los campos con @if, pero el form
      //  SACO Validators.required)

      this.clienteForm.get('password')?.clearValidators();
      this.clienteForm.get('confirmPassword')?.clearValidators();
      this.clienteForm.get('password')?.updateValueAndValidity({ emitEvent: false });
      this.clienteForm.get('confirmPassword')?.updateValueAndValidity({ emitEvent: false });

      // precargar una contraseña por defecto
      // que el cliente tendrá que cambiar luego:
      this.clienteForm.patchValue({
        password: 'A1234567',
        confirmPassword: 'A1234567',
      });
    }
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

  getUsuarioDesdeForm(marcarComoTocado = false): UsuarioModel | null {
    if (marcarComoTocado) {
      this.clienteForm.markAllAsTouched();
    }

    if (this.clienteForm.invalid) {
      return null;
    }

    const raw = this.clienteForm.getRawValue();

    const datos: UsuarioModel = {
      username: raw.username,
      first_name: raw.nombre,
      last_name: raw.apellido,
      email: raw.email,
      password: raw.password,
      dni: raw.dni,
      telefono: raw.telefono,
      direccion: raw.direccion
    };

    return datos;
  }

  private getFieldName(field: string): string {
  const map: any = {
    dni: 'DNI',
    username: 'Nombre de usuario',
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Correo electrónico',
    password: 'Contraseña',
    telefono: 'Teléfono',
    direccion: 'Dirección'
  };

  return map[field] || field;
}

  //REGISTRO CLIENTE
  registrarCliente(): void {

    const datosUsuario = this.getUsuarioDesdeForm(true); // true = marca como touched

    if (!datosUsuario) {
      return;
    }
    //const raw = this.clienteForm.getRawValue();
    const form = this.clienteForm.value;

    if (this.modoInterno() === 'crear' || this.modoInterno() === 'alta-desde-taller-CLI' || this.modoInterno() === 'alta-desde-taller-VEHI' || this.modoInterno() === 'alta-desde-taller-ORD') {
      console.log('Datos de registro usuario:', datosUsuario);
      this.clienteService.crearCliente(datosUsuario).subscribe(
        {
          next: (cliente) => {
            // Éxito: cramos usuario
            console.log('cliente crado', cliente, this.modoInterno());
            this.showNotice('Cuenta creada correctamente ✔', 'success');
            //REDIRECCIONO SEGUN DESDE DONDE SE CREA EL CLIENTE
            if (this.modoInterno() === 'alta-desde-taller-CLI') {
              this.perfilCreado.emit();
              this.router.navigate(['/taller/clientes'])

            } else if (this.modoInterno() === 'alta-desde-taller-VEHI') {
              this.router.navigate(
                ['/taller/vehiculos/seleccion-vehiculo'],
                { queryParams: { modo: 'alta-desde-taller-VEHI' } }
              );

            } else if (this.modoInterno() === 'alta-desde-taller-ORD') {
              this.router.navigate(
                ['/taller/ordenes/nueva']
              );

            } else {
              this.router.navigate(['/login']);
            }
            this.clienteForm.reset();
          },

          error: (e) => {
          console.error('Error backend:', e.error);

          const backend = e.error;
          const mensajes: string[] = [];

          if (backend && typeof backend === 'object') {

            for (const field in backend) {

              // 🔹 Caso usuario anidado
              if (field === 'usuario' && typeof backend.usuario === 'object') {
                for (const subField in backend.usuario) {
                  const errores = backend.usuario[subField];
                  if (Array.isArray(errores)) {
                    errores.forEach((msg: string) => {
                      mensajes.push(
                        `${this.getFieldName(subField)}: ${msg}`
                      );
                    });
                  }
                }
              }

              // 🔹 Campos normales (dni, email, etc)
              else {
                const errores = backend[field];
                if (Array.isArray(errores)) {
                  errores.forEach((msg: string) => {
                    mensajes.push(
                      `${this.getFieldName(field)}: ${msg}`
                    );
                  });
                }
              }
            }
          }

          const msgFinal = mensajes.length
            ? mensajes.join('\n')
            : 'Ocurrió un error al crear el usuario.';

          this.showNotice(msgFinal, 'error');
        }
          /* error: (e) => {

            
            // Manejo simple de error MEJORAR-------------
            console.error('Error al crear usuario', e);
            console.log('Detalle backend:', e.error);

            const backend = e.error;
            const mensajes: string[] = [];

            // 1) Errores anidados en "usuario"
            if (backend?.usuario && typeof backend.usuario === 'object') {
              Object.values(backend.usuario).forEach((val: any) => {
                if (Array.isArray(val)) {
                  mensajes.push(...val);   // agrega todos los mensajes de ese campo
                }
              });
            }

            // 2) Errores de nivel raíz (por si el back manda otros)
            Object.entries(backend || {}).forEach(([key, val]) => {
              if (key === 'usuario') return; // ya lo procesamos arriba
              if (Array.isArray(val)) {
                mensajes.push(...val);
              }
            });

            // 3) Mensaje final
            const msgFinal = mensajes.length > 0
              ? mensajes.join('\n')
              : 'Ocurrió un error al crear el usuario.';

            this.showNotice(msgFinal, 'error');

            // FIN MANEJO ERRORES
          } */
        })
    } else {
      // Edición – endpoint de actualización
      this.usuarioService.actualizarUsuario(datosUsuario).subscribe({
        next: (usuarioActualizado) => {
          console.log('Usuario actualizado', usuarioActualizado);
          this.showNotice('Perfil actualizado correctamente ✔', 'success');
          // avisar al padre "ya terminé"
          this.perfilActualizado.emit();
        },
        error: (e) => {
          console.error('Error al actualizar perfil', e);
          this.showNotice('Ocurrió un error al actualizar el perfil', 'error');
        },
      });
    }
  }

  // verifica que password y confirmPassword coincidan
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    // Si alguno está vacío, dejamos que se encargue el 'required'
    if (!password || !confirm) {
      return null;
    }

    // Si son iguales → sin error
    if (password === confirm) {
      return null;
    }

    // Si son distintos → devolvemos un error de grupo
    return { passwordMismatch: true };
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }

  usarWrapper(): boolean {
    // wrapper solo cuando el form es una "pantalla" propia
    // (crear/editar en pantalla de clientes)
    return this.modoInterno() === 'crear' || this.modoInterno() === 'editar';
  }

  // clasesForm(): any {
  //   const desdeTaller = this.esAltaDesdeTaller(this.modoInterno());

  //   return {
  //     // padding solo cuando es card "propia"
  //     'p-8 max-w-md': this.usarWrapper(),

  //     // si viene desde taller, lo comprimís y lo centrás
  //     'max-w-xl mx-auto px-4 bg-white p-6 rounded-2xl shadow-md': !this.usarWrapper() && desdeTaller,

  //     // si está embebido en register/login, no le metas max-w ni shadow ni min-h-screen
  //   };
  // }
}