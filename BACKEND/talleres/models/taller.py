from django.db import models


# Create your models here.
class Taller(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    horarioAtencion = models.TimeField(null= True,blank=True)
    cuit = models.CharField(max_length=20,null=True, unique=True, blank=True)

    @property
    def clientes(self):
        """
        Devuelve un queryset de Clientes que tienen al menos
        una OrdenDeTrabajo en este taller.
        """
        from usuarios.models.cliente import Cliente  # import local para evitar ciclos

        # self.orden_de_trabajo viene del related_name en OrdenDeTrabajo.taller
        cliente_ids = self.orden_de_trabajo.values_list("cliente_id", flat=True).distinct()
        return Cliente.objects.filter(id__in=cliente_ids)

    def __str__(self):
        return self.nombre
