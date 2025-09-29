from dateutil.relativedelta import relativedelta
from django.db import models

from talleres.models.taller import Taller

##falta ver la seleccion de cliente y vehiculo


# Create your models here.
class OrdenDeTrabajo(models.Model):

    # TURNO
    agenda = models.ForeignKey(
        "agendas.Agenda", on_delete=models.SET_NULL, null=True, related_name="ordenes"
    )
    fecha_turno = models.DateTimeField()
    fecha_entrega = models.DateField(null=True, blank=True)
    # la fecha de entrega la vamos a estimar segun la practica de mantenimienro

    kilometraje = models.PositiveIntegerField(default=0, blank=True)
    observaciones_tecnicas = models.TextField(null=True, blank=True)

    # calculados

    fecha_siguiente_servicio = models.DateField(null=True, blank=True)
    kilometraje_siguiente_servicio = models.PositiveIntegerField(null=True, blank=True)

    # --------selector de matenimiento
    PREVENTIVO = "preventivo"
    CORRECTIVO = "correctivo"
    TIPOS_TRABAJO = [(PREVENTIVO, "Preventivo"), (CORRECTIVO, "Correctivo")]

    mantenimiento = models.CharField(max_length=15, choices=TIPOS_TRABAJO, default=PREVENTIVO)
    # ------------fin de selector

    # Relaciones
    cliente = models.ForeignKey("usuarios.Cliente", on_delete=models.PROTECT)
    vehiculo = models.ForeignKey(
        "vehiculos.Vehiculo", on_delete=models.PROTECT, related_name="ordenes"
    )
    taller = models.ForeignKey(
        Taller,
        on_delete=models.PROTECT,
        related_name="orden_de_trabajo",
        null=True,
        blank=True,
    )
    tecnico = models.ForeignKey(
        "usuarios.AdministradorTecnico",
        on_delete=models.PROTECT,
        null=True,
        related_name="ordenes",
    )

    """
     estado = models.CharField(
        max_length=20,
        choices=[('pendiente', 'Pendiente'), ('en_proceso', 'En proceso'), ('finalizado', 'Finalizado'), ('cancelada, 'Cancelada')],
        default='pendiente')
    
        fecha_creacion = models.DateTimeField(auto_now_add=True)
        fecha_actualizacion = models.DateTimeField(auto_now=True)

    practica = models.ForeignKey(
        'ordenes.PracticaMantenimiento', on_delete=models.PROTECT, null=True
    )
    
    presupuesto = models.OneToOneField(
        'presupuesto.Presupuesto', on_delete=models.PROTECT, null=True
    )
   """

    def calcular_fecha_siguiente_servicio(self):
        if self.mantenimiento == self.PREVENTIVO and self.fecha_turno:
            self.fecha_siguiente_servicio = (
                self.fecha_turno + relativedelta(months=self.vehiculo.intervalo_servicio_meses)
            ).date()

    def calcular_kilometraje_siguiente_servicio(self):
        if self.mantenimiento == self.PREVENTIVO and self.fecha_turno:
            self.kilometraje_siguiente_servicio = (
                self.kilometraje + self.vehiculo.intervalo_servicio_km
            )

    def save(self, *args, **kwargs):
        self.calcular_fecha_siguiente_servicio()
        self.calcular_kilometraje_siguiente_servicio()

        self.vehiculo.kilometraje_prox_servicio = self.kilometraje_siguiente_servicio
        self.vehiculo.fecha_prox_servicio = self.fecha_siguiente_servicio
        self.vehiculo.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Orden #{self.id} - {self.vehiculo} - {self.fecha_entrega}"
