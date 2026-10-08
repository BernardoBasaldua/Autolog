# CLAUDE.md — AutoLog

Proyecto universitario UTN FRD 2025 (cátedra Ingeniería y Calidad de Software).
Aplicación web para seguimiento de mantenimiento vehicular.

**Equipo:** Marinetto Camila, Catino Nicole, González Tomás Iván, Belesia Alexis, Basaldúa M. Bernardo

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Django 5.2.4 + Django REST Framework 3.16.0 |
| Frontend | Angular 20.1.0 + TypeScript 5.8.2 |
| Base de datos | SQLite (desarrollo) → PostgreSQL (producción) |
| Auth | JWT (simplejwt) + Google OAuth2 + dj-rest-auth |
| Notificaciones | WhatsApp Business API (Meta Graph API v22.0) |
| Contenedores | Docker |
| Deploy objetivo | Heroku / AWS / VPS Linux |

---

## Estructura del proyecto

```
Autolog/
├── BACKEND/
│   ├── autolog/            # Config principal Django (settings, urls, wsgi)
│   ├── agendas/            # Disponibilidad de turnos del taller
│   ├── auth/               # Vistas JWT personalizadas + Google OAuth
│   ├── notificaciones/     # Jobs y envío WhatsApp proactivo
│   ├── ordenes/            # Órdenes de trabajo (corazón del sistema)
│   ├── presupuestos/       # PENDIENTE — solo esqueleto vacío
│   ├── talleres/           # Establecimientos mecánicos
│   ├── usuarios/           # Usuario, Cliente, AdministradorTecnico, PermisoDeAcceso
│   ├── vehiculos/          # Vehiculo, Marca, Modelo
│   ├── fixtures/           # Datos iniciales (base_data.json)
│   ├── UML/autologUML.puml # Diagrama UML del diseño
│   └── requirements.txt
├── FRONTEND/
│   ├── src/app/
│   │   ├── components/clientes/   # Vistas del cliente
│   │   ├── components/talleres/   # Vistas del taller
│   │   ├── components/compartido/ # Header, Aside, Nav
│   │   ├── components/registro/   # Formularios de registro
│   │   ├── layouts/               # MainLayout, AuthLayout
│   │   ├── models/                # Interfaces TypeScript (DTOs)
│   │   ├── services/              # Servicios HTTP + signals
│   │   └── app.routes.ts
│   ├── INTERFACES (CANVA)/        # Wireframes HTML de referencia
│   └── package.json
├── PRUEBAS/
│   ├── playwright/                # Pruebas E2E de interfaz (Playwright)
│   ├── logs/                      # Logs de ejecución E2E (errores / exitosas / reporte)
│   ├── RENDIMIENTO/               # Pruebas de carga y estrés con JMeter
│   ├── GUIA_KATALON.md
│   └── Ejemplos/                  # Planes de prueba de referencia (PDF)
├── EXPLICACION/                   # Explicaciones y análisis de resultados de pruebas
├── TESTSERVICES.md                # Plan de pruebas de servicios (API)
├── RESULTADOS_TEST_SERVICES.md    # Resultados de las pruebas de servicios
├── Autolog.postman_*.json         # Colección y entorno Postman
└── ERS_AutoLog_1.0.0.pdf          # Especificación de Requisitos del Sistema
```

---

## Arquitectura

SPA Angular desacoplada del backend Django REST. Comunicación exclusiva via HTTP REST + JWT.

```
Angular 20 (Standalone Components + Signals)
    ↕ HTTP REST / JWT Bearer
Django 5.2 (DRF ViewSets + Router)
    ↕
SQLite/PostgreSQL
    ↕
WhatsApp Business API (Meta)
```

**Patrones clave:**
- **Fat Model / Active Record**: lógica de negocio en modelos Django (`Cliente.crear_permiso()`, `OrdenDeTrabajo.sync_estado()`, `AdministradorTecnico.crear_orden_trabajo()`)
- **Signals Django**: crea `Agenda` automáticamente al crear un `Taller`
- **Angular Signals**: estado reactivo en servicios con `signal<T>()`
- **AuthInterceptor Angular**: adjunta Bearer token, maneja refresh automático en 401
- **RBAC**: roles determinados por `is_superuser` / `is_staff` del modelo `Usuario`

---

## Roles de usuario

| Flag Django | Rol JWT | Acceso |
|---|---|---|
| `is_superuser=True` | `"admin"` | Todo el sistema |
| `is_staff=True` | `"tecnico"` | Su taller (OTs, clientes, vehículos) |
| Normal | `"cliente"` | Sus vehículos y permisos |

