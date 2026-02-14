"""Views de la app vehiculos."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets


from usuarios.models.cliente import Cliente
from usuarios.models.pemisoAcceso import PermisoDeAcceso

from .models import Marca, Modelo, Vehiculo
from .serializers import MarcaSerializer, ModeloSerializer, VehiculoSerializer


class VehiculoViewSet(viewsets.ModelViewSet):
    """CRUD para vehículos."""

    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer

    @action(detail=True, methods=["post"], url_path="transferir-titularidad")
    def transferir_titularidad(self, request, pk=None):
        vehiculo = self.get_object()

        nuevo_propietario_id = request.data.get("nuevo_propietario_id")
        if not nuevo_propietario_id:
            return Response(
                {"detail": "Falta nuevo_propietario_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cliente destino
        nuevo_propietario = get_object_or_404(Cliente, id=nuevo_propietario_id)

        # Cliente autenticado (dueño actual)
        cliente_actual = Cliente.objects.filter(usuario_id=request.user.pk).first()
        if not cliente_actual:
            return Response(
                {"detail": "Solo un cliente puede transferir titularidad"},
                status=status.HTTP_403_FORBIDDEN
    )


        if vehiculo.propietario_id != cliente_actual.id:
            return Response(
                {"detail": "No sos el titular actual de este vehículo"},
                status=status.HTTP_403_FORBIDDEN
            )

        if vehiculo.propietario_id == nuevo_propietario.id:
            return Response(
                {"detail": "El nuevo propietario no puede ser el mismo"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # ✅ acá es el “reemplazo” de propietario
            vehiculo.propietario = nuevo_propietario
            vehiculo.save(update_fields=["propietario"])

            # 🔥 recomendado: revocar permisos para evitar que queden accesos viejos
            PermisoDeAcceso.objects.filter(
                vehiculo_autorizado=vehiculo.id
            ).delete()

        return Response(
            {"detail": "Titularidad transferida correctamente"},
            status=status.HTTP_200_OK
        )



    """def get_queryset(self):
        tecnico = self.get_object()
        tecnico = self.request.user.tecnico
        # Aquí filtrás para que solo vea vehículos de clientes de su taller
        return Vehiculo.objects.filter(cliente__usuario__tecnico=tecnico)
        """


class MarcaViewSet(viewsets.ModelViewSet):
    """CRUD para marcas."""

    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer


class ModeloViewset(viewsets.ModelViewSet):
    """CRUD para modelos."""

    queryset = Modelo.objects.all()
    serializer_class = ModeloSerializer

    # permission_classes = [AllowAny]
