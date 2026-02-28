from rest_framework import serializers
from django.utils import timezone

from .models import OrdenDeTrabajo
from agendas.models import Agenda


class OrdenDeTrabajoSerializer(serializers.ModelSerializer):

    fecha_siguiente_servicio = serializers.DateField(read_only=True)
    kilometraje_siguiente_servicio = serializers.IntegerField(read_only=True)

     # ✅ para el front: muestra pendiente/en_proceso por reloj si no es terminal
    estado_actual = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrdenDeTrabajo
        fields = "__all__"
        read_only_fields = (
            "estado",  # ✅ nadie lo setea manualmente
        )

    def get_estado_actual(self, obj: OrdenDeTrabajo):
        # terminal manda
        if obj.estado in (OrdenDeTrabajo.FINALIZADA, OrdenDeTrabajo.ANULADA):
            return obj.estado
        # si no, por tiempo
        return obj.estado_por_tiempo

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        fecha_turno = attrs.get("fecha_turno")
        taller = attrs.get("taller")
        agenda = attrs.get("agenda")

        # 🔒 Si es update, bloqueos por estado terminal
        if instance is not None:
            if instance.estado in (OrdenDeTrabajo.FINALIZADA, OrdenDeTrabajo.ANULADA):
                raise serializers.ValidationError(
                    "No se puede editar una orden finalizada o anulada."
                )

            # (opcional) si querés mantener tu regla actual: si ya tiene fecha_entrega, no editás nada
            if instance.fecha_entrega is not None:
                raise serializers.ValidationError(
                    "No se puede editar una orden que ya tiene fecha de entrega."
                )

        # Si no viene agenda pero sí taller -> la deducimos
        if agenda is None and taller is not None:
            agenda, _ = Agenda.objects.get_or_create(taller=taller)
            attrs["agenda"] = agenda

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
            raise serializers.ValidationError({"fecha_turno": str(e)})

        return attrs