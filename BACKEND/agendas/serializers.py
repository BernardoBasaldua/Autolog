from rest_framework import serializers

from .models import Agenda


class AgendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agenda
        # Incluimos todos los campos del modelo en la representación JSON
        fields = "__all__"
        # Campo taller solo lectura, ya que no se modifica con la API
        read_only_fields = ("taller",)
