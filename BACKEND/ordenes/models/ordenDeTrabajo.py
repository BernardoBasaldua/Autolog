from dateutil.relativedelta import relativedelta
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

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
    """ El técnico es opcional porque puede ser que se asigne después o que no se asigne (en caso de ser correctivo) """
    """
    tecnico = models.ForeignKey(
        "usuarios.AdministradorTecnico",
        on_delete=models.PROTECT,
        null=True,
        related_name="ordenes",
    )
    """
    # Para simplificar, en vez de una FK a un técnico, guardamos el nombre del técnico responsable (que se asignará al crear la orden)
    responsable_tecnico = models.CharField(
        max_length=100, 
        null=True, 
        blank=True
    )
    # ----------------- ESTADOS
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    FINALIZADA = "finalizada"
    ANULADA = "anulada"

    ESTADOS = [
        (PENDIENTE, "Pendiente"),
        (EN_PROCESO, "En proceso"),
        (FINALIZADA, "Finalizada"),
        (ANULADA, "Anulada"),
    ]

    estado = models.CharField(
        max_length=15,
        choices=ESTADOS,
        default=PENDIENTE,
        db_index=True,
    )
    # ----------------- FIN ESTADOS
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
    # ----------------- ESTADO POR TIEMPO (pendiente/en_proceso)
    @property
    def estado_por_tiempo(self) -> str:
        # si falta fecha_turno (en tu modelo no falta, pero por robustez)
        if not self.fecha_turno:
            return self.PENDIENTE
        return self.EN_PROCESO if self.fecha_turno <= timezone.now() else self.PENDIENTE

    def sync_estado(self):
        """
        Regla:
        - FINALIZADA y ANULADA son terminales -> no se pisan por tiempo.
        - Si setean fecha_entrega -> FINALIZADA.
        - Si no es terminal -> pendiente/en_proceso por fecha_turno.
        """
        if self.estado in (self.FINALIZADA, self.ANULADA):
            return

        if self.fecha_entrega:
            self.estado = self.FINALIZADA
            return

        self.estado = self.estado_por_tiempo
    # ----------------- VALIDACIONES
    def clean(self):
        # finalizada => requiere fecha_entrega
        if self.estado == self.FINALIZADA and not self.fecha_entrega:
            raise ValidationError(
                {"fecha_entrega": "Una orden FINALIZADA requiere fecha de entrega."}
            )

        # si hay fecha_entrega => debe estar finalizada
        if self.fecha_entrega and self.estado != self.FINALIZADA:
            raise ValidationError(
                {"estado": "Si hay fecha de entrega, la orden debe estar FINALIZADA."}
            )
    # ----------------- ACCIONES
    def anular(self):
        # solo se puede anular si está EN PROCESO (por tiempo) y no es terminal
        if self.estado in (self.FINALIZADA, self.ANULADA):
            raise ValidationError("La orden ya está cerrada (finalizada/anulada).")

        if self.estado_por_tiempo != self.EN_PROCESO:
            raise ValidationError("Solo se puede anular cuando el turno ya pasó (EN PROCESO).")

        if self.fecha_entrega:
            raise ValidationError("No se puede anular una orden finalizada.")

        self.estado = self.ANULADA
        self.save(update_fields=["estado"])


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

        # Si es correctivo y no calculo nada, copio lo vigente del vehículo
        if self.mantenimiento == self.CORRECTIVO:
            if not self.fecha_siguiente_servicio:
                self.fecha_siguiente_servicio = self.vehiculo.fecha_prox_servicio
            if not self.kilometraje_siguiente_servicio:
                self.kilometraje_siguiente_servicio = self.vehiculo.kilometraje_prox_servicio

         # ✅ estado automático (tiempo + fecha_entrega)
        self.sync_estado()

        # ✅ valida reglas
        self.full_clean()

        super().save(*args, **kwargs)

        # Solo actualizo el vehículo si es preventivo
        if self.mantenimiento == self.PREVENTIVO:
            self.vehiculo.kilometraje_prox_servicio = self.kilometraje_siguiente_servicio
            self.vehiculo.fecha_prox_servicio = self.fecha_siguiente_servicio
            self.vehiculo.save(update_fields=['kilometraje_prox_servicio', 'fecha_prox_servicio'])

    def __str__(self):
        return f"Orden #{self.id} - {self.vehiculo} - {self.fecha_entrega} - {self.estado}"
