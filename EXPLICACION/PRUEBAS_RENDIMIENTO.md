# Pruebas de Rendimiento — AutoLog (JMeter)

Guía de ejecución y análisis de resultados de las pruebas definidas en `PRUEBAS/RENDIMIENTO/README_RENDIMIENTO.md`.

- **Herramienta:** Apache JMeter 5.6.3 (modo consola)
- **Fecha de ejecución:** 08/10/2026, 18:24:53 – 18:28:43 ART (3 min 49 s)
- **Entorno:** Django `runserver` + SQLite, JMeter en la misma PC

---

## 1. Instalación de JMeter

Para verificar la instalación usamos:

```powershell
jmeter -v
```

Los mensajes `WARN StatusConsoleListener The use of package scanning to locate plugins is deprecated...` son avisos internos de log4j que trae JMeter. Se pueden ignorar: no afectan las pruebas.

---

## 2. Preparación de datos

El seed (`seed_rendimiento.py`) ya estaba ejecutado:

- En la base existe el **"Taller Rendimiento"**, con `taller_id=1` y `agenda_id=1`.
- `usuarios.csv` tiene los **100 clientes** (`cliente_perf001` … `cliente_perf100`, contraseña `Perf2025!`).

Estos ids coinciden con los valores por defecto del `.jmx`, así que no hace falta pasar `-Jtaller_id` ni `-Jagenda_id`.

Para volver a generar los datos (desde `BACKEND`, con el venv activo):

```powershell
python manage.py migrate
python manage.py shell -c "exec(open(r'..\PRUEBAS\RENDIMIENTO\seed_rendimiento.py', encoding='utf-8').read())"
```

---

## 3. Ejecución

**Terminal 1: levantar el backend** (queda corriendo)

