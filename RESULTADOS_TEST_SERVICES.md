# RESULTADOS_TEST_SERVICES.md — Ejecución de pruebas de servicio (Autolog)

**Fecha de ejecución:** 2026-05-11
**Ejecutado por:** Claude Code (asistente automatizado)
**Backend:** Django 5.2.4 · `http://127.0.0.1:8000`
**Orden de ejecución:** Test 1 → Test 3 → Test 5 → Test 4 → Test 2

---

## IDs del seed utilizados

| Variable | ID |
|---|---|
| `cliente_origen_id` | 4 |
| `cliente_destino_id` | 5 |
| `vehiculo_id` | 3 |
| `taller_id` | 3 |
| `agenda_id` | 3 |
| `orden_pasada_id` | 1 |

---

## Resultados por caso de prueba

---

### Test 1 — [AU-01] Login JWT

**Endpoint:** `POST /api/token/`
**Credencial usada:** `tecnico1` / `Tecnico123!`

| Assert | Resultado |
|--------|-----------|
| Status 200 | PASS |
| Respuesta contiene `access` | PASS |
| Respuesta contiene `refresh` | PASS |
| Respuesta contiene `role` en el body | **FAIL — ver Defecto D1** |
| `role` presente en el payload del JWT | PASS (`"role": "tecnico"`) |
| Password incorrecta → 401 | PASS |
| Usuario inexistente → 401 | PASS |
| Body vacío → 400 | PASS |

**Veredicto:** PASS parcial (el claim `role` existe en el JWT pero no en el body de la respuesta).

---

### Test 3 — [OT-01] Crear Orden de Trabajo (preventivo)

**Endpoint:** `POST /api/ordenes/`
**Credencial usada:** `tecnico1`
**OT creada:** id = 2, `fecha_turno = 2026-06-15T10:00:00`

| Assert | Resultado |
|--------|-----------|
| Status 201 | PASS |
| `estado` inicial = `"pendiente"` | PASS |
| `fecha_siguiente_servicio` calculada automáticamente | PASS (`2026-12-15` = +6 meses) |
| `kilometraje_siguiente_servicio` calculado automáticamente | PASS (`51000` = 41000 + 10000) |
| `agenda` asignada automáticamente | PASS (agenda id = 3) |
| Sin token → 401 | PASS |
| Falta campo `cliente` → 400 | PASS |
| Falta campo `vehiculo` → 400 | PASS |
| Falta campo `fecha_turno` → 400 | PASS |
| `mantenimiento` con valor inválido → 400 | PASS |
| Mismo horario ya ocupado → 400 | PASS |
| Hora fuera del rango laboral (06:00) → 400 | PASS (mensaje: "El horario seleccionado está fuera del horario laboral.") |

**Veredicto:** PASS completo.

---

### Test 5 — [TU-02] Consultar turnos asignados

**Endpoint:** `GET /api/agendas/3/turnos-asignados/?fecha=2026-06-15`
**Auth:** AllowAny

| Assert | Resultado |
|--------|-----------|
| Status 200 | PASS |
| Devuelve array | PASS |
| La OT del Test 3 (id = 2) aparece en el array | PASS |
| Orden ascendente por `fecha_turno` | PASS |
| Fecha out-of-range `2026-13-99` → 400 | PASS (corregido durante la ejecución — **ver Defecto D2**) |
| Fecha mal formateada `15/06/2026` → 400 | PASS (mensaje: "Parámetro 'fecha' inválido. Usá YYYY-MM-DD.") |
| Agenda inexistente `/api/agendas/99999/...` → 404 | PASS |
| Día sin turnos → 200 con `[]` | PASS |

**Veredicto:** PASS completo (luego del fix de D2).

---

### Test 4 — [OT-04] Anular Orden de Trabajo

**Endpoint:** `POST /api/ordenes/1/anular/`
**Credencial usada:** `tecnico1`
**OT usada:** id = 1 (fecha_turno en el pasado, creada en el seed)

| Assert | Resultado |
|--------|-----------|
| Status 200 | PASS |
| `status == "ok"` | PASS |
| `estado == "anulada"` | PASS |
| Re-anular OT ya anulada → 400 | PASS (mensaje: "La orden ya está cerrada (finalizada/anulada).") |
| OT con turno futuro (id = 2) → 400 | PASS (mensaje: "Solo se puede anular cuando el turno ya pasó (EN PROCESO).") |
| Sin token → 401 | PASS |
| Logueado como cliente → 403 | **FAIL — ver Defecto D3** (devuelve 404 en lugar de 403) |

**Veredicto:** PASS parcial (todos los flujos críticos pasan; el caso de cliente autenticado tiene la respuesta equivocada).

---

### Test 2 — [VH-04] Transferencia de titularidad

