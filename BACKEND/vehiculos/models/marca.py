from django.db import models


# Create your models here.
class Marca(models.Model):
    nombre = models.CharField(max_length=50, unique=True, blank=False)
    # Relaciones
    """no tiene FK ya que las relaciones son:
    vehiculo tiene FK modelo
    modelo tiene FK una marca
    vhiculo N--> 1 modelo N --> 1 marca"""

    def __str__(self):
        return self.nombre
