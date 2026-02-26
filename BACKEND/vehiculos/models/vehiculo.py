from django.db import models

from .modelo import Modelo


class Vehiculo(models.Model):
    año = models.PositiveIntegerField()
    dominio = models.CharField(max_length=7, unique=True)

    # configurables al crear el vehiculo
    intervalo_servicio_km = models.IntegerField(default=10000)
    intervalo_servicio_meses = models.IntegerField(default=12)

    # se calculan desde la orden
    fecha_prox_servicio = models.DateField(
        null=True,
        blank=True,
    )
    kilometraje_prox_servicio = models.IntegerField(null=True, blank=True)

    # Relaciones

    modelo = models.ForeignKey(Modelo, on_delete=models.PROTECT, related_name="vehiculos")
    propietario = models.ForeignKey(
        "usuarios.Cliente", on_delete=models.CASCADE, related_name="vehiculos"
    )

    @property
    def marca(self):
        return self.modelo.marca

    @property
    def historial(self):
        ordenes = self.ordenes.all().order_by("fecha_turno")
        return ordenes

    def __str__(self):
        return f"{self.modelo.marca.nombre} {self.modelo.nombre} {self.año} {self.dominio}"
