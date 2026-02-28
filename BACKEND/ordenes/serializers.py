from rest_framework import serializers
from django.utils import timezone

from .models import OrdenDeTrabajo
from agendas.models import Agenda


class OrdenDeTrabajoSerializer(serializers.ModelSerializer):

    fecha_siguiente_servicio = serializers.DateField(read_only=True)
    kilometraje_siguiente_servicio = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrdenDeTrabajo
        fields = "__all__"

    def validate(self, attrs):
        print("creando turno")
        fecha_turno = attrs.get("fecha_turno")
        taller = attrs.get("taller")
        agenda = attrs.get("agenda")

        # Si no viene agenda pero sí taller -> la deducimos
        if agenda is None and taller is not None:
            agenda, _ = Agenda.objects.get_or_create(taller=taller)
            attrs["agenda"] = agenda

        print("agenda creada")

        if agenda is None or fecha_turno is None:
            return attrs
        
        # Normalizar timezone
        if timezone.is_naive(fecha_turno):
            fecha_turno = timezone.make_aware(
                fecha_turno,
                timezone.get_current_timezone()
            )

        # ✅ SOLO validaciones de disponibilidad lógica
        try:
            agenda.verificar_disponibilidad(fecha_turno)
        except ValueError as e:
            print("ERROR DISPONIBILIDAD:", e)
            raise serializers.ValidationError({"fecha_turno": str(e)})

        return attrs