# talleres/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from usuarios.models.cliente import Cliente
from usuarios.serializers import ClienteSerializer  
from .models.taller import Taller
from .serializers import TallerSerializer
from vehiculos.models.vehiculo import Vehiculo 
from vehiculos.serializers import VehiculoSerializer


class TallerViewSet(viewsets.ModelViewSet):
    queryset = Taller.objects.all()
    serializer_class = TallerSerializer

    def perform_destroy(self, instance: Taller):
        User = get_user_model()
        taller = instance
        tecnicos = taller.tecnicos.all()

        user_ids = {tecnico.usuario_id for tecnico in tecnicos if tecnico.usuario_id}

        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                continue

            es_cliente = Cliente.objects.filter(usuario=user).exists()
            user.delete()
            # if not es_cliente:
            #     user.delete()

        super().perform_destroy(taller)

    @action(detail=True, methods=["get"], url_path="clientes")
    def clientes(self, request, pk=None):
        """
        GET /api/talleres/<id>/clientes/
        Devuelve los clientes que tienen alguna orden en este taller.
        """
        taller = self.get_object()
        clientes_qs = taller.clientes  # usa la property del modelo
        serializer = ClienteSerializer(clientes_qs, many=True, context={"request": request})
        return Response(serializer.data)
    
    @action(detail=True, methods=["get"], url_path="vehiculos")
    def vehiculos(self, request, pk=None):
        """
        GET /api/talleres/<id>/vehiculos/
        Devuelve los vehiculos que tienen alguna orden en este taller.
        """
        taller = self.get_object()
        vehiculos_qs = taller.vehiculos  # usa la property del modelo
        serializer = VehiculoSerializer(vehiculos_qs, many=True, context={"request": request})
        return Response(serializer.data)
