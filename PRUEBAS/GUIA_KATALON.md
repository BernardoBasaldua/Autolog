# Guía de Pruebas de Interfaz — AutoLog
## Para ejecutar en Katalon Studio

**Proyecto:** AutoLog — UTN FRD 2025  
**Tipo de pruebas:** Interfaz (Caja Negra)  
**Herramienta:** Katalon Studio + Chrome  
**URL base frontend:** `http://localhost:4200`  
**URL base backend:** `http://127.0.0.1:8000`

---

## Requisitos previos

1. Tener la aplicación corriendo (`bash start.sh` en la raíz del proyecto).
2. Tener usuarios de prueba creados en la BD (ver sección **Datos de prueba**).
3. En Katalon: `Project > Settings > Execution > Default Execution` → **Chrome**.

---

## Datos de prueba

| Rol      | Email                        | Contraseña      |
|----------|------------------------------|-----------------|
| Cliente  | `cliente_prueba@autolog.com` | `AutoLog2025!`  |
| Técnico  | `tecnico_prueba@autolog.com` | `AutoLog2025!`  |

> Crear estos usuarios ejecutando el fixture o por la interfaz de registro antes de correr los tests.

---

## Módulo 1 — Autenticación (AU)

### CP-AU-01 | Login válido como Cliente

- **Requisito:** AU — Login con JWT  
- **Estrategia:** Caja Negra | **Técnica:** Clases de equivalencia  
- **Condición inicial:** Usuario en `http://localhost:4200/login`

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Navegar a | `/login` | Se muestra el formulario de login |
| 2 | Ingresar email | `cliente_prueba@autolog.com` | Campo completo |
| 3 | Ingresar contraseña | `AutoLog2025!` | Campo completo (enmascarado) |
| 4 | Click en "Iniciar sesión" | — | Redirige a `/cliente` |
| 5 | Verificar URL | — | URL contiene `/cliente` |

---

### CP-AU-02 | Login válido como Técnico

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Navegar a | `/login` | Formulario de login visible |
| 2 | Ingresar email | `tecnico_prueba@autolog.com` | Campo completo |
| 3 | Ingresar contraseña | `AutoLog2025!` | Campo completo |
| 4 | Click en "Iniciar sesión" | — | Redirige a `/taller` |

---

### CP-AU-03 | Login con contraseña incorrecta

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Navegar a | `/login` | — |
| 2 | Ingresar email | `cliente_prueba@autolog.com` | — |
| 3 | Ingresar contraseña | `contraseña_mal` | — |
| 4 | Click en "Iniciar sesión" | — | **NO** redirige. Aparece mensaje de error (credenciales inválidas) |

---

### CP-AU-04 | Login con campos vacíos

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Navegar a | `/login` | — |
| 2 | Click en "Iniciar sesión" sin llenar nada | — | Permanece en `/login`. Mensaje/indicador de campo requerido |

---

### CP-AU-05 | Login con email inexistente

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Navegar a | `/login` | — |
| 2 | Email | `noexiste@xxx.com` | — |
| 3 | Contraseña | `cualquiera123` | — |
| 4 | Click en "Iniciar sesión" | — | Mensaje de error. Permanece en `/login` |

---

### CP-AU-06 | Cerrar sesión

- **Condición inicial:** Usuario Cliente autenticado en `/cliente`

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Click en "Cerrar sesión" / botón logout | — | Redirige a `/login` |
| 2 | Intentar navegar a `/cliente` manualmente | — | Redirige a `/login` (token eliminado) |

---

## Módulo 2 — Registro (REG)

### CP-REG-01 | Pantalla /registrarse muestra opciones de tipo de usuario

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/registrarse` | Página con opción **Cliente** y opción **Taller/Establecimiento** |

---

### CP-REG-02 | Registro exitoso como Cliente

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Navegar a `/registrarse` | | |
| 2 | Seleccionar "Cliente" | | Formulario de cliente visible |
| 3 | Nombre | `María` | |
| 4 | Apellido | `Test` | |
| 5 | DNI | `45000099` | |
| 6 | Email | `nuevo_cliente@test.com` | |
| 7 | Teléfono | `+5493513999999` | |
| 8 | Contraseña | `AutoLog2025!` | |
| 9 | Click en "Registrar" | | Redirige a `/cliente` o a `/login` con mensaje de éxito |

---

### CP-REG-03 | Registro con email duplicado muestra error

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1–8 | Mismo flujo que CP-REG-02 pero con email ya existente | `cliente_prueba@autolog.com` | — |
| 9 | Click en "Registrar" | — | Mensaje: "El email ya está en uso" o similar. No navega. |

---

### CP-REG-04 | Registro con campos vacíos no procede

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/registrarse` → seleccionar "Cliente" | |
| 2 | Click en "Registrar" sin llenar nada | Permanece en el formulario con validaciones visibles |

---

## Módulo 3 — Cliente (CL)

> **Condición inicial de todos los casos:** Usuario **Cliente** autenticado.

