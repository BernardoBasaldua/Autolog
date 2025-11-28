import { Component } from '@angular/core';

@Component({
  selector: 'app-cli-config',
  standalone: true,
  imports: [],
  templateUrl: './cli-config.html',
  styleUrl: './cli-config.css'
})
export class CliConfig {

  editarPerfil() {
    // Más adelante podés:
    // - abrir un modal
    // - o navegar a clienteForm
    console.log('Editar perfil clickeado');
  }

  eliminarCuenta() {
    const confirmar = confirm(
      '¿Seguro que querés eliminar tu cuenta? Esta acción es permanente.'
    );

    if (!confirmar) return;

    // Acá después llamás a un servicio:
    // this.usuarioService.eliminarCuenta().subscribe(...)
    console.log('Eliminar cuenta confirmado');
  }
}
