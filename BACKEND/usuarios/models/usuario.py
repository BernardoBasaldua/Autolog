# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

"""
Modelo personalizado de usuario que hereda de AbstractUser.

    Hereda automáticamente los siguientes campos:
    ─────────────────────────────────────────────
    ► username: nombre de usuario (campo único por defecto)
    ► first_name: nombre
    ► last_name: apellido
    ► email: correo electrónico
    ► password: contraseña (cifrada)
    ► is_staff: acceso al panel de administración
    ► is_active: indica si el usuario está activo
    ► is_superuser: tiene todos los permisos del sistema
    ► last_login: última fecha y hora de acceso
    ► date_joined: fecha de creación del usuario
    ► groups: grupos de permisos
    ► user_permissions: permisos individuales   
"""


class Usuario(AbstractUser):

    # Agrego campos personalizados debajo según necesidad.

    dni = models.CharField(max_length=10, null=True, unique=True)
    telefono = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} {self.pk}"
