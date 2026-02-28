import { Component } from '@angular/core';
import { FormClientes } from "../../registro/form-clientes/form-clientes";
import { CommonModule } from '@angular/common';
import { ClienteService } from "../../../services/usuarios/clientes/cliente.service";
import { Router } from '@angular/router';
import { AuthService } from "../../../services/auth/auth.service";

// tipo para mensajes de notificación (se usa si hace falta en la clase)
type NoticeType = 'error' | 'info' | 'success';

@Component({
  selector: 'app-cli-config',
  standalone: true,
  imports: [FormClientes, CommonModule],
  templateUrl: './cli-config.html',
  styleUrl: './cli-config.css'
})
export class CliConfig {

  editandoPerfil = false;

  // Cartel de error para login de Google
  notice: { type: NoticeType; text: string } | null = null;
  private noticeTimer: any;

  constructor(
    private clienteService: ClienteService,
    private authService: AuthService,
    private router: Router
  ) { }

  showNotice(text: string, type: NoticeType = 'error', ms = 3500) {
    this.notice = { type, text };
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => (this.notice = null), ms);
  }

  clearNotice() {
    this.notice = null;
    clearTimeout(this.noticeTimer);
  }

  editarPerfil() {
    this.editandoPerfil = true;
    console.log('Editar perfil clickeado');
  }

  volver() {
    this.editandoPerfil = false;
  }

  mostrarConfirmacionEliminar = false;

  abrirConfirmacionEliminar() {
    this.mostrarConfirmacionEliminar = true;
  }

  cancelarEliminacion() {
    this.mostrarConfirmacionEliminar = false;
  }

  confirmarEliminacion() {
    this.mostrarConfirmacionEliminar = false;

    this.clienteService.eliminarCuenta().subscribe({
      next: () => {
        this.showNotice('Tu cuenta se eliminó correctamente.', 'success', 2500);

        setTimeout(() => {
          this.authService.logout();
        }, 1200);
      },
      error: () => {
        this.showNotice(
          'Ocurrió un error al eliminar la cuenta. Intentá nuevamente.',
          'error',
          3500
        );
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.noticeTimer);
  }

}