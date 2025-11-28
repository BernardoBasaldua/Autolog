// cliente.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClienteModel, UsuarioModel } from '../../../models/usuarios/usuario.model';

import { Observable, map, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiClientesUrl = 'http://127.0.0.1:8000/api/clientes/';
  private apiUsuariosUrl = 'http://127.0.0.1:8000/api/usuarios/';

  // estado en memoria
  clienteActual = signal<ClienteModel | null>(null);

  constructor(private http: HttpClient) {}

  /** Devuelve el cliente asociado al usuario logueado */
  getMiCliente(): Observable<ClienteModel> {
    // ClienteViewSet hace filter(usuario=request.user),
    // así que GET /api/clientes/ debería devolver una LISTA con 1 elemento.
    return this.http.get<ClienteModel[]>(this.apiClientesUrl).pipe(
      tap(listaCliente => {
        this.clienteActual.set(listaCliente[0]);
        console.log('cliente:', listaCliente[0]);
      }),
      map(listaCliente => listaCliente[0])  // me quedo con el primer (y único) cliente
    );
  }
  //OJO QUE ACTUALIZA SOLO EL USUARIO
  actualizarUsuario(usuario: UsuarioModel): Observable<UsuarioModel> {
    const actual = this.clienteActual();
    
    if (!actual || !actual.usuario || !actual.usuario.pk) {
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

    const userId = actual.usuario.pk;
    const url = `${this.apiUsuariosUrl}${userId}/`;

    return this.http.patch<UsuarioModel>(url, usuarioPayload).pipe(
      tap(usuarioActualizado => {
        console.log('Usuario actualizado desde backend:', usuarioActualizado);

        const clienteAnterior = this.clienteActual();
        if (!clienteAnterior){
          console.warn('No hay clienteActual en memoria al actualizar');  
        return;}

        const clienteActualizado : ClienteModel = {
          ...clienteAnterior,
          usuario: {
            ...clienteAnterior.usuario,
            ...usuarioActualizado
          }
        }


        this.clienteActual.set(clienteActualizado);
        console.log('cliente actualizado:', clienteActualizado);
      })
    );
  }

}
