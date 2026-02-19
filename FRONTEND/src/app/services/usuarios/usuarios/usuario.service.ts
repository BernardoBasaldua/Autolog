import { Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UsuarioModel, ClienteModel, ClientePublicoModel } from '../../../models/usuarios/usuario.model';



@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUsuariosUrl = 'http://127.0.0.1:8000/api/usuarios/';
  private apiClientesUrl = 'http://127.0.0.1:8000/api/clientes/';
  private usuario: UsuarioModel | null=null;
  //private clienteService = inject(ClienteService);
  
  usuarioActual = signal<UsuarioModel | null>(null);
  clientesExistentes : ClienteModel[] = [];
  usuarios = signal<UsuarioModel[] | null>(null);

  constructor(private http: HttpClient){ }

  getMiUsuario(): Observable<UsuarioModel> {

    return this.http.get<UsuarioModel[]>(this.apiUsuariosUrl).pipe(
        tap(usuariosLogeado => {
            this.usuarioActual.set(usuariosLogeado[0])
            console.log('usuario en MEMORIA: ', this.usuarioActual())}), 
        map(usuariosLogeado => usuariosLogeado[0])  
    );
  }

      /** Devuelve todos los cliente del sistema si sos staff op superuser 
   * ACA VAMOS A TENER QUE CAMBIAR EL BACK Y LLAMAR A OTRO ENDPOINT PARA QUE CON EL TOKEN DEL CLIENTE DEVUELVA TODOS LOS CLIENTES
  */
  listarTodos(): Observable<UsuarioModel[]> {

    return this.http.get<UsuarioModel[]>(this.apiUsuariosUrl).pipe(
      tap(listaUsuarios => {
        this.usuarios.set(listaUsuarios);
        console.log('usuarios en MEMORIA:', listaUsuarios);
      }),
    );
  }

  //VER ESTO DEBERIA IR EN EL SERVICIO DE CLIENTES
  getClientes(): Observable<ClienteModel[]> {
    return this.http.get<ClienteModel[]>(this.apiClientesUrl).pipe(
      tap(clientes => this.clientesExistentes = clientes) // ← reemplaza el array
    );
  }

  getClientesPublicos(): Observable<ClientePublicoModel[]> {
  return this.http.get<ClientePublicoModel[]>(`${this.apiClientesUrl}publicos/`);
}


  

  
  actualizarUsuario(usuario: UsuarioModel): Observable<UsuarioModel> {
    const usuarioActual = this.usuarioActual();
    console.log('Usuario actual antes de actualizar:', this.usuarioActual());
    if (!usuarioActual || !usuarioActual.pk) {
      throw new Error('No hay usuarioActual con id cargado en memoria');
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

  deleteUsuario():Observable<void>{
    const user = this.usuarioActual();
    if (!user || !user.pk){
      throw new Error('No hay usuarioActual con id cargado en memoria');
    };
    return this.http.delete<void>(`${this.apiUsuariosUrl}${user.pk}`);
  }
}
