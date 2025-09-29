from django.db import models


# Create your models here.
class Taller(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    # horarioAtencion = models.TimeField()

    def __str__(self):
        return self.nombre
