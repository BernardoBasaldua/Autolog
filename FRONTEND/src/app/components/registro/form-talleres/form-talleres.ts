import { Component, input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Taller } from '../../../models/talleres/taller.model';
import { FormClientes } from "../form-clientes/form-clientes";
import { RegistroTallerService } from '../../../services/talleres/registro/registro-taller.service';

@Component({
  selector: 'app-form-talleres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormClientes],
  templateUrl: './form-talleres.html',
  styleUrl: './form-talleres.css',
})
export class FormTalleres {
  // crear | editar
  modo = input<'crear' | 'editar'>('crear');
  formClienteInvalido = true;   // arranco en true para que el botón esté deshabilitado de entrada
  
  //referencia al componente hijo
  @ViewChild(FormClientes) formClientes!: FormClientes;

  //  para precargar al editar un taller
  tallerInicial = input<Taller | null>(null);
  tallerForm: FormGroup;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private servicioRegistroTaller : RegistroTallerService       // para redireccionar si querés hacer 2 pasos
  ) {
    this.tallerForm = this.fb.group({
      nombre: ['', Validators.required],
      cuit: ['', Validators.required],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      descripcion: [''],
    });
  }

  ngOnInit(): void {
    const t = this.tallerInicial();

    if (this.modo() === 'editar' && t) {
      this.tallerForm.patchValue({
        nombre: t.nombre,
        cuit: t.cuit,
        telefono: t.telefono,
        direccion: t.direccion,
        descripcion: t.descripcion ?? '',
      });
    }
  }

  onSubmit(): void {
    if (this.tallerForm.invalid) {
      this.tallerForm.markAllAsTouched();
      return;
    }

    // pedirle los datos al form hijo
    const datosUsuario = this.formClientes.getUsuarioDesdeForm(true);
    if (!datosUsuario) {
      alert('Revisá los datos del administrador técnico');
      return;
    }
    const datosTaller = this.tallerForm.value;


    //LLAMOS A SERVICIO CREAR O ACTUALIZAR SEGUN CORRESPONDA
    if (this.modo() === 'crear') {
      console.log('Paso 1 datos capturados, llamando al servicio:', datosTaller);
      this.servicioRegistroTaller.crearEstablecimiento(datosUsuario,datosTaller).subscribe({
        next:(nuevoTaller)=>{
          console.log('servicio registro taller responde: ', nuevoTaller);
          alert('Establecimiento creado');
          this.router.navigate(['/login']);
        },
        error: (e) => {
          console.error('Error al crear establecimiento');
          alert('No se pudo crear establecimiento');
        },
      });

    } else {
      console.log('Actualizar establecimiento:', datosTaller);
      //servicio que haga PATCH del taller
    }
  }
}
