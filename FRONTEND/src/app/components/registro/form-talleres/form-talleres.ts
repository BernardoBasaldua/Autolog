import { Component, inject, input, ViewChild } from '@angular/core';
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
import { TalleresService } from '../../../services/talleres/talleres.service';

// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

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
  private servicioTaller = inject(TalleresService)
  tallerActual = this.servicioTaller.tallerActual;
  tallerForm: FormGroup;

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;


  constructor(
    private fb: FormBuilder,
    private router: Router,
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
    const t = this.tallerActual();

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

  showNotice(text: string, type: NoticeType = 'error', ms = 3500) {
    this.notice = { type, text };
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => (this.notice = null), ms);
  }

  clearNotice() {
    this.notice = null;
    clearTimeout(this.noticeTimer);
  }

  onSubmit(): void {
    if (this.tallerForm.invalid) {
      this.tallerForm.markAllAsTouched();
      return;
    }

    //LEVANTAMOS LOS DATOS FORM TALLER
    const datosTaller = this.tallerForm.value;


    //LLAMOS A SERVICIO CREAR 
    if (this.modo() === 'crear') {
      // datos del usuario admin técnico (form hijo)
      const datosUsuario = this.formClientes.getUsuarioDesdeForm(true);
      if (!datosUsuario) {
        this.showNotice('Revisá los datos del administrador técnico', 'error', 3500);
        return;
      }
      console.log('Paso 1 datos capturados, llamando al servicio CREAR:', datosTaller);
      this.servicioTaller.crearEstablecimiento(datosUsuario,datosTaller).subscribe({
        next:(nuevoTaller)=>{
          console.log('servicio registro taller responde: ', nuevoTaller);
          this.showNotice('Establecimiento creado exitosamente', 'success', 2500);
          this.router.navigate(['/login']);
        },
        error: (e: any) => {
          console.error('Error al crear establecimiento', e);

          const backend = e?.error; // <-- JSON del back
          console.log('Detalle backend:', backend);

          const mensajes: string[] = [];

          // Caso nuevo: { origen, errors: { campo: [mensajes] } }
          if (backend?.errors && typeof backend.errors === 'object') {
            Object.values(backend.errors).forEach((val: any) => {
              if (Array.isArray(val)) mensajes.push(...val);
              else if (typeof val === 'string') mensajes.push(val);
            });
          }

          // Fallback: errores a nivel raíz tipo { field: ["msg"] }
          if (mensajes.length === 0 && backend && typeof backend === 'object') {
            Object.entries(backend).forEach(([key, val]: [string, any]) => {
              if (key === 'errors' || key === 'origen') return;
              if (Array.isArray(val)) mensajes.push(...val);
            });
          }

          const origen = backend?.origen ? ` (${backend.origen})` : '';
          const msgFinal = mensajes.length
            ? `No se pudo crear${origen}:\n\n${mensajes.join('\n')}`
            : `Ocurrió un error al crear el establecimiento${origen}.`;

          // Popup simple (después lo cambiás por MatDialog/Toast)
          this.showNotice(msgFinal, 'error', 5000);
        }
        
      });

    } else {//LLAMOS A SERVICIO ACTUALIZAR
      console.log('Actualizar establecimiento:', datosTaller);
      //servicio que haga PATCH del taller
      console.log('Paso 1 datos capturados, llamando al servicio ACTUALIZAR:', datosTaller);
      this.servicioTaller.updateTaller(datosTaller).subscribe({
        next:(nuevoTaller)=>{
          console.log('servicio registro taller responde: ', nuevoTaller);
          this.showNotice('Establecimiento actualizado exitosamente', 'success', 2500);
          this.router.navigate(['/taller/ordenes']);
        },
        error: (e) => {
          console.error('Error al ACTUALIZAR establecimiento');
          this.showNotice('Ocurrió un error al actualizar el establecimiento', 'error', 3500);
        },
      });

    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }
}
