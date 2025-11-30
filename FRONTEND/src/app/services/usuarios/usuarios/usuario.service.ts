import { Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UsuarioModel } from '../../../models/usuarios/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUsuariosUrl = 'http://127.0.0.1:8000/api/usuarios/';
  private usuario: UsuarioModel | null=null;
  //private clienteService = inject(ClienteService);

  usuarioActual = signal<UsuarioModel | null>(null);


  constructor(private http: HttpClient){ }

  getMiUsuario(): Observable<UsuarioModel> {

    return this.http.get<UsuarioModel[]>(this.apiUsuariosUrl).pipe(
        tap(usuariosLogeado => {
            this.usuarioActual.set(usuariosLogeado[0])
            console.log('usuario en MEMORIA: ', this.usuarioActual())}), 
        map(usuariosLogeado => usuariosLogeado[0])
        
    );
    
  }

  
  actualizarUsuario(usuario: UsuarioModel): Observable<UsuarioModel> {
    const usuarioActual = this.usuarioActual();
    console.log('Usuario actual antes de actualizar:', this.usuarioActual());
    if (!usuarioActual || !usuarioActual.pk) {
      throw new Error('No hay clienteActual con id cargado en memoria');
    }

    const usuarioPayload: any = {
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
    };

    if (usuario.password && usuario.password.trim() !== '') {
      usuarioPayload.password = usuario.password;
    }

    const userId = usuarioActual.pk;
    const url = `${this.apiUsuariosUrl}${userId}/`;

    return this.http.patch<UsuarioModel>(url, usuarioPayload).pipe(
      tap(usuarioActualizado => {
        console.log('Usuario actual despues de actualizar:', this.usuarioActual());
        console.log('Usuario actualizado en backend:', usuarioActualizado);
        this.usuarioActual.set(usuarioActualizado);
      })
    );
  }

}

// const clienteAnterior = this.clienteService.clienteActual();
//         if (!clienteAnterior){
//           console.warn('No hay clienteActual en memoria al actualizar');  
//         return;}

//         const clienteActualizado : ClienteModel = {
//           ...clienteAnterior,
//           usuario: {
//             ...clienteAnterior.usuario,
//             ...usuarioActualizado
//           }
//         }


//         this.clienteActual.set(clienteActualizado);
//         console.log('cliente actualizado:', clienteActualizado);