El JWT incluye el claim `role` para que el frontend determine el tipo de usuario sin requests adicionales.

---

## Módulos principales

### `usuarios` — Identidad y permisos
- `Usuario`: extiende `AbstractUser` (DNI, teléfono E.164, google_sub)
- `Cliente`: propietario de vehículos, gestiona permisos otorgados/recibidos
- `AdministradorTecnico`: vinculado a un `Taller`, concentra lógica del técnico
- `PermisoDeAcceso`: autorización explícita de un `Cliente` para que otro `Cliente` o un `Taller` acceda al historial de su vehículo

### `vehiculos` — Catálogo
- `Marca` / `Modelo` / `Vehiculo`
- `Vehiculo` guarda `fecha_prox_servicio` y `kilometraje_prox_servicio` calculados automáticamente desde la última OT preventiva

### `ordenes` — Corazón operativo
- `OrdenDeTrabajo`: registra cada intervención mecánica
- Máquina de estados automática: `pendiente → en_proceso → finalizada / anulada`
- La transición se determina por `fecha_turno` y `fecha_entrega`
- Al guardar una OT preventiva, actualiza los campos de próximo servicio del vehículo

### `agendas` — Turnos
- `Agenda` (OneToOne con `Taller`): creada automáticamente por señal Django
- Configura días laborales (lun-vie), horarios (07:00-18:00, granularidad 1h) y capacidad por franja
- Métodos: `verificar_disponibilidad()`, `get_turnos_asignados()`

### `notificaciones` — WhatsApp proactivo
- `NotificationJob`: job programado para enviar WhatsApp 15 días antes del service
- `NotificationLog`: registro de intentos
- `WhatsAppClient`: cliente Meta Graph API v22.0
- Management commands: `sync_mantenimiento_jobs` y `send_due_notifications` (ejecutar periódicamente via cron)
- Usa `idempotency_key` compuesta (`KIND|vehiculo=X|target=YYYY-MM-DD`) para evitar duplicados

### `auth` — Autenticación
- `MyTokenObtainPairView`: extiende JWT para incluir claim `role`
- `GoogleLoginView`: verifica ID token Google, linkea por `google_sub` o email, emite JWT propio

---

## Estados de Orden de Trabajo

```
pendiente → en_proceso → finalizada
                      ↘ anulada
```

| Estado | Permite editar | Permite eliminar | Permite finalizar | Permite anular |
|---|---|---|---|---|
| Pendiente | Sí | Solo si turno es futuro | No | No |
| En proceso | Sí | No | Sí (requiere fecha_entrega) | Sí |
| Finalizada | No | No | — | No |
| Anulada | No | No | — | No |

---

## Endpoints principales

### Auth
| Método | URL | Descripción |
|---|---|---|
| POST | `/api/token/` | Login → JWT (access + refresh + role) |
| POST | `/api/token/refresh/` | Renovar access token |
| POST | `/api/auth/google/` | Login con Google ID Token |

### Clientes / Técnicos
| Método | URL | Descripción |
|---|---|---|
| GET/POST | `/api/clientes/` | Listar / Crear cliente |
| GET | `/api/clientes/{id}/historial/?vehiculo_id=X` | Historial (con verificación de permiso) |
| POST | `/api/clientes/{id}/acceso/` | Crear permiso de acceso |
| DELETE | `/api/clientes/{id}/eliminar_permiso/` | Revocar permiso |
| POST | `/api/tecnicos/registrar-establecimiento/` | Registro público taller + técnico |
| POST | `/api/tecnicos/{id}/crear_orden/` | Crear OT |
| PATCH | `/api/tecnicos/{id}/actualizar_orden/?orden_id=X` | Actualizar OT |
| GET | `/api/tecnicos/{id}/ordenes_del_taller/` | Todas las OTs del taller |

### Otros recursos
| Método | URL | Descripción |
|---|---|---|
| GET/POST | `/api/vehiculos/` | CRUD vehículos |
| POST | `/api/vehiculos/{id}/transferir-titularidad/` | Transferir propiedad |
| POST | `/api/ordenes/{id}/anular/` | Anular OT |
| GET | `/api/agendas/{id}/turnos-asignados/?fecha=YYYY-MM-DD` | Turnos del día |
| GET | `/api/talleres/{id}/clientes/` | Clientes del taller |

---

## Rutas Frontend

