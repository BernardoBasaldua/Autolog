# TESTSERVICES.md — Plan de pruebas de servicios (Autolog)

Documento operativo para probar los servicios REST de Autolog en **Postman**. Contiene
setup del entorno, seed de datos mínimo y **5 casos de prueba** ejecutables paso a paso,
con asserts automatizables.

> **Convención:** todos los ejemplos asumen `base_url = http://127.0.0.1:8000`.
> Las variables entre `{{...}}` corresponden a la colección Postman provista
> (`Autolog.postman_collection.json` + `Autolog.postman_environment.json`).

---

## 1. Objetivo y alcance

Validar mediante pruebas funcionales de servicio (caja negra sobre el backend Django)
los siguientes 5 requerimientos del ERS:

| # | ID | Requerimiento | Endpoint |
|---|----|---------------|----------|
| 1 | AU-01 | Autenticación JWT con claim `role` | `POST /api/token/` |
| 2 | VH-04 | Transferencia de titularidad de vehículo | `POST /api/vehiculo/{id}/transferir-titularidad/` |
| 3 | OT-01 | Creación de Orden de Trabajo (cálculo automático de próximo service en preventivo) | `POST /api/ordenes/` |
| 4 | OT-04 | Anulación de OT respetando máquina de estados | `POST /api/ordenes/{id}/anular/` |
| 5 | TU-02 | Consulta de turnos asignados por agenda | `GET /api/agendas/{id}/turnos-asignados/?fecha=YYYY-MM-DD` |

> **Nota:** se evitan deliberadamente los endpoints `/api/tecnicos/...` por decisión del
> equipo (el rol de técnico responsable se trata como un `CharField` dentro de la OT).

---

## 2. Setup del entorno (Backend Django local)

### 2.1 Levantar el backend

```powershell
cd C:\Users\bbasaldua\Documents\Autolog\BACKEND
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py loaddata fixtures/base_data.json
python manage.py runserver
```

Servidor disponible en `http://127.0.0.1:8000/`. Admin en `/admin/`.

### 2.2 Verificar que está vivo

```bash
curl http://127.0.0.1:8000/api/agendas/
# Debe responder JSON (vacío o con agendas)
```

---

## 3. Setup de Postman

### 3.1 Importar archivos

1. Abrir Postman → **Import** → seleccionar:
   - `C:\Users\bbasaldua\Documents\Autolog\Autolog.postman_collection.json`
   - `C:\Users\bbasaldua\Documents\Autolog\Autolog.postman_environment.json`
2. En la esquina superior derecha, activar el environment **"Autolog Local"**.

### 3.2 Variables de la colección

Estas variables se usan a lo largo de los tests. Algunas se llenan **automáticamente** por
los scripts de test (ver columna "Origen"):

