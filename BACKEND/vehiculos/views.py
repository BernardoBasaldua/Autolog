"""Views de la app vehiculos."""


from rest_framework import viewsets

from .models import Marca, Modelo, Vehiculo
from .serializers import MarcaSerializer, ModeloSerializer, VehiculoSerializer


class VehiculoViewSet(viewsets.ModelViewSet):
    """CRUD para vehículos."""

    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer

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
