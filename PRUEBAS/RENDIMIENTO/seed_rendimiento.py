"""
Seed de datos para las pruebas de rendimiento de AutoLog (JMeter).

Crea:
  - 1 taller "Taller Rendimiento" con 1 técnico (tecnico_perf / Perf2025!)
  - N clientes (cliente_perf001 ... cliente_perfNNN / Perf2025!), cada uno con 1 vehículo
  - 3 órdenes de trabajo finalizadas por vehículo (historial para consultar)
  - usuarios.csv con las credenciales, que JMeter lee con un CSV Data Set Config

Uso (desde la carpeta BACKEND, con el venv activo, en PowerShell):
    python manage.py shell -c "exec(open(r'../PRUEBAS/RENDIMIENTO/seed_rendimiento.py', encoding='utf-8').read())"

Variables opcionales de entorno:
    PERF_CLIENTES=100   cantidad de clientes a crear (RNF-RD-03 pide 100 concurrentes)
    PERF_CSV=ruta       dónde escribir usuarios.csv (por defecto, junto al .jmx)

Es idempotente: si los usuarios ya existen, no los duplica.
"""
import csv
import os
from datetime import timedelta
from pathlib import Path

from django.db import transaction
from django.utils import timezone

from agendas.models import Agenda
from ordenes.models import OrdenDeTrabajo
from talleres.models import Taller
from usuarios.models import AdministradorTecnico, Cliente, Usuario
from vehiculos.models import Marca, Modelo, Vehiculo

PASSWORD = "Perf2025!"
N = int(os.environ.get("PERF_CLIENTES", "100"))
CSV_PATH = Path(os.environ.get("PERF_CSV", Path.cwd().parent / "PRUEBAS" / "RENDIMIENTO" / "usuarios.csv"))


def get_or_create_user(username, email, dni, telefono, **extra):
    user = Usuario.objects.filter(username=username).first()
    if user:
        return user
    return Usuario.objects.create_user(
        username=username, password=PASSWORD, email=email,
        dni=dni, telefono=telefono, first_name=username, last_name="Perf",
        direccion="Calle Rendimiento 123", **extra,
    )


with transaction.atomic():
    taller, _ = Taller.objects.get_or_create(
        nombre="Taller Rendimiento",
        defaults={"telefono": "1149990000", "direccion": "Av. Carga 1000",
                  "descripcion": "Datos para pruebas JMeter"},
    )
    agenda, _ = Agenda.objects.get_or_create(taller=taller)  # normalmente la crea un signal
    u_tec = get_or_create_user("tecnico_perf", "tecnico_perf@autolog.test",
                               "39000000", "1149990001", is_staff=True)
    AdministradorTecnico.objects.get_or_create(usuario=u_tec, defaults={"taller": taller})

    marca, _ = Marca.objects.get_or_create(nombre="Volkswagen")
    modelo, _ = Modelo.objects.get_or_create(nombre="Gol", marca=marca)

    filas = []
    ahora = timezone.now()
    for i in range(1, N + 1):
        username = f"cliente_perf{i:03d}"
        u = get_or_create_user(username, f"{username}@autolog.test",
                               f"{40000000 + i}", f"11500{i:05d}")
        cliente, _ = Cliente.objects.get_or_create(usuario=u)
        veh, creado = Vehiculo.objects.get_or_create(
            dominio=f"PF{i:03d}AA"[:7],
            defaults={"año": 2018, "modelo": modelo, "propietario": cliente},
        )
        if creado:
            for k in range(3):
                OrdenDeTrabajo.objects.create(
                    cliente=cliente, vehiculo=veh, taller=taller, agenda=agenda,
                    fecha_turno=ahora - timedelta(days=120 * (k + 1)),
                    fecha_entrega=(ahora - timedelta(days=120 * (k + 1) - 1)).date(),
                    kilometraje=30000 + 10000 * k, mantenimiento="preventivo",
                    responsable_tecnico="Técnico Perf",
                    observaciones_tecnicas="Service de rutina (seed rendimiento)",
                )
        filas.append([username, PASSWORD, cliente.id, veh.id])

CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["username", "password", "cliente_id", "vehiculo_id"])
    w.writerows(filas)

print(f"Taller id={taller.id} | técnico=tecnico_perf | clientes={len(filas)}")
print(f"CSV escrito en: {CSV_PATH}")
