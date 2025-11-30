import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { RegistroUsuarioService } from '../../../services/usuarios/registro/registro-usuario.service';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-form-clientes',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-clientes.html',
  styleUrl: './form-clientes.css'
})
export class FormClientes {
  modo= input<'crear' | 'editar'| 'establecimiento'>('crear');  // por defecto registrar
  clienteActual: ClienteModel | null = null;  
  clienteForm: FormGroup;
  formInvalido = output<boolean>();
  private router = inject(Router);
  
  constructor(
    private fb: FormBuilder, 
    private registroUsuarioService: RegistroUsuarioService,
    private clienteService: ClienteService) 
    {

      // CAMPOS CLIENTE FORM CLIENTE
      this.clienteForm = this.fb.group({
        username: ['', Validators.required],
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        dni: ['', Validators.required],
        telefono: ['',Validators.required],
        direccion: [''],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],},
      
        // validador de contraseñas iguales
        {validators: this.passwordMatchValidator.bind(this) 
      });

      // Emito el estado inicial
      this.formInvalido.emit(this.clienteForm.invalid);

      // Cada vez que cambie el estado del form, aviso al padre
      this.clienteForm.statusChanges.subscribe(() => {
        this.formInvalido.emit(this.clienteForm.invalid);
      });
   }

  ngOnInit(): void {
    if (this.modo() === 'editar') {
      // Traerel cliente del servicio 
      this.clienteActual = this.clienteService.clienteActual();

      if (this.clienteActual) {
        const u = this.clienteActual.usuario;

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

  //REGISTRO CLIENTE
  registrarCliente(): void {

    const datosCliente = this.getUsuarioDesdeForm(true); // true = marca como touched
    
    if (!datosCliente) {
      return;
    }
    //const raw = this.clienteForm.getRawValue();
    const form = this.clienteForm.value;

    if (this.modo() === 'crear') {    
      console.log('Datos de registro cliente:', datosCliente);
      this.registroUsuarioService.crearUsuario(datosCliente).subscribe(
        {next: (cliente) => {
          // Éxito: cramos usuario
          console.log('cliente crado', cliente);
          alert('Cuenta creada correctamente ✔');
          //REDIRECCIONAR
          this.clienteForm.reset();
        },
        error: (e) => {
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

          alert(msgFinal);

          // FIN MANEJO ERRORES
        }
      })
    } else {
      // Edición – endpoint de actualización
      this.clienteService.actualizarUsuario(datosCliente).subscribe({
        next: (clienteActualizado) => {
          console.log('Cliente actualizado', clienteActualizado);
          alert('Perfil actualizado correctamente ✔');
          this.router.navigate(['/login']);
        },
        error: (e) => {
          console.error('Error al actualizar perfil', e);
          alert('No se pudo actualizar el perfil');
        },
      });
    }
  }    
  
  // verifica que password y confirmPassword coincidan
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm  = group.get('confirmPassword')?.value;

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
}