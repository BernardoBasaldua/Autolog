from rest_framework import serializers

from .models import OrdenDeTrabajo


class OrdenDeTrabajoSerializer(serializers.ModelSerializer):

    fecha_siguiente_servicio = serializers.DateField(read_only=True)
    kilometraje_siguiente_servicio = serializers.IntegerField(read_only=True)

    class Meta:

        model = OrdenDeTrabajo
        fields = "__all__"