| Variable | Descripción | Origen |
|----------|-------------|--------|
| `base_url` | URL del backend | manual (default: `http://127.0.0.1:8000`) |
| `admin_username` | superuser para tareas administrativas | manual (default: `admin`) |
| `admin_password` | password del superuser | manual |
| `cliente_username` | usuario cliente que es titular del vehículo | manual (default: `cliente1`) |
| `cliente_password` | password del cliente | manual |
| `tecnico_username` | usuario técnico (`is_staff=True`) | manual (default: `tecnico1`) |
| `tecnico_password` | password del técnico | manual |
| `access_token` | JWT access | **auto** (Test #1) |
| `refresh_token` | JWT refresh | **auto** (Test #1) |
| `role` | claim del token | **auto** (Test #1) |
| `cliente_origen_id` | ID del cliente titular original | manual (del seed) |
| `cliente_destino_id` | ID del cliente que recibe el vehículo | manual (del seed) |
| `vehiculo_id` | ID del vehículo a transferir / usar en OT | manual (del seed) |
| `taller_id` | ID del taller donde se crea la OT | manual (del seed) |
| `agenda_id` | ID de la agenda del taller | **auto** (Test #3) |
| `orden_id` | ID de la OT creada | **auto** (Test #3) |
| `orden_pasada_id` | ID de OT con `fecha_turno` ya pasada (para anular) | manual (del seed) |

---

## 4. Datos de prueba (seed mínimo)

> Estas pruebas requieren datos en BD que **no se crean por endpoint** (porque evitamos
> los endpoints `/api/tecnicos/...`). Se crean por shell o admin panel **una sola vez**.

### 4.1 Crear superuser

```powershell
python manage.py createsuperuser
# username: admin
# email: admin@autolog.test
# password: Admin123!
```

→ Anotar en variable `admin_username` / `admin_password`.

### 4.2 Crear el resto del seed por Django shell

```powershell
python manage.py shell
```

Pegar este script (ajustar passwords según preferencia):

```python
from django.utils import timezone
from datetime import timedelta
from usuarios.models import Usuario
from usuarios.models.cliente import Cliente
from usuarios.models.administradorTecnico import AdministradorTecnico
from talleres.models.taller import Taller
from vehiculos.models import Marca, Modelo, Vehiculo
from ordenes.models import OrdenDeTrabajo

# --- Cliente origen (titular del vehiculo) ---
u_cliente = Usuario.objects.create_user(
    username="cliente1", password="Cliente123!",
    first_name="Ana", last_name="Cliente",
    email="cliente1@autolog.test", dni="20111222",
    telefono="1140000001", direccion="Calle Cliente 1",
)
cli_origen = Cliente.objects.create(usuario=u_cliente)

# --- Cliente destino ---
u_cliente2 = Usuario.objects.create_user(
    username="cliente2", password="Cliente123!",
    first_name="Bruno", last_name="Destino",
    email="cliente2@autolog.test", dni="20111223",
    telefono="1140000002", direccion="Calle Cliente 2",
)
cli_destino = Cliente.objects.create(usuario=u_cliente2)

# --- Tecnico + Taller (sin usar /api/tecnicos/registrar-establecimiento/) ---
u_tec = Usuario.objects.create_user(
    username="tecnico1", password="Tecnico123!",
    first_name="Carlos", last_name="Tecnico",
    email="tecnico1@autolog.test", dni="20111224",
    telefono="1140000003", direccion="Calle Tecnico 1",
    is_staff=True,
)
taller = Taller.objects.create(
    nombre="Taller de Pruebas", descripcion="Seed para tests",
    telefono="1140009999", direccion="Av. Test 1234",
)
AdministradorTecnico.objects.create(usuario=u_tec, taller=taller)
# La agenda se crea automáticamente por signal al crear el Taller.

# --- Marca / Modelo / Vehiculo asociado al cliente origen ---
marca, _ = Marca.objects.get_or_create(nombre="Toyota")
modelo, _ = Modelo.objects.get_or_create(nombre="Hilux", marca=marca)
veh = Vehiculo.objects.create(
    patente="TEST001", anio=2020, kilometraje_actual=40000,
    intervalo_servicio_meses=6, intervalo_servicio_km=10000,
    modelo=modelo, propietario=cli_origen,
)

# --- OT con fecha pasada para poder probar "anular" (Test #4) ---
ot_pasada = OrdenDeTrabajo.objects.create(
    cliente=cli_origen, vehiculo=veh, taller=taller,
    fecha_turno=timezone.now() - timedelta(hours=2),
    kilometraje=40500, mantenimiento="correctivo",
    responsable_tecnico="Carlos Tecnico",
)

print("=== IDs para Postman ===")
print(f"cliente_origen_id  = {cli_origen.id}")
print(f"cliente_destino_id = {cli_destino.id}")
print(f"vehiculo_id        = {veh.id}")
print(f"taller_id          = {taller.id}")
print(f"orden_pasada_id    = {ot_pasada.id}")
```

**Anotar los IDs impresos** y copiarlos a las variables del environment Postman.

---

## 5. Casos de prueba

> **Orden de ejecución recomendado:** 1 → 3 → 5 → 4 → 2.
> El Test #2 va último porque modifica el dueño del vehículo (afecta consultas posteriores
> sobre el mismo vehículo).

---

### 5.1 [AU-01] Login JWT

**Endpoint:** `POST /api/token/`
**Auth:** AllowAny (público)
**Criterio de aceptación:**
- Con credenciales válidas devuelve `access`, `refresh` y `role`.
- El claim `role` debe ser `admin` para superuser, `tecnico` para `is_staff=True`,
  `cliente` para usuarios normales.
- Con credenciales inválidas devuelve 401.

> **Nota sobre el claim `role`:** se setea en `BACKEND/auth/serializers.py:10-21`
> (`MyTokenObtainPairSerializer.get_token()`) pero el backend **nunca lo lee** para
> autorizar. Los endpoints autorizan vía `is_staff`/`is_superuser` y las relaciones
> ORM `usuario.tecnico` / `usuario.cliente`. El `role` solo lo consume el frontend
> Angular para renderizar la UI según el tipo de usuario. Por eso el assert sobre
> `role` en este test es una **validación de formato del response**, no una
> dependencia funcional de las pruebas #2 a #5.

#### Request (caso feliz — login como técnico)

```http
POST {{base_url}}/api/token/
Content-Type: application/json

{
  "username": "{{tecnico_username}}",
  "password": "{{tecnico_password}}"
}
```

#### Respuesta esperada (200 OK)

```json
{
  "access": "eyJ0eXAiOiJKV1Qi...",
  "refresh": "eyJ0eXAiOiJKV1Qi...",
  "role": "tecnico"
}
```

#### Asserts (Tests tab)

```js
pm.test("Status 200", () => pm.response.to.have.status(200));

const json = pm.response.json();

pm.test("Tiene access token", () => pm.expect(json).to.have.property("access"));
pm.test("Tiene refresh token", () => pm.expect(json).to.have.property("refresh"));
pm.test("Tiene claim role", () => pm.expect(json.role).to.be.oneOf(["admin", "tecnico", "cliente"]));

pm.collectionVariables.set("access_token", json.access);
pm.collectionVariables.set("refresh_token", json.refresh);
pm.collectionVariables.set("role", json.role);
```

#### Casos negativos

| Caso | Cambio en el body | Status esperado |
|------|-------------------|-----------------|
| Password incorrecta | `"password": "wrongpass"` | 401 |
| Usuario inexistente | `"username": "no-existe"` | 401 |
| Body vacío | `{}` | 400 |

---

### 5.2 [VH-04] Transferencia de titularidad de vehículo

**Endpoint:** `POST /api/vehiculo/{{vehiculo_id}}/transferir-titularidad/`
**Auth:** Bearer (debe ser el cliente **titular actual** del vehículo)
**Criterio de aceptación:**
- Solo el cliente titular puede transferir.
- Tras la transferencia, el `propietario_id` del vehículo es el nuevo cliente.
- Los `PermisoDeAcceso` previos sobre ese vehículo quedan **revocados**.

#### Precondición

Re-loguear como **cliente origen** (no técnico):

```http
POST {{base_url}}/api/token/
{
  "username": "{{cliente_username}}",
  "password": "{{cliente_password}}"
}
```

(Reusar el script de test del Test #1 para guardar `access_token`.)

#### Request

```http
POST {{base_url}}/api/vehiculo/{{vehiculo_id}}/transferir-titularidad/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "nuevo_propietario_id": {{cliente_destino_id}}
}
```

#### Respuesta esperada (200 OK)

```json
{ "detail": "Titularidad transferida correctamente" }
```

#### Asserts

```js
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Detalle confirma transferencia", () => {
  pm.expect(pm.response.json().detail).to.include("transferida");
});
```

#### Casos negativos

| Caso | Cambio | Status esperado | Mensaje |
|------|--------|-----------------|---------|
| Sin token | quitar Authorization | 401 | — |
| Body sin `nuevo_propietario_id` | `{}` | 400 | "Falta nuevo_propietario_id" |
| Cliente destino no existe | `"nuevo_propietario_id": 99999` | 404 | — |
| Quien transfiere NO es el titular | login como otro cliente | 403 | "No sos el titular actual..." |
| Mismo cliente origen y destino | `nuevo_propietario_id` = id del propio | 400 | "El nuevo propietario no puede ser el mismo" |
| Logueado como técnico (no cliente) | Bearer del técnico | 403 | "Solo un cliente puede transferir titularidad" |

---

### 5.3 [OT-01] Crear Orden de Trabajo

**Endpoint:** `POST /api/ordenes/`
**Auth:** Bearer (técnico autenticado, `is_staff=True`)
**Criterio de aceptación:**
- Se crea la OT con `estado = "pendiente"`.
- Si `mantenimiento = "preventivo"` se calculan automáticamente
  `fecha_siguiente_servicio` y `kilometraje_siguiente_servicio` a partir del vehículo.
- El backend asigna agenda automáticamente si no se envía (signal del taller).

#### Precondición

Login como técnico (Test #1) → `{{access_token}}` cargado.

#### Request

> El `fecha_turno` debe estar entre `07:00` y `18:00` hora Argentina y respetar la
> capacidad de la agenda. Ajustar si el horario está ocupado.

```http
POST {{base_url}}/api/ordenes/
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "cliente": {{cliente_origen_id}},
  "vehiculo": {{vehiculo_id}},
  "taller": {{taller_id}},
  "fecha_turno": "2026-06-15T10:00:00",
  "kilometraje": 41000,
  "mantenimiento": "preventivo",
  "observaciones_tecnicas": "Service de 40.000 km",
  "responsable_tecnico": "Carlos Tecnico"
}
```

#### Respuesta esperada (201 Created)

```json
{
  "id": 7,
  "agenda": 1,
  "fecha_turno": "2026-06-15T13:00:00Z",
  "fecha_entrega": null,
  "kilometraje": 41000,
  "observaciones_tecnicas": "Service de 40.000 km",
  "fecha_siguiente_servicio": "2026-12-15",
  "kilometraje_siguiente_servicio": 51000,
  "mantenimiento": "preventivo",
  "estado": "pendiente",
  "estado_actual": "pendiente",
  "cliente": 1,
  "vehiculo": 1,
  "taller": 1,
  "responsable_tecnico": "Carlos Tecnico"
}
```

#### Asserts

```js
pm.test("Status 201", () => pm.response.to.have.status(201));

const ot = pm.response.json();

pm.test("Estado inicial es 'pendiente'", () => pm.expect(ot.estado).to.eql("pendiente"));
pm.test("Calculó fecha_siguiente_servicio (preventivo)", () => {
  pm.expect(ot.fecha_siguiente_servicio).to.not.be.null;
});
pm.test("Calculó kilometraje_siguiente_servicio (preventivo)", () => {
  pm.expect(ot.kilometraje_siguiente_servicio).to.be.a("number");
  pm.expect(ot.kilometraje_siguiente_servicio).to.be.greaterThan(ot.kilometraje);
});
pm.test("Asignó agenda automáticamente", () => pm.expect(ot.agenda).to.not.be.null);

pm.collectionVariables.set("orden_id", ot.id);
pm.collectionVariables.set("agenda_id", ot.agenda);
```

#### Casos negativos

| Caso | Cambio | Status esperado |
|------|--------|-----------------|
| Sin token | quitar Authorization | 401 |
| Falta `cliente` | omitir campo | 400 |
| Falta `vehiculo` | omitir campo | 400 |
| Falta `fecha_turno` | omitir campo | 400 |
| `mantenimiento` inválido | `"mantenimiento": "otro"` | 400 |
| Horario ya ocupado | mismo `fecha_turno` que otra OT del taller | 400 (`fecha_turno`) |
| Hora fuera de rango (06:00) | `"2026-06-15T06:00:00"` | 400 |

---

### 5.4 [OT-04] Anular Orden de Trabajo

**Endpoint:** `POST /api/ordenes/{{orden_pasada_id}}/anular/`
**Auth:** Bearer (técnico del **mismo taller** que la OT)
**Criterio de aceptación:**
- La OT pasa de `EN_PROCESO` (por tiempo, turno ya pasó) a `ANULADA`.
- No se puede anular si ya está `FINALIZADA` o `ANULADA`.
- No se puede anular si el turno aún no ocurrió (estado por tiempo `PENDIENTE`).

#### Precondición

- `orden_pasada_id` apunta a la OT con `fecha_turno` en el pasado creada en el seed (4.2).
- Login como técnico del mismo taller → `{{access_token}}`.

#### Request

```http
POST {{base_url}}/api/ordenes/{{orden_pasada_id}}/anular/
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

(Body vacío o `{}`.)

#### Respuesta esperada (200 OK)

```json
{ "status": "ok", "estado": "anulada" }
```

#### Asserts

```js
pm.test("Status 200", () => pm.response.to.have.status(200));

const json = pm.response.json();
pm.test("estado == anulada", () => pm.expect(json.estado).to.eql("anulada"));
pm.test("status == ok", () => pm.expect(json.status).to.eql("ok"));
```

#### Casos negativos

| Caso | Setup | Status esperado | Mensaje |
|------|-------|-----------------|---------|
| Re-anular la misma OT | repetir el request | 400 | "ya está cerrada" |
| OT del Test #3 (turno futuro) | usar `{{orden_id}}` | 400 | "Solo se puede anular cuando el turno ya pasó" |
| Sin token | quitar Authorization | 401 | — |
| Logueado como cliente | Bearer del cliente (no técnico) | 403 | "Usuario no es técnico" |
| Técnico de otro taller | crear otro taller+técnico, loguearse y anular OT ajena | 403 | "No podés anular órdenes de otro taller" |

---

### 5.5 [TU-02] Consultar turnos asignados

**Endpoint:** `GET /api/agendas/{{agenda_id}}/turnos-asignados/?fecha=YYYY-MM-DD`
**Auth:** AllowAny (público)
**Criterio de aceptación:**
- Devuelve un array de OTs ordenadas por `fecha_turno` ascendente.
- Si se pasa `fecha`, filtra por ese día.
- Sin `fecha`, devuelve todos los turnos asignados.
- Con `fecha` mal formateada, 400.

#### Request (filtrado por día)

```http
GET {{base_url}}/api/agendas/{{agenda_id}}/turnos-asignados/?fecha=2026-06-15
Content-Type: application/json
```

#### Respuesta esperada (200 OK)

```json
[
  {
    "id": 7,
    "fecha_turno": "2026-06-15T13:00:00Z",
    "estado": "pendiente",
    "estado_actual": "pendiente",
    "cliente": 1,
    "vehiculo": 1,
    "taller": 1,
    "...": "..."
  }
]
```

#### Asserts

```js
pm.test("Status 200", () => pm.response.to.have.status(200));

const arr = pm.response.json();
pm.test("Devuelve array", () => pm.expect(arr).to.be.an("array"));
pm.test("La OT del Test #3 aparece", () => {
  const ids = arr.map(o => o.id);
  pm.expect(ids).to.include(Number(pm.collectionVariables.get("orden_id")));
});
pm.test("Orden por fecha_turno asc", () => {
  for (let i = 1; i < arr.length; i++) {
    pm.expect(new Date(arr[i].fecha_turno) >= new Date(arr[i-1].fecha_turno)).to.be.true;
  }
});
```

#### Casos negativos

| Caso | Cambio | Status esperado | Mensaje |
|------|--------|-----------------|---------|
| Fecha inválida | `?fecha=2026-13-99` | 400 | "Parámetro 'fecha' inválido. Usá YYYY-MM-DD." |
| Fecha con formato malo | `?fecha=15/06/2026` | 400 | idem |
| Agenda inexistente | `/api/agendas/99999/turnos-asignados/` | 404 | — |
| Día sin turnos | fecha futura sin OTs | 200 con `[]` | — |

---

## 6. Orden de ejecución y dependencias

```
[Setup BD + seed]    →    [Postman: import + env]
                                  │
                                  ▼
                  ┌──────── 5.1 Login (técnico) ────────┐
                  │            sets {{access_token}}    │
                  ▼                                      ▼
       5.3 Crear OT (preventiva)               5.4 Anular OT (orden_pasada_id)
       sets {{orden_id}}, {{agenda_id}}                  │
                  │                                      │
                  ▼                                      │
       5.5 Consultar turnos                              │
       (verifica que orden_id aparece)                   │
                  │                                      │
                  ▼                                      │
       5.1 (relogin como cliente_origen) ────────────────┘
                  │
                  ▼
       5.2 Transferir titularidad (último: rompe el dueño del vehículo)
```

Para correr todo de un saque desde Postman: **Runner → Autolog → orden 1, 3, 5, 4, 2**.

---

## 7. Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| 401 "token not valid" en cualquier request | Access expiró (20 min) | Volver a correr Test #1 (login) |
| 401 al transferir titularidad | Logueado como técnico, no cliente | Re-login con `cliente_username` antes del Test #2 |
| 400 "Ya existe una orden con ese horario" en Test #3 | Otra OT en el mismo `fecha_turno` | Cambiar la hora del payload |
| 400 al anular Test #4 ("Solo se puede anular cuando el turno ya pasó") | La OT del seed quedó con fecha futura | Recrear `ot_pasada` en el shell con `timezone.now() - timedelta(hours=2)` |
| **404 Not Found en Test #4 (Anular OT)** | `orden_pasada_id` vacío en el environment (la URL queda `/api/ordenes//anular/` que no matchea) **o** la OT fue borrada de la BD | Re-correr el seed (sección 4.2), copiar el `orden_pasada_id` impreso al environment de Postman y verificar que el environment "Autolog Local" esté seleccionado |
| `cliente_origen_id` u otros IDs vacíos | Faltó copiar del print del shell | Re-correr el seed o consultar en el admin panel |
| 404 en `/api/vehiculo/{id}/transferir-titularidad/` | URL escrita como `/api/vehiculos/...` (plural) | El router está como **singular**: `/api/vehiculo/...` |
| 500 al crear OT con vehículo recién creado | Faltan `intervalo_servicio_meses` o `intervalo_servicio_km` en el vehículo | Setearlos en el seed (script ya los incluye) |
| El test #5 devuelve `[]` | La fecha del query no coincide (TZ Argentina vs UTC en `fecha_turno`) | Probar con la fecha del response del Test #3 (recortar la T parte hora) |

---

## Apéndice A — Verificación end-to-end (smoke test)

1. Levantar backend (sección 2.1).
2. Cargar seed (sección 4).
3. En Postman, completar variables manuales (`*_username`, `*_password`, `*_id`).
4. Runner → ejecutar la colección **completa** en orden 1, 3, 5, 4, 2.
5. Resultado esperado: **5 requests con todos los `pm.test(...)` en verde**.
6. Re-ejecutar Test #4 (debería fallar con 400 — caso negativo "ya está cerrada").

---

## Apéndice B — Cómo reiniciar las pruebas desde cero

Seguir estos pasos cada vez que se quiera ejecutar la suite completa en estado limpio.

### B.1 Limpiar la base de datos

```powershell
cd C:\Users\bbasaldua\Documents\Autolog\BACKEND
.\venv\Scripts\Activate.ps1
python manage.py flush --no-input
python manage.py loaddata fixtures/base_data.json
```

> `flush` elimina **todos** los datos de la BD (pero conserva la estructura).
> `loaddata` recarga las marcas, modelos y datos base incluidos en el fixture.

### B.2 Recrear el seed de pruebas

```powershell
python manage.py shell
```

Pegar el script completo de la sección 4 (superuser + usuarios + vehículo + OT pasada).
Al finalizar, el script imprime los nuevos IDs:

```
=== IDs para Postman ===
cliente_origen_id  = X
cliente_destino_id = X
vehiculo_id        = X
taller_id          = X
orden_pasada_id    = X
```

> **Importante:** los IDs cambian con cada `flush`. Siempre anotarlos antes de continuar.

### B.3 Resetear variables en Postman

En Postman → **Environments** → **Autolog Local**:

| Variable | Acción |
|----------|--------|
| `access_token` | Borrar valor actual |
| `refresh_token` | Borrar valor actual |
| `role` | Borrar valor actual |
| `orden_id` | Borrar valor actual |
| `agenda_id` | Borrar valor actual |
| `cliente_origen_id` | Actualizar con el nuevo ID del seed |
| `cliente_destino_id` | Actualizar con el nuevo ID del seed |
| `vehiculo_id` | Actualizar con el nuevo ID del seed |
| `taller_id` | Actualizar con el nuevo ID del seed |
| `orden_pasada_id` | Actualizar con el nuevo ID del seed |

Las variables `*_username` y `*_password` no cambian entre ejecuciones.

### B.4 Ejecutar

Runner → colección **Autolog** → orden **1, 3, 5, 4, 2** → **Run Autolog**.
