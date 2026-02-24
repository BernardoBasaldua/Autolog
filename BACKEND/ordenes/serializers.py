from rest_framework import serializers

from .models import OrdenDeTrabajo
from django.utils import timezone

from agendas.models import Agenda



class OrdenDeTrabajoSerializer(serializers.ModelSerializer):

    fecha_siguiente_servicio = serializers.DateField(read_only=True)
    kilometraje_siguiente_servicio = serializers.IntegerField(read_only=True)

    class Meta:

        model = OrdenDeTrabajo
        fields = "__all__"


        def validate(self, attrs):
            fecha_turno = attrs.get("fecha_turno")
            taller = attrs.get("taller")
            agenda = attrs.get("agenda")

            # Si no viene agenda pero sí taller -> la deducimos
            if agenda is None and taller is not None:
                agenda, _ = Agenda.objects.get_or_create(taller=taller)
                attrs["agenda"] = agenda

            if agenda is None or fecha_turno is None:
                return attrs

            # Normalizar timezone si hace falta
            if timezone.is_naive(fecha_turno):
                fecha_turno = timezone.make_aware(fecha_turno)

            # Buscar si ya existe orden en mismo día y misma hora para esa agenda
            existe = OrdenDeTrabajo.objects.filter(
                agenda=agenda,
                fecha_turno__date=fecha_turno.date(),
                fecha_turno__hour=fecha_turno.hour
            ).exists()

            if existe:
                raise serializers.ValidationError(
                    {"fecha_turno": "Ya existe una orden con ese horario en tu agenda."}
                )

            return attrs