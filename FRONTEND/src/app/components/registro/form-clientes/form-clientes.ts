import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'; // si vas a usar [(ngModel)]
import { RegistroUsuarioService } from '../../../services/usuarios/registro/registro-usuario.service';
import { UsuarioModel } from '../../../models/usuarios/usuario.model';


@Component({
  selector: 'app-form-clientes',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-clientes.html',
  styleUrl: './form-clientes.css'
})
export class FormClientes {
  clienteForm: FormGroup;

  constructor(private fb: FormBuilder, private registroUsuarioService: RegistroUsuarioService) {

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

  
  //REGISTRO CLIENTE
  registrarCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }
    const form = this.clienteForm.value;

    const datosCliente: UsuarioModel = {
      username: form.username,
      first_name: form.nombre,      // 👈 mapeo
      last_name: form.apellido,     // 👈 mapeo
      email: form.email,
      password: form.password,
      dni: form.dni,
      telefono: form.telefono,
      direccion: form.direccion
    };
    
    console.log('Datos de registro cliente:', datosCliente);
    this.registroUsuarioService.crearUsuario(datosCliente).subscribe(
      {next: (cliente) => {
        // Éxito: cramos usuario
        console.log('cliente crado', cliente);
        //FALTA REDIRECCIONAR O MOSTRAR QUE EL USUARIO FUE CREADO CON EXITO
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