### CP-CL-01 | Dashboard muestra vehículos del cliente

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/cliente` | Lista de vehículos registrados **o** mensaje "Sin vehículos registrados" |

---

### CP-CL-02 | Acceso a ruta protegida sin sesión redirige a login

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Sin sesión activa, navegar a `/cliente` | Redirige automáticamente a `/login` |

---

### CP-CL-03 | Historial de vehículo muestra órdenes de trabajo

- **Condición:** El cliente tiene al menos un vehículo registrado.

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | En `/cliente`, hacer click en "Historial" del primer vehículo | Navega a `/cliente/historial/:vehiculoId` |
| 2 | Verificar contenido | Lista de OTs **o** mensaje "Sin historial" |

---

### CP-CL-04 | Próximo mantenimiento muestra datos estimados

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/cliente/pm` | Fecha estimada del próximo service y km estimado **o** mensaje "Sin datos" |

---

### CP-CL-05 | Turnos del cliente muestra historial de turnos

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/cliente/turnos` | Lista de turnos pasados y/o futuros **o** "Sin turnos" |

---

### CP-CL-06 | Buscador de talleres muestra resultados

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/cliente/talleres` | Lista de talleres disponibles |

---

### CP-CL-07 | Pedir turno en un taller muestra slots disponibles

- **Condición:** Hay al menos un taller registrado.

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | En `/cliente/talleres`, hacer click en "Pedir turno" del primer taller | Navega a `/cliente/talleres/:id/pedir_turno` |
| 2 | Seleccionar una fecha (Lun–Vie) | Muestra franjas horarias disponibles (07:00–18:00) |
| 3 | Seleccionar una franja horaria | Franja seleccionada visualmente |

---

### CP-CL-08 | Configuración de cuenta muestra datos del perfil

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/cliente/config` | Datos del usuario (nombre, email, teléfono) visibles y editables |

---

## Módulo 4 — Taller / Técnico (TA)

> **Condición inicial de todos los casos:** Usuario **Técnico** autenticado.

### CP-TA-01 | Lista de OTs del taller

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/taller/ordenes` | Lista de órdenes de trabajo con columnas: patente, estado, fecha turno, responsable |

---

### CP-TA-02 | Filtros de OT funcionales

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | En `/taller/ordenes`, filtrar por estado | `Pendiente` | Solo muestra OTs pendientes |
| 2 | Filtrar por patente | Patente existente | Solo muestra OTs de ese vehículo |
| 3 | Limpiar filtros | — | Muestra todas las OTs |

---

### CP-TA-03 | Formulario nueva OT tiene los campos requeridos

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/taller/form-orden` | Formulario visible con: patente/vehículo, descripción, fecha turno |

---

### CP-TA-04 | Crear OT con campos vacíos no procede

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | En `/taller/form-orden`, click en "Crear" sin llenar nada | Permanece en el formulario. Validaciones visibles |

---

### CP-TA-05 | Crear OT válida — estado inicial PENDIENTE

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | Navegar a `/taller/form-orden` | | |
| 2 | Seleccionar vehículo / ingresar patente | Patente existente | |
| 3 | Descripción | `Cambio de aceite — prueba Katalon` | |
| 4 | Fecha turno (futura) | `2025-12-01` | |
| 5 | Click en "Crear" | — | Mensaje de éxito. OT aparece en `/taller/ordenes` con estado **Pendiente** |

---

### CP-TA-06 | OT PENDIENTE — botones disponibles: Editar

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | En `/taller/ordenes`, identificar OT en estado "Pendiente" | Botón **Editar** visible |
| 2 | Click en "Editar" | Navega a `/taller/ordenes/:id/editar` con datos precargados |

---

### CP-TA-07 | OT EN PROCESO — botones disponibles: Finalizar y Anular

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Identificar OT en estado "En proceso" | Botones **Finalizar** y **Anular** visibles. Botón **Eliminar** NO visible |

---

### CP-TA-08 | OT FINALIZADA — sin botones de edición

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Filtrar OTs por estado "Finalizada" | OT mostrada **sin** botones Editar, Anular ni Eliminar |

---

### CP-TA-09 | Anular OT muestra confirmación

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | En OT "En proceso", click en "Anular" | Aparece modal/diálogo de confirmación |
| 2 | Confirmar anulación | OT cambia a estado "Anulada". Mensaje de éxito |
| 3 | Cancelar anulación (en otro intento) | OT permanece en "En proceso" |

---

### CP-TA-10 | Lista de clientes del taller

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/taller/clientes` | Lista de clientes con nombre, apellido, teléfono |

---

### CP-TA-11 | Lista de vehículos del taller

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/taller/vehiculos` | Lista de vehículos con patente, marca, modelo |

---

### CP-TA-12 | Agenda del taller muestra slots horarios

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/taller/turnos` | Agenda visible con días Lun–Vie y franjas 07:00–18:00 |
| 2 | Verificar días | Lunes a Viernes activos. Sábado/Domingo deshabilitados o ausentes |
| 3 | Verificar horarios | Franjas de 1 hora desde 07:00 hasta 17:00 (última entrega 18:00) |

