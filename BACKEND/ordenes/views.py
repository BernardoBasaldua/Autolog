from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import OrdenDeTrabajo
from .serializers import OrdenDeTrabajoSerializer

from django.db.models import Q
from .serializers import OrdenDeTrabajoSerializer
from usuarios.models.pemisoAcceso import PermisoDeAcceso  # ajustá import según tu app

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

# class OrdenDeTrabajoViewSet(viewsets.ModelViewSet):
#     serializer_class = OrdenDeTrabajoSerializer
#     permission_classes = [IsAuthenticated]
#     queryset = OrdenDeTrabajo.objects.all()

#     def get_queryset(self):


#         user = self.request.user

#         tecnico = getattr(user, "tecnico", None)
#         if tecnico and tecnico.taller:
#             return OrdenDeTrabajo.objects.filter(taller=tecnico.taller).order_by("-fecha_turno")

#         if user.is_superuser:
#             return OrdenDeTrabajo.objects.all().order_by("-fecha_turno")

#         cliente = getattr(user, "cliente", None)
#         if cliente:
#             # Vehículos propios
#             vehiculos_propios_ids = cliente.mis_vehiculos.values_list("id", flat=True)

#             # Vehículos a los que tiene permiso (como cliente autorizado)
#             vehiculos_permitidos_ids = PermisoDeAcceso.objects.filter(
#                 cliente_autorizado=cliente,
#                 vehiculo_autorizado__isnull=False
#             ).values_list("vehiculo_autorizado_id", flat=True)

#             return (
#                 OrdenDeTrabajo.objects.filter(
#                     Q(vehiculo_id__in=vehiculos_propios_ids) |
#                     Q(vehiculo_id__in=vehiculos_permitidos_ids)
#                 )
#                 .distinct()
#                 .order_by("-fecha_turno")
#             )

#         print("Cliente:", cliente)
#         print("Permisos encontrados:", PermisoDeAcceso.objects.filter(cliente_autorizado=cliente))

#         return OrdenDeTrabajo.objects.none()
    