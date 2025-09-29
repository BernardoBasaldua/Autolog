from rest_framework import viewsets

from .models import OrdenDeTrabajo
from .serializers import OrdenDeTrabajoSerializer


class OrdenDeTrabajoViewSet(viewsets.ModelViewSet):
    queryset = OrdenDeTrabajo.objects.all()
    serializer_class = OrdenDeTrabajoSerializer
