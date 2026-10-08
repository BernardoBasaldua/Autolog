# Pruebas de Rendimiento — AutoLog (JMeter)

Archivos (ubicarlos en `PRUEBAS/RENDIMIENTO/` del repositorio):

| Archivo | Para qué sirve |
|---|---|
| `Autolog_Rendimiento.jmx` | Plan de JMeter con los escenarios de carga y estrés |
| `seed_rendimiento.py` | Crea el taller, el técnico y los 100 clientes con vehículo e historial, y genera `usuarios.csv` |
| `usuarios.csv` | Lo genera el seed; JMeter lo lee para loguear a cada usuario virtual |

## 1. Preparar datos

Con el backend en una base limpia (o la de desarrollo, el script no duplica datos):

```powershell
cd BACKEND
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py shell -c "exec(open(r'..\PRUEBAS\RENDIMIENTO\seed_rendimiento.py', encoding='utf-8').read())"
python manage.py runserver
```

> En PowerShell no se puede usar `python manage.py shell < archivo.py` (el operador `<` no existe). Tampoco conviene `Get-Content archivo | python manage.py shell`, porque PowerShell 5.1 envía el texto en ASCII y rompe los acentos (`año`, `Técnico`). Por eso usamos `shell -c` con `exec(open(..., encoding='utf-8'))`.

El script imprime el `taller_id`. Si no es `1`, lo pasamos a JMeter con `-Jtaller_id=N` (y `-Jagenda_id=N`).

## 2. Escenarios del plan

Los grupos se ejecutan uno detrás del otro (no en paralelo), para que cada medición quede aislada.

| Grupo | Usuarios | Ramp-up | Loops | Endpoints | RNF |
|---|---|---|---|---|---|
| 01 Cliente consulta vehículo e historial | 100 | 60 s | 5 | login, `/clientes/vehiculos/`, `/clientes/{id}/historial/`, `/clientes/{id}/service/`, `/talleres/` | RD-02, RD-03 |
| 02 Taller gestiona OT | 10 | 60 s | 5 | login técnico, `/ordenes/`, `/talleres/{id}/vehiculos/`, `/ordenes/vehiculo/{id}/historial/`, **POST** `/ordenes/`, detalle OT, `/agendas/{id}/turnos-asignados/` | RD-02 |
| 03 Login concurrente | 100 | 60 s | 1 | `POST /api/token/` | RD-02 |
| 04 Estrés (deshabilitado) | 300 | 10 s | 5 | igual al grupo 01 | RD-03 |

Cada request tiene dos aserciones: código esperado (200 o 201) y duración ≤ 2000 ms (umbral de RNF-RD-02). Entre requests hay un *think time* de 0,5 a 1,5 s para simular a un usuario real.

Para el estrés, habilitamos el grupo 04 y vamos subiendo `usuarios_estres` hasta que el % de error se acerque al 15–20 %, igual que hizo FocusLoop.

## 3. Ejecutar

Desde la carpeta del `.jmx`, en modo consola (recomendado para carga, la GUI consume recursos y distorsiona los tiempos):

```powershell
jmeter -n -t Autolog_Rendimiento.jmx -l resultados.jtl -e -o reporte_html
```

Esto genera `reporte_html/index.html` con promedio, percentiles 90/95/99, desvío, throughput y errores por endpoint. El percentil 95 es el que valida RNF-RD-02.

Todos los parámetros se pueden cambiar sin tocar el plan:

```powershell
jmeter -n -t Autolog_Rendimiento.jmx -l r.jtl -e -o rep `
  -Jhost=127.0.0.1 -Jport=8000 -Jprotocol=http `
  -Jusuarios=100 -Jrampup=60 -Jloops=5 -Jusuarios_taller=10 `
  -Jumbral_ms=2000 -Jtaller_id=1 -Jagenda_id=1
```

Si el reporte HTML falla por una carpeta existente, borramos `reporte_html` antes de volver a correr.

## 4. Observaciones que encontramos al armar el plan

Al verificar los endpoints contra el backend surgieron puntos que conviene tener en cuenta para el informe:

- **`GET /api/ordenes/` y `GET /api/talleres/{id}/clientes/` no están paginados.** Con 100 clientes y 300 OT las respuestas pesan unos 125 KB y 188 KB. Es probable que sean los endpoints más lentos bajo carga, y el tiempo va a crecer con la cantidad de datos.
- **El backend acepta turnos en sábado y en horarios no "en punto"** (por ejemplo `10:30`), lo que contradice RF-TU-01. Solo rechaza horarios fuera de 07–18 hs. Es un defecto para registrar en los casos de prueba funcionales.
- En desarrollo el backend usa **SQLite y `runserver`**, que no están pensados para concurrencia. Para que los resultados sean representativos, conviene correr las pruebas con PostgreSQL (como indica la ERS) o, al menos, aclararlo en el informe como limitación del entorno.
