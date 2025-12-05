import { Component, inject } from '@angular/core';
import { FormClientes } from "../../registro/form-clientes/form-clientes";
import { FormTalleres } from "../../registro/form-talleres/form-talleres";
import { TalleresService } from '../../../services/talleres/talleres.service';
import { errorContext } from 'rxjs/internal/util/errorContext';
import { Router } from '@angular/router';

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
  editandoUsuario= false;

  editarPerfil() { this.editandoPerfil = true; }
  volver() { this.editandoPerfil = false; }
  volver1() { this.editandoUsuario = false; }
  editarUsuario() { this.editandoUsuario= true; }
  configurarMantenimiento() { /* navegar o abrir modal */ }
  agregarEmpleado() { /* flujo crear empleado/usuario */ }
  gestionarUsuarios() { /* listado de usuarios, activar/desactivar */ }

  // ESTA FUNCION BORRA, EL TALLER, TODOS LOS TECNICOS Y EL USUARIO QUE LLAMA A ESTA FUNCION
  // NO SE BORRAN LOS USUARIOS DE LOS TECNICOS QUE SON CLIENTES
  // VER BIEN MAS ADELANTE
  eliminarCuenta() { this.serviceTaller.deleteTaller().subscribe(
    {
      next: () => {console.log('Taller eliminado');
      alert('establecimiento borrado xon exito');
      this.router.navigate(['/login']);},
      
      error: (e) => {console.log('taller no borrado');},

    }); 
  }

}
