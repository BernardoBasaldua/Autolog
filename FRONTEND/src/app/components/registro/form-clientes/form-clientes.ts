import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { RegistroUsuarioService } from '../../../services/usuarios/registro/registro-usuario.service';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { ClienteService } from '../../../services/usuarios/clientes/cliente.service';



@Component({
  selector: 'app-form-clientes',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-clientes.html',
  styleUrl: './form-clientes.css'
})
export class FormClientes {
  modo= input<'crear' | 'editar'>('crear');  // por defecto registrar
  clienteActual: ClienteModel | null = null;  
  clienteForm: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private registroUsuarioService: RegistroUsuarioService,
    private clienteService: ClienteService
  ) {

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
  
  //REGISTRO CLIENTE
  registrarCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }
    //const raw = this.clienteForm.getRawValue();
    const form = this.clienteForm.value;

    const datosCliente: UsuarioModel = {
      username: form.username,
      first_name: form.nombre,      // mapeo
      last_name: form.apellido,     // mapeo
      email: form.email,
      password: form.password,
      dni: form.dni,
      telefono: form.telefono,
      direccion: form.direccion
    };

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
          //REDIRECCIONAR
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