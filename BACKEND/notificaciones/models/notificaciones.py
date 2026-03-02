from django.db import models
from django.utils import timezone


class NotificationJob(models.Model):
    # Qué vamos a notificar
    vehiculo = models.ForeignKey("vehiculos.Vehiculo", on_delete=models.CASCADE)
    cliente = models.ForeignKey("usuarios.Cliente", on_delete=models.CASCADE)

    # “MANTENIMIENTO_15_DIAS” (por ahora hardcodeamos este caso)
    kind = models.CharField(max_length=50)

    # fecha “objetivo” (la estimada del mantenimiento)
    target_date = models.DateField()
    # Cuándo debe dispararse
    scheduled_for = models.DateTimeField()

    # Estado
    status = models.CharField(
        max_length=20,
        default="pending",  # pending | sent | failed | cancelled
    )
    attempts = models.PositiveIntegerField(default=0)

    # Para idempotencia: evitamos crear el mismo job 2 veces
    idempotency_key = models.CharField(max_length=120, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class NotificationLog(models.Model):
    job = models.ForeignKey(NotificationJob, on_delete=models.CASCADE, related_name="logs")

    provider = models.CharField(max_length=30, default="whatsapp")
    status = models.CharField(max_length=20)  # ok | error
    http_status = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(default=timezone.now)