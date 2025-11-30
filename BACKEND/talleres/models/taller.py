from django.db import models


# Create your models here.
class Taller(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    horarioAtencion = models.TimeField(null= True,blank=True)
    cuit = models.CharField(max_length=20,null=True, unique=True, blank=True)

    def __str__(self):
        return self.nombre
