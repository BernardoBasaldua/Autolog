import { Component } from '@angular/core';
import { FormClientes } from "../../registro/form-clientes/form-clientes";
import { CommonModule } from '@angular/common';
import { ClienteService } from "../../../services/usuarios/clientes/cliente.service";
import { Router } from '@angular/router';
import { AuthService } from "../../../services/auth/auth.service";


@Component({
  selector: 'app-cli-config',
  standalone: true,
  imports: [FormClientes, CommonModule],
  templateUrl: './cli-config.html',
  styleUrl: './cli-config.css'
})
export class CliConfig {

  editandoPerfil = false;

  constructor(
    private clienteService: ClienteService,
    private authService: AuthService,
    private router: Router
  ) {}

  editarPerfil() {
    this.editandoPerfil = true;
    console.log('Editar perfil clickeado');
  }

  volver() {
    this.editandoPerfil = false;
  }

  eliminarCuenta() {
    const confirmar = confirm(
      '¿Seguro que querés eliminar tu cuenta? Esta acción es permanente.'
    );

    if (!confirmar) return;
    
    this.clienteService.eliminarCuenta().subscribe({
      next: () => {
        console.log('Cuenta eliminada correctamente en el backend');
        // 1) Notificás
        alert('Tu cuenta se eliminó correctamente.');
        // acá podrías limpiar sesión si tenés AuthService.logout()
        this.authService.logout();
        
      },
      error: (err) => {
        console.error('Error al eliminar la cuenta', err);
        alert('Ocurrió un error al eliminar la cuenta. Intentá nuevamente.');
      }
    });

    // Acá después llamás a un servicio:
    // this.usuarioService.eliminarCuenta().subscribe(...)
    //console.log('Eliminar cuenta confirmado');
  }

 
}