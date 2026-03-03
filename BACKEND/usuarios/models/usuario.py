# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinLengthValidator
import re
from django.core.exceptions import ValidationError

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

    def validate_dni_numeric(value: str):
        if not re.fullmatch(r"\d{7,10}", value):
            raise ValidationError("Debe ser numérico y tener entre 7 y 10 dígitos.")
        
    # Agrego campos personalizados debajo según necesidad.
    email = models.EmailField('email address', unique=True)
    # dni = models.CharField(max_length=10, unique=True)
    dni = models.CharField(unique=True, validators=[validate_dni_numeric],) # mínimo 7 caracteres

    telefono = models.CharField(max_length=20, unique=True)
    direccion = models.TextField(blank=True)
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)

    

    def __str__(self):
        return f"{self.first_name} {self.last_name} {self.pk}"
