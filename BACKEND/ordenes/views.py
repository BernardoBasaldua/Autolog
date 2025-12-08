from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import OrdenDeTrabajo
from .serializers import OrdenDeTrabajoSerializer


class OrdenDeTrabajoViewSet(viewsets.ModelViewSet):
    serializer_class = OrdenDeTrabajoSerializer
    queryset = OrdenDeTrabajo.objects.all()

    def get_queryset(self):
        user = self.request.user

      
        tecnico = getattr(user, "tecnico", None)

        if tecnico and tecnico.taller:
            return OrdenDeTrabajo.objects.filter(taller=tecnico.taller)

        # Si no es técnico (admin global, superuser, etc.)
        # Podés devolver todo o nada
        if user.is_superuser:
            return OrdenDeTrabajo.objects.all()

        return OrdenDeTrabajo.objects.none()
