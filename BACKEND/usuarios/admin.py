from django.contrib import admin

from .models.admin_tecnico import AdministradorTecnico
from .models.cliente import Cliente
from .models.usuario import Usuario

admin.site.register(AdministradorTecnico)
admin.site.register(Cliente)
admin.site.register(Usuario)
