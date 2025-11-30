import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegistroTecnicoTaller, Taller } from '../../models/talleres/taller.model';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdministradorTecnicoModel, UsuarioModel } from '../../models/usuarios/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class TalleresService {
  private apiTalleresUrl = 'http://127.0.0.1:8000/api/talleres/';
  private apiTecnicos = 'http://127.0.0.1:8000/api/tecnicos/registrar-establecimiento/';
  
  readonly listaTalleres = signal<Taller[]>([]);
  readonly tallerActual = signal<Taller | null>(null);

  constructor(private http: HttpClient) {}

  //CREA DESDE LA API ADMINTEC UN TECNICO Y UN TALLER  Y LOS ASOCIA
    crearEstablecimiento(usuario:UsuarioModel, taller:Taller): Observable<AdministradorTecnicoModel> {
  
      const establecimiento: RegistroTecnicoTaller = {
        usuario : usuario,
        taller : taller
      };
      return this.http.post<AdministradorTecnicoModel>(this.apiTecnicos, establecimiento);
    }

  // Trae los talleres del backend y los guarda en el signal
  getTalleres(): Observable<Taller[]> {
    const url = this.apiTalleresUrl;
    return this.http.get<Taller[]>(url).pipe(
      tap((talleres) => {
        this.listaTalleres.set(talleres);
      })
    );
  }

  // detalle de un taller por id
  getTallerById(id: number): Observable<Taller> {
    const url = `${this.apiTalleresUrl}${id}/`;
    return this.http.get<Taller>(url).pipe(
      tap((taller) => this.tallerActual.set(taller))
    );
  }

  updateTaller(taller: Taller): Observable<Taller>{
    const tallerActual = this.tallerActual();

    if(!tallerActual || !tallerActual.id){
      throw new Error('No se puede actualizar un taller sin id');
    }
    const idTaller = tallerActual.id;
    const url = `${this.apiTalleresUrl}${idTaller}/`;
    return this.http.patch<Taller>(url,taller).pipe(
      tap((tallerActualizado)=> this.tallerActual.set(tallerActualizado))
    );
  }
}