```
/ → /login
/login                                          Login (credenciales + Google)
/registrarse                                    Selector cliente/taller

[MainLayout]
  /cliente                                      Dashboard vehículos
  /cliente/permisos/:vehiculoId                 Gestionar permisos
  /cliente/historial/:vehiculoId                Historial OTs
  /cliente/turnos                               Turnos pasados/futuros
  /cliente/talleres                             Buscador talleres
  /cliente/talleres/:id/pedir_turno             Slots disponibles
  /cliente/pm                                   Próximo mantenimiento
  /cliente/config                               Configuración cuenta

  /taller/ordenes                               Lista/detalle OTs
  /taller/ordenes/:id/editar                    Editar OT
  /taller/form-orden                            Nueva OT
  /taller/clientes                              Clientes del taller
  /taller/vehiculos                             Vehículos del taller
  /taller/turnos                                Agenda de turnos
  /taller/config                                Configuración taller
```

---

## Flujo de autenticación

1. `POST /api/token/` → JWT (access + refresh + role)
2. Si role=`tecnico`: `GET /api/tecnicos/me/` → guarda `tecnicoId` y `tallerId` en localStorage
3. `AuthInterceptor` adjunta `Authorization: Bearer <access>` a todas las requests
4. En 401: interceptor llama a `POST /api/token/refresh/`, renueva y reintenta la request
5. Logout: limpia localStorage → `/login`

**JWT config:** access 20 min, refresh 14 días, rotación activada, blacklist activada

---

## Configuración relevante

- **Zona horaria**: `America/Argentina/Buenos_Aires`
- **Locale**: `es-AR` (backend y frontend)
- **CORS**: `CORS_ALLOW_ALL_ORIGINS = True` (solo desarrollo, cambiar en producción)
- **Teléfonos**: normalización automática a E.164 (`+54...`) via `normalize_ar_phone_to_e164()`
- **Google Client ID**: actualmente hardcodeado en `settings.py` y `login.ts` → mover a variables de entorno
- **WhatsApp**: configurado por env vars `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`

---

## Requisitos funcionales (resumen por módulo)

**Autenticación (AU):** Google OAuth2, auth por WhatsApp, prevención duplicidad, cierre manual, expiración automática por inactividad

**Perfiles (US):** Selección tipo usuario al registrarse (cliente/establecimiento), registro con datos básicos, edición de perfil, eliminación voluntaria de cuenta

**Clientes (CL):** Alta desde establecimiento, asociación con taller al crear OT, listado de clientes del taller, prevención de duplicados (teléfono/email)

**Vehículos (VH):** Registro por cliente o taller, titular único por vehículo, transferencia de titularidad (revoca permisos), permisos de visualización del historial, prevención de duplicados por patente

**Órdenes de Trabajo (OT):** Crear/editar/anular/finalizar OTs, máquina de estados, edición restringida al taller responsable, visualización filtrada por cliente/vehículo/patente/fecha

**Turnos (TU):** Lun-vie 07:00-18:00, granularidad 1h, múltiples turnos por franja, asignación manual desde taller, crear OT desde agenda

**Mantenimiento (CM):** Estimación automática de próxima fecha y km, actualización automática al registrar nueva intervención, visualización en dashboard cliente

**Notificaciones (NOT):** WhatsApp 15 días antes del service estimado

---

## Requisitos no funcionales

- Disponibilidad 99%
- API responde < 2s en 95% de requests
- Soporta 100 usuarios concurrentes
- Responsive (computadoras, tablets, smartphones)
- Compatible con las 2 versiones estables recientes de Chrome, Firefox, Safari, Edge
- Cumple Ley 25.326 de Protección de Datos Personales (Argentina)
- HTTPS/TLS, JWT, RBAC
- Backup automático diario de BD
- Docker para portabilidad entre entornos

---

## Estado actual del código

### Implementado y funcional
- Auth completa: JWT + Google OAuth2 + refresh automático en frontend
- Registro público de clientes y talleres (con técnico admin en transacción atómica)
- CRUD completo: clientes, técnicos, talleres, vehículos (marcas/modelos), órdenes de trabajo
- Máquina de estados de OTs con transiciones automáticas
- Cálculo automático de próximo service al guardar OT preventiva
- Sistema de permisos de acceso inter-entidades
- Agenda automática al crear taller (señal Django)
- Verificación de disponibilidad de turnos
- Notificaciones WhatsApp proactivas (sistema completo con idempotencia)
- Frontend con vistas diferenciadas por rol, signals reactivos, interceptor HTTP
- Historial de vehículos, gestión de permisos, transferencia de titularidad

