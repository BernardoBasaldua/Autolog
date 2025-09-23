from django.shortcuts import render
from rest_framework import viewsets
from .models import Vehiculo, Marca, Modelo
from .serializers import VehiculoSerializer, MarcaSerializer, ModeloSerializer
from rest_framework.permissions import (
    AllowAny,          # acceso abierto (público)
    IsAuthenticated,   # solo usuarios logueados
    IsAdminUser,       # solo superusers / staff
    DjangoModelPermissions,        # basado en permisos de modelo (add, change, delete, view)
    DjangoModelPermissionsOrAnonReadOnly, # permisos de modelo, pero anónimos pueden leer
    BasePermission     # (para crear permisos custom)
)


class VehiculoViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer

    '''def get_queryset(self):
        tecnico = self.get_object()
        tecnico = self.request.user.tecnico
        # Aquí filtrás para que solo vea vehículos de clientes de su taller
        return Vehiculo.objects.filter(cliente__usuario__tecnico=tecnico)
        '''


class MarcaViewSet(viewsets.ModelViewSet):
    queryset= Marca.objects.all()
    serializer_class = MarcaSerializer

class ModeloViewset(viewsets.ModelViewSet):
    queryset = Modelo.objects.all()
    serializer_class = ModeloSerializer

    #permission_classes = [AllowAny]