```powershell
cd "C:\Personal Tomi\Facultad\IyCS\Autolog\BACKEND"
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

**Terminal 2: JMeter**, desde la carpeta del `.jmx` para que encuentre `usuarios.csv`:

```powershell
cd "C:\Personal Tomi\Facultad\IyCS\Autolog\PRUEBAS\RENDIMIENTO"
```

Prueba rápida (smoke test) para verificar la conexión antes de la corrida completa:

```powershell
jmeter -n -t Autolog_Rendimiento.jmx -l prueba.jtl -Jusuarios=5 -Jrampup=5 -Jloops=1 -Jusuarios_taller=2
```

En la línea `summary = ... Err: X (Y%)` del final, `Err` tiene que ser 0 o casi 0.

Corrida real:

```powershell
jmeter -n -t Autolog_Rendimiento.jmx -l resultados.jtl -e -o reporte_html
start reporte_html\index.html
```

Para volver a correr, antes hay que borrar las salidas anteriores (JMeter falla si la carpeta del reporte ya existe):

```powershell
Remove-Item -Recurse reporte_html, resultados.jtl
```

---

## 4. Resultados

**Totales: 2510 requests con 0 % de errores.** Todos los endpoints quedaron muy por debajo del umbral de 2000 ms.

Tiempos en milisegundos. El **p95** es el valor que valida RNF-RD-02.

| Endpoint | n | Prom. | p90 | p95 | p99 | Máx. |
|---|---|---|---|---|---|---|
| **GET `/api/talleres/{id}/vehiculos/`** | 50 | **390** | 662 | **704** | 779 | **779** |
| POST `/api/token/` (login, grupo 01) | 110 | 207 | 250 | 260 | 304 | 305 |
| POST `/api/token/` (login concurrente, grupo 03) | 100 | 186 | 192 | 199 | 217 | 217 |
| GET `/api/ordenes/` (listado del taller) | 50 | 31 | 60 | 71 | 77 | 77 |
| POST `/api/ordenes/` (crear OT) | 50 | 28 | 49 | 63 | 89 | 89 |
| GET `/api/agendas/{id}/turnos-asignados/` | 50 | 10 | 15 | 30 | 39 | 39 |
| GET `/api/ordenes/vehiculo/{id}/historial/` | 50 | 13 | 18 | 21 | 179 | 179 |
| GET `/api/clientes/vehiculos/` | 500 | 10 | 15 | 19 | 29 | 60 |
| GET `/api/clientes/{id}/historial/` | 500 | 8 | 12 | 15 | 36 | 52 |
| GET `/api/clientes/{id}/service/` | 500 | 6 | 9 | 11 | 26 | 35 |
| GET `/api/talleres/` | 500 | 5 | 8 | 9 | 17 | 31 |
| **Total** | **2510** | **32** | **180** | **193** | **378** | **779** |

Throughput global: **11,01 req/s**.

---

## 5. Análisis

### 5.1 RNF-RD-02: respuesta < 2 s en el 95 % de las requests → **CUMPLE**

El p95 global es **193 ms** y el peor endpoint llega a **704 ms**. Los dos están muy por debajo de los 2000 ms.

### 5.2 RNF-RD-03: 100 usuarios concurrentes → **CUMPLE (con aclaración)**

No hubo errores con 100 usuarios virtuales en el escenario de carga normal. Hay que aclarar el alcance: con un ramp-up de 60 s y un *think time* de 0,5 a 1,5 s, **nunca hubo 100 usuarios activos a la vez**. El pico fue de unos 33 hilos simultáneos. Para medir concurrencia real está el grupo 04 (estrés).

### 5.3 Login: unos 200 ms, esperable

Django hashea las contraseñas con PBKDF2, un algoritmo lento a propósito para resistir ataques de fuerza bruta. En el login concurrente (grupo 03, 100 usuarios) el tiempo no se degradó: el p95 fue 199 ms.

### 5.4 Cuello de botella: `GET /api/talleres/{id}/vehiculos/`

Tarda unas **40 veces más** que el resto de los endpoints.

**Causa:** `VehiculoSerializer` (`BACKEND/vehiculos/serializers.py`) serializa, por cada vehículo:

- **todo su historial de OT** (`get_historial` → `OrdenDeTrabajoSerializer(many=True)`), y
- la **marca con todos sus modelos** (`get_marca` → `MarcaSerializer`, que incluye `modelos`).

Eso genera muchas consultas a la base por cada vehículo (el problema **N+1**).

Además, el tiempo **crece durante la prueba**: el grupo 02 va creando OT nuevas con `POST /api/ordenes/`, y cada vehículo tiene cada vez más historial para serializar.

**Mejoras posibles:**

- Usar `prefetch_related` / `select_related` en el queryset (`historial`, `modelo__marca`).
- Usar un serializer más liviano para el listado, sin el historial completo ni la lista de modelos de la marca.
- Paginar la respuesta.

Conviene medir de nuevo después de optimizar, para documentar el antes y el después.

### 5.5 Limitación del entorno

Las pruebas corrieron con **SQLite** y el servidor de desarrollo de Django (`runserver`), en la **misma PC que JMeter**. Ninguno de los dos está pensado para producción ni para alta concurrencia. La ERS indica PostgreSQL para producción, así que los resultados son orientativos y hay que aclararlo en el informe.

---

## 6. Consideraciones antes de repetir o pasar al estrés

- **La base quedó con 50 OT más**, las que creó el grupo 02. Si se vuelve a correr la prueba, los resultados no son exactamente comparables, sobre todo en `/talleres/{id}/vehiculos/`. Para comparar, conviene volver a una base limpia o anotar el estado de los datos.
- **Prueba de estrés (grupo 04):** viene deshabilitada en el plan. Para habilitarla:
  1. Abrir la GUI con `jmeter` y cargar `Autolog_Rendimiento.jmx`.
  2. Hacer clic derecho en el grupo **04 Estrés**, elegir **Enable** y guardar.
  3. Correr en consola, con nombres de salida distintos para no pisar los resultados actuales:

     ```powershell
     jmeter -n -t Autolog_Rendimiento.jmx -l estres_300.jtl -e -o reporte_estres_300 -Jusuarios_estres=300
     ```

  4. Repetir subiendo `-Jusuarios_estres` (500, 800, …) hasta que el error ronde el **15–20 %**. En cada vuelta, cambiar los nombres de los archivos.
- **No subir al repositorio** los `jmeter.log` (en `PRUEBAS/RENDIMIENTO` y en `BACKEND`) ni `prueba.jtl`. Conviene borrarlos o agregarlos al `.gitignore`.
