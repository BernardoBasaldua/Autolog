from django.contrib import admin

from .models.marca import Marca
from .models.modelo import Modelo
from .models.vehiculo import Vehiculo

admin.site.register(Vehiculo)
admin.site.register(Marca)
admin.site.register(Modelo)

# Register your models here.
