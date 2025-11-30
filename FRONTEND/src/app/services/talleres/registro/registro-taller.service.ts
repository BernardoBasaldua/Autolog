import { Injectable } from '@angular/core';
import { AdministradorTecnicoModel, UsuarioModel } from '../../../models/usuarios/usuario.model';
import { RegistoTecnicoTaller, Taller } from '../../../models/talleres/taller.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegistroTallerService {
  private apiAdminTec = 'http://127.0.0.1:8000/api/tecnicos/registrar-establecimiento/';

  private usuario: UsuarioModel | null=null;
  private taller: Taller | null = null;
  
  constructor(private http: HttpClient){}

  crearEstablecimiento(usuario:UsuarioModel, taller:Taller): Observable<AdministradorTecnicoModel> {

    const establecimiento: RegistoTecnicoTaller = {
      usuario : usuario,
      taller : taller
    };
    return this.http.post<AdministradorTecnicoModel>(this.apiAdminTec, establecimiento);
  }

}
