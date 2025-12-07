from django.db import models

from .marca import Marca


# Create your models here.
class Modelo(models.Model):
    nombre = models.CharField(max_length=50)

    # relaciones
    marca = models.ForeignKey(Marca, on_delete=models.PROTECT, related_name="modelos")

    def __str__(self):
        return f"{self.marca.nombre} {self.nombre}"
