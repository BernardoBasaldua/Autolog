import { Injectable, signal } from '@angular/core';
import { AdministradorTecnicoModel } from '../../../models/usuarios/usuario.model';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminTecService {

  private apiTecnicosUrl = 'http://127.0.0.1:8000/api/tecnicos/';
  private apiUsuariosUrl = 'http://127.0.0.1:8000/api/usuarios/';

  // estado en memoria
  tecnicoActual = signal<AdministradorTecnicoModel| null>(null);

  constructor(private http: HttpClient) {}

  /** Devuelve el cliente asociado al usuario logueado */
  getMiTecnico(): Observable<AdministradorTecnicoModel> {
    // AdministradorTecnicoViewSet hace filter(usuario=request.user),
    // así que GET /api/tecnicos/ debería devolver una LISTA con 1 elemento.
    return this.http.get<AdministradorTecnicoModel[]>(this.apiTecnicosUrl).pipe(
      tap(adminTecnico => {
        this.tecnicoActual.set(adminTecnico[0]);
        console.log('tecnico:', adminTecnico[0]);
      }),
       map(adminTecnico => adminTecnico[0])  // me quedo con el primer (y único) tecnico
    );
  }
  //OJO QUE ACTUALIZA SOLO EL USUARIO
  // actualizarUsuario(usuario: UsuarioModel): Observable<UsuarioModel> {
  //   const actual = this.clienteActual();
    
  //   if (!actual || !actual.usuario || !actual.usuario.pk) {
  //     throw new Error('No hay clienteActual con id cargado en memoria');
  //   }

  //   const usuarioPayload: any = {
  //     first_name: usuario.first_name,
  //     last_name: usuario.last_name,
  //     email: usuario.email,
  //     telefono: usuario.telefono,
  //     direccion: usuario.direccion,
  //   };

  //   if (usuario.password && usuario.password.trim() !== '') {
  //     usuarioPayload.password = usuario.password;
  //   }

  //   const userId = actual.usuario.pk;
  //   const url = `${this.apiUsuariosUrl}${userId}/`;

  //   return this.http.patch<UsuarioModel>(url, usuarioPayload).pipe(
  //     tap(usuarioActualizado => {
  //       console.log('Usuario actualizado desde backend:', usuarioActualizado);

  //       const clienteAnterior = this.clienteActual();
  //       if (!clienteAnterior){
  //         console.warn('No hay clienteActual en memoria al actualizar');  
  //       return;}

  //       const clienteActualizado : ClienteModel = {
  //         ...clienteAnterior,
  //         usuario: {
  //           ...clienteAnterior.usuario,
  //           ...usuarioActualizado
  //         }
  //       }


  //       this.clienteActual.set(clienteActualizado);
  //       console.log('cliente actualizado:', clienteActualizado);
  //     })
  //   );
  // }

  //   /** Elimina el CLIENTE actual: DELETE /api/clientes/<id>/ */
  // eliminarCuenta(): Observable<void> {
  //   const actual = this.clienteActual();

  //   // Si ya tenemos el cliente cargado en memoria, usamos ese id
  //   if (actual && actual.id) {        // si tu modelo usa "pk", cambiá a actual.pk
  //     const url = `${this.apiClientesUrl}${actual.id}/`;   // → http://127.0.0.1:8000/api/clientes/1/
  //     return this.http.delete<void>(url);
  //   }

  //   // Si clienteActual es null, primero lo pedimos al backend
  //   return this.getMiCliente().pipe(
  //     switchMap(cliente => {
  //       if (!cliente.id) {           // si es pk, cambiá a cliente.pk
  //         throw new Error('El cliente no tiene id definido');
  //       }
  //       const url = `${this.apiClientesUrl}${cliente.id}/`;
  //       return this.http.delete<void>(url);
  //     })
  //   );
  // }
  
}