**Endpoint:** `POST /api/vehiculo/3/transferir-titularidad/`
**Credencial usada:** `cliente1`

| Assert | Resultado |
|--------|-----------|
| Status 200 | PASS |
| `detail` contiene `"transferida"` | PASS (mensaje: "Titularidad transferida correctamente") |
| Sin token → 401 | PASS |
| Body sin `nuevo_propietario_id` → 400 | PASS (mensaje: "Falta nuevo_propietario_id") |
| `nuevo_propietario_id` inexistente → 404 | PASS |
| Quien transfiere NO es el titular → 403 | PASS (mensaje: "No sos el titular actual de este vehículo") |
| Mismo origen y destino → 400 | PASS (mensaje: "El nuevo propietario no puede ser el mismo") |
| Logueado como técnico → 403 | PASS (mensaje: "Solo un cliente puede transferir titularidad") |

**Veredicto:** PASS completo.

---

## Resumen de resultados

| # | Test | Requerimiento | Resultado |
|---|------|---------------|-----------|
| 1 | Login JWT | AU-01 | PASS parcial (D1) |
| 3 | Crear OT preventiva | OT-01 | PASS |
| 5 | Consultar turnos asignados | TU-02 | PASS (D2 corregido) |
| 4 | Anular OT | OT-04 | PASS parcial (D3) |
| 2 | Transferencia de titularidad | VH-04 | PASS |

**Asserts totales ejecutados:** 43
**Asserts PASS:** 41
**Asserts FAIL:** 2 (D1 y D3)

---

## Defectos encontrados

---

### D1 — `role` ausente en el body de `POST /api/token/`

| Campo | Detalle |
|---|---|
| **ID** | D1 |
| **Severidad** | Media |
| **Requerimiento** | AU-01 |
| **Endpoint** | `POST /api/token/` |
| **Comportamiento actual** | La respuesta solo incluye `access` y `refresh`. El campo `role` no aparece en el body. |
| **Comportamiento esperado** | La respuesta debe incluir `{ "access": "...", "refresh": "...", "role": "tecnico" }` |
| **Causa raíz** | `MyTokenObtainPairSerializer.get_token()` agrega `role` al payload del JWT pero no sobrescribe `validate()` para incluirlo en la respuesta HTTP. |
| **Fix sugerido** | Agregar `validate()` en `BACKEND/auth/serializers.py`: |

```python
def validate(self, attrs):
    data = super().validate(attrs)
    user = self.user
    if user.is_superuser:
        data['role'] = 'admin'
    elif user.is_staff:
        data['role'] = 'tecnico'
    else:
        data['role'] = 'cliente'
    return data
```

| **Estado** | Abierto |

---

### D2 — 500 al consultar turnos con fecha out-of-range *(corregido)*

| Campo | Detalle |
|---|---|
| **ID** | D2 |
| **Severidad** | Alta |
| **Requerimiento** | TU-02 |
| **Endpoint** | `GET /api/agendas/{id}/turnos-asignados/?fecha=2026-13-99` |
| **Comportamiento original** | `parse_date("2026-13-99")` lanzaba `ValueError` no atrapado → 500 Internal Server Error con traceback HTML. |
| **Comportamiento esperado** | 400 con `{ "detail": "Parámetro 'fecha' inválido. Usá YYYY-MM-DD." }` |
| **Causa raíz** | `django.utils.dateparse.parse_date` acepta el formato `YYYY-MM-DD` como válido pero lanza `ValueError` al intentar construir la fecha con mes 13 o día 99. El código no atrapaba esa excepción. |
| **Fix aplicado** | `BACKEND/agendas/views.py` líneas 27–31: se envolvió `parse_date` en `try/except (ValueError, TypeError)`. |
| **Estado** | **Corregido** |

---

### D3 — Cliente autenticado recibe 404 en lugar de 403 al intentar anular una OT

| Campo | Detalle |
|---|---|
| **ID** | D3 |
| **Severidad** | Baja |
| **Requerimiento** | OT-04 |
| **Endpoint** | `POST /api/ordenes/{id}/anular/` |
| **Comportamiento actual** | Un usuario con rol `cliente` recibe 404 (`"No OrdenDeTrabajo matches the given query."`). |
| **Comportamiento esperado** | 403 con mensaje `"Usuario no es técnico"`. |
| **Causa raíz** | El queryset del `OrdenDeTrabajoViewSet` filtra las OTs según el rol del usuario antes de que se evalúe el permiso de la acción `anular`. Un cliente no ve la OT en su queryset → 404. |
| **Fix sugerido** | En la acción `anular`, verificar primero si el usuario tiene el rol correcto (antes de buscar la OT) o usar `get_object_or_404` con un queryset sin filtro de rol y luego validar el permiso manualmente. |
| **Estado** | Abierto |
