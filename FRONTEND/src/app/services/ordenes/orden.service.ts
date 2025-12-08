import { Injectable } from '@angular/core';
import { OrdenDeTrabajo, OrdenDeTrabajoCreatePayload } from '../../models/orden/orden.models';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private apiOrdenesUrl = 'http://127.0.0.1:8000/api/ordenes/';
  
  
  constructor(private http: HttpClient) {}
  
  crearOrden(orden:OrdenDeTrabajoCreatePayload): Observable<OrdenDeTrabajo> {
    
    const url = this.apiOrdenesUrl;
    return this.http.post<OrdenDeTrabajo>(url, orden);
  }
  
}