---

### CP-TA-13 | Seleccionar fecha en agenda muestra turnos del día

| Paso | Acción | Dato | Resultado esperado |
|------|--------|------|--------------------|
| 1 | En `/taller/turnos`, seleccionar una fecha | Fecha hábil futura | Se muestran los turnos asignados para ese día |

---

### CP-TA-14 | Configuración del taller muestra datos del establecimiento

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Navegar a `/taller/config` | Nombre del taller, dirección, teléfono visibles y editables |

---

## Matriz de trazabilidad — Casos de prueba vs Requisitos ERS

| Caso | Requisito ERS | Módulo |
|------|--------------|--------|
| CP-AU-01 | AU — Login JWT (cliente) | Auth |
| CP-AU-02 | AU — Login JWT (técnico) | Auth |
| CP-AU-03 | AU — Prevención acceso inválido | Auth |
| CP-AU-04 | AU — Validación formulario | Auth |
| CP-AU-05 | AU — Usuario inexistente | Auth |
| CP-AU-06 | AU — Cierre de sesión manual | Auth |
| CP-REG-01 | US — Selección tipo usuario | Registro |
| CP-REG-02 | US — Registro cliente | Registro |
| CP-REG-03 | CL — Prevención duplicados (email) | Registro |
| CP-REG-04 | US — Validación campos obligatorios | Registro |
| CP-CL-01 | CL — Dashboard vehículos | Cliente |
| CP-CL-02 | AU — Protección de rutas (RBAC) | Cliente |
| CP-CL-03 | VH — Historial del vehículo | Cliente |
| CP-CL-04 | CM — Estimación próximo service | Cliente |
| CP-CL-05 | TU — Turnos pasados/futuros cliente | Cliente |
| CP-CL-06 | TU — Buscador de talleres | Cliente |
| CP-CL-07 | TU — Solicitar turno (slots disponibles) | Cliente |
| CP-CL-08 | US — Edición de perfil cliente | Cliente |
| CP-TA-01 | OT — Lista de OTs del taller | Taller |
| CP-TA-02 | OT — Filtros de OT | Taller |
| CP-TA-03 | OT — Formulario nueva OT | Taller |
| CP-TA-04 | OT — Validación campos vacíos | Taller |
| CP-TA-05 | OT — Crear OT (estado inicial Pendiente) | Taller |
| CP-TA-06 | OT — Editar OT Pendiente | Taller |
| CP-TA-07 | OT — Transición En proceso → acciones disponibles | Taller |
| CP-TA-08 | OT — OT Finalizada sin edición | Taller |
| CP-TA-09 | OT — Anular OT con confirmación | Taller |
| CP-TA-10 | CL — Clientes del taller | Taller |
| CP-TA-11 | VH — Vehículos del taller | Taller |
| CP-TA-12 | TU — Agenda Lun–Vie 07:00–18:00 | Taller |
| CP-TA-13 | TU — Turnos por fecha | Taller |
| CP-TA-14 | US — Configuración de taller | Taller |

---

## Cómo ejecutar los tests de Playwright (referencia)

```bash
# Desde Autolog/PRUEBAS/playwright/
npm install                         # Solo la primera vez

# Todos los tests en modo headed (ventana visible)
npm test

# Un módulo específico
npm run test:auth
npm run test:registro
npm run test:cliente
npm run test:taller

# Ver reporte HTML después de correr
npm run report
```

Los logs quedan en:
- `PRUEBAS/logs/exitosas/` — Un `.log` por prueba que pasó
- `PRUEBAS/logs/errores/` — Un `.log` por prueba que falló (con stack trace)
- `PRUEBAS/logs/reporte-html/` — Reporte visual navegable
- `PRUEBAS/logs/resultados.json` — JSON con todos los resultados

---

## Configuración en Katalon Studio

1. **Crear nuevo proyecto** → Web Testing → Ingresar nombre "AutoLog Pruebas"
2. **URL por defecto:** `http://localhost:4200`
3. **Navegador:** Chrome (seleccionar en la barra de ejecución)
4. Para cada caso de prueba:
   - `File > New > Test Case`
   - Usar el **modo Manual** (tabla de pasos) o **Script** (Groovy)
   - En modo Script, usar `WebUI.*` keywords
5. **Crear Test Suite** por módulo (Auth, Registro, Cliente, Taller)
6. **Crear Test Suite Collection** para correr todo junto

### Keywords más usados en Katalon

```groovy
WebUI.openBrowser('')
WebUI.navigateToUrl('http://localhost:4200/login')
WebUI.setText(findTestObject('Page_Login/input_email'), 'email@test.com')
WebUI.click(findTestObject('Page_Login/button_submit'))
WebUI.verifyCurrentUrl(Pattern: '.*\/cliente.*')
WebUI.verifyTextPresent('Dashboard', false)
WebUI.closeBrowser()
```
