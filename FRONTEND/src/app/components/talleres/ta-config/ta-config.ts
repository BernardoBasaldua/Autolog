import { Component, inject } from '@angular/core';
import { FormClientes } from "../../registro/form-clientes/form-clientes";
import { FormTalleres } from "../../registro/form-talleres/form-talleres";
import { TalleresService } from '../../../services/talleres/talleres.service';
import { errorContext } from 'rxjs/internal/util/errorContext';
import { Router } from '@angular/router';

// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

@Component({
  selector: 'app-ta-config',
  imports: [FormClientes, FormTalleres],
  templateUrl: './ta-config.html',
  styleUrl: './ta-config.css'
})
export class TaConfig {
  serviceTaller = inject(TalleresService)
  router = inject(Router)
  editandoPerfil = false;
  editandoUsuario = false;

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  showNotice(text: string, type: NoticeType = 'error', ms = 3500) {
    this.notice = { type, text };
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => (this.notice = null), ms);
  }

  clearNotice() {
    this.notice = null;
    clearTimeout(this.noticeTimer);
  }

  editarPerfil() { this.editandoPerfil = true; }
  volver() { this.editandoPerfil = false; }
  volver1() { this.editandoUsuario = false; }
  editarUsuario() { this.editandoUsuario = true; }
  configurarMantenimiento() { /* navegar o abrir modal */ }
  agregarEmpleado() { /* flujo crear empleado/usuario */ }
  gestionarUsuarios() { /* listado de usuarios, activar/desactivar */ }

  mostrarConfirmacionEliminar = false;

  abrirConfirmacionEliminar() {
    this.mostrarConfirmacionEliminar = true;
  }

  cancelarEliminacion() {
    this.mostrarConfirmacionEliminar = false;
  }

  confirmarEliminacion() {
    this.mostrarConfirmacionEliminar = false;

    this.serviceTaller.deleteTaller().subscribe({
      next: () => {
        console.log('Taller eliminado');
        this.showNotice('Taller eliminado con éxito', 'success', 2000);
        this.router.navigate(['/login']);
      },

      error: (e) => {
        console.log('taller no borrado', e);
        this.showNotice('Error al eliminar el taller. Intentá nuevamente.', 'error');
      },

    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }

}