### Pendiente / incompleto
- **`PracticaDeMantenimiento`**: archivo existe pero vacío
- **`Presupuestos`**: modelo vacío, app comentada en `INSTALLED_APPS`
- **`SuperUsuario`**: en UML pero no implementado como modelo separado (usa `is_superuser`)
- **`CliPedirTurno`**: fecha hardcodeada `'2025-08-25'`, extracción manual de tallerId desde URL
- **`AgendaViewSet`**: `permission_classes = [AllowAny]` marcado como "temporal para pruebas"
- **Señal de Agenda**: en `agendas/signals.py` pero puede no estar registrada en `apps.py`
- **Duplicado en `usuarios/urls.py`**: `router.register('clientes', ...)` aparece dos veces
- **Código legacy comentado**: varias vistas con versiones anteriores sin limpiar
- **`print()` / `console.log` de debug**: presentes en producción

---

## Estado de las pruebas (etapa actual del proyecto)

El trabajo actual se centra en **pruebas y calidad**, no en nuevas funcionalidades.

| Tipo | Herramienta | Ubicación | Estado |
|---|---|---|---|
| Interfaz / E2E | Playwright (+ guía Katalon) | `PRUEBAS/playwright/`, `PRUEBAS/logs/` | Ejecutadas, logs de errores y exitosas registrados |
| Servicios (API) | Postman | `TESTSERVICES.md`, `RESULTADOS_TEST_SERVICES.md`, `Autolog.postman_*.json` | Ejecutadas y documentadas (incluye fix D2 en `agendas/views.py`) |
| Rendimiento (carga) | JMeter 5.6.3 | `PRUEBAS/RENDIMIENTO/`, análisis en `EXPLICACION/PRUEBAS_RENDIMIENTO.md` | Ejecutada (08/10/2026) |
| Rendimiento (estrés) | JMeter (grupo 04 del `.jmx`) | `PRUEBAS/RENDIMIENTO/` | **Pendiente**: el grupo está deshabilitado en el plan |

### Pruebas de rendimiento (JMeter)
- Datos de prueba: `seed_rendimiento.py` crea "Taller Rendimiento" (`taller_id=1`, `agenda_id=1`), el técnico `tecnico_perf` y 100 clientes `cliente_perfNNN` (contraseña `Perf2025!`), y genera `usuarios.csv`
- Se ejecuta desde `PRUEBAS/RENDIMIENTO/`: `jmeter -n -t Autolog_Rendimiento.jmx -l resultados.jtl -e -o reporte_html`
- **Resultado de la carga:** 2510 requests, 0 % de errores, p95 global de 193 ms → cumple RNF-RD-02 (< 2 s) y RNF-RD-03 (100 usuarios; el pico real fue de unos 33 hilos simultáneos)
- **Cuello de botella detectado:** `GET /api/talleres/{id}/vehiculos/` (promedio 390 ms, p95 704 ms). Causa: N+1 en `VehiculoSerializer`, que serializa el historial completo de OT y la marca con todos sus modelos por cada vehículo. Optimización pendiente (`prefetch_related` / serializer liviano / paginación)
- La corrida dejó 50 OT extra en la base (las creó el grupo 02), así que las corridas siguientes no son exactamente comparables
- Limitación del entorno: SQLite + `runserver` + JMeter en la misma PC

### Próximos pasos
1. Habilitar el grupo 04 y correr el estrés subiendo `-Jusuarios_estres` hasta un error del 15–20 %
2. (Opcional) Optimizar `/talleres/{id}/vehiculos/` y volver a medir para documentar el antes y el después
3. Redactar la sección de resultados de rendimiento en el informe

---

## Decisiones de diseño documentadas

- El equipo eligió agrupar entidades por funcionalidad en 7 apps Django (en vez de una app por entidad). Justificación en `BACKEND/estructuraAppsDeProyecto.md`
- El UML original (`BACKEND/UML/autologUML.puml`) incluía `SuperUsuario`, `Presupuesto` y `PracticaMantenimiento` con relaciones más ricas. La implementación actual es un subconjunto de ese diseño
- El campo `tecnico` en `OrdenDeTrabajo` fue cambiado de FK a `AdministradorTecnico` a un simple `CharField responsable_tecnico`
- La actualización optimista en `TaOrdenes` (frontend) actualiza la UI inmediatamente y hace rollback si el backend falla
