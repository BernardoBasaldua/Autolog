from django.db.models.signals import post_save
from django.dispatch import receiver

from talleres.models import Taller
from .models import Agenda


@receiver(post_save, sender=Taller)
def crear_agenda_para_taller(sender, instance: Taller, created: bool, **kwargs):
    """
    Crea una Agenda automáticamente cuando se crea un Taller.
    Si por algún motivo ya existe, no falla (idempotente).
    """
    if created:
        Agenda.objects.get_or_create(taller=instance)