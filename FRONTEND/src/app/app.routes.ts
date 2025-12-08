import { Routes } from '@angular/router';

import { CliInicio } from './components/clientes/cli-inicio/cli-inicio';
import { Historial } from './components/clientes/cli-inicio/historial/historial';
import { CliTurnos } from './components/clientes/cli-turnos/cli-turnos';
import { CliTalleres } from './components/clientes/cli-talleres/cli-talleres';
import { CliPedirTurno } from './components/clientes/cli-talleres/cli-pedir_turno/cli-p_turno';
import { CliSelTurno } from './components/clientes/cli-talleres/cli-pedir_turno/cli-sel-turno/cli-sel-turno';
import { CliPm } from './components/clientes/cli-pm/cli-pm';
import { CliConfig } from './components/clientes/cli-config/cli-config';

import { TaOrdenes } from './components/talleres/ta-ordenes/ta-ordenes';
import { TaNewOrder } from './components/talleres/ta-ordenes/ta-new-order/ta-new-order';
import { TaClientes } from './components/talleres/ta-clientes/ta-clientes';
import { TaVehiculos } from './components/talleres/ta-vehiculos/ta-vehiculos';
import { TaTurnos } from './components/talleres/ta-turnos/ta-turnos';
import { TaDetail } from './components/talleres/ta-turnos/ta-detail/ta-detail';
import { TaConfig } from './components/talleres/ta-config/ta-config';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Login } from './layouts/login/login';
import { Permisos } from './components/clientes/cli-inicio/permisos/permisos';
import { Registrarse } from './components/registro/registrarse/registrarse';
import { FormClientes } from './components/registro/form-clientes/form-clientes';
import { SeleccionUsuario } from './components/seleccion/seleccion-usuario/seleccion-usuario';
import { SeleccionVehiculo } from './components/seleccion/seleccion-vehiculos/seleccion-vehiculos';
import { FormVehiculos } from './components/registro/form-vehiculos/form-vehiculos';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // Ruta por defecto
    pathMatch: 'full'
  },
  {
    path: '',
    component: MainLayout, // Layout con aside y header
    children: [
      { path: 'cliente', component: CliInicio },
      { path: 'cliente/permisos/:vehiculoId', component: Permisos },
      { path: 'cliente/seleccion-usuario/:vehiculoId', component: SeleccionUsuario, data: { modo: 'permisos' } },
      { path: 'cliente/historial/:vehiculoId', component: Historial },
      { path: 'cliente/turnos', component: CliTurnos },
      { path: 'cliente/talleres', component: CliTalleres },
      { path: 'cliente/talleres/:tallerId/pedir_turno', component: CliPedirTurno },
      { path: 'cliente/talleres/:tallerId/pedir_turno/:turnoFecha/seleccionar', component: CliSelTurno },
      { path: 'cliente/pm', component: CliPm },
      { path: 'cliente/config', component: CliConfig },
      { path: 'cliente/vehiculos/seleccion-vehiculo', component: SeleccionVehiculo },

      { path: 'taller/ordenes', component: TaOrdenes },
      { path: 'taller/ordenes/nueva', component: TaNewOrder },
      { path: 'taller/clientes', component: TaClientes },
      { path: 'taller/clientes/seleccionUsuario', component: SeleccionUsuario },
      { path: 'taller/form-cliente', component: FormClientes },
      { path: 'taller/form-vehiculo', component: FormVehiculos },

      { path: 'taller/vehiculos', component: TaVehiculos },
      { path: 'taller/vehiculos/seleccion-vehiculo', component: SeleccionVehiculo },
      { path: 'taller/turnos', component: TaTurnos },
      { path: 'taller/turnos/detalle', component: TaDetail },
      { path: 'taller/config', component: TaConfig },

      

    ]
  },
  {
    path: '',
    component: AuthLayout, // Layout solo para login
    children: [
      { path: 'login', component: Login },
      { path: 'registrarse', component: Registrarse }
    ]
  }
];
