from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from agendas.models import Agenda
from .models import OrdenDeTrabajo
from .serializers import OrdenDeTrabajoSerializer
from rest_framework.exceptions import ValidationError

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
        # if tecnico and tecnico.taller:
        #     # vehículos a los que este taller tiene permiso
        #     vehiculos_ids = PermisoDeAcceso.objects.filter(
        #         taller_autorizado_id=tecnico.taller_id
        #     ).values_list("vehiculo_autorizado_id", flat=True)

        #     # devuelve: órdenes del taller + órdenes de vehículos autorizados
        #     return (
        #         OrdenDeTrabajo.objects.filter(
        #             Q(taller_id=tecnico.taller_id) |
        #             Q(vehiculo_id__in=vehiculos_ids)
        #         )
        #         .distinct()
        #         .order_by("-fecha_turno", "-id")
        #     )

        # Si no es técnico (admin global, superuser, etc.)
        # Podés devolver todo o nada
        if user.is_superuser:
            return OrdenDeTrabajo.objects.all()

        return OrdenDeTrabajo.objects.none()
    
    def perform_create(self, serializer):
        orden = serializer.save()

        # Si viene taller y no viene agenda, la asignamos automáticamente
        if orden.taller_id and orden.agenda_id is None:
            agenda, _ = Agenda.objects.get_or_create(taller_id=orden.taller_id)
            orden.agenda = agenda

            # Lock de la agenda
            agenda = Agenda.objects.select_for_update().get(id=orden.agenda_id)

            try:
                agenda.verificar_disponibilidad(orden.fecha_turno)
            except ValueError:
                raise ValidationError({
                    "fecha_turno": "Ya existe una orden con ese horario en tu agenda."
                })


            orden.save(update_fields=["agenda"])

    def perform_update(self, serializer):
        orden = serializer.save()
        if orden.taller_id and orden.agenda_id is None:
            agenda, _ = Agenda.objects.get_or_create(taller_id=orden.taller_id)
            orden.agenda = agenda
            orden.save(update_fields=["agenda"])
    
    @action(detail=False, methods=["get"], url_path=r"vehiculo/(?P<vehiculo_id>\d+)/historial")
    def historial_por_vehiculo(self, request, vehiculo_id=None):
        tecnico = getattr(request.user, "tecnico", None)
        if not tecnico or not tecnico.taller_id:
            return Response({"detail": "Usuario no es técnico."}, status=403)

        taller_id = tecnico.taller_id

        tiene_permiso = PermisoDeAcceso.objects.filter(
            taller_autorizado_id=taller_id,
            vehiculo_autorizado_id=vehiculo_id
        ).exists()

        qs = OrdenDeTrabajo.objects.filter(vehiculo_id=vehiculo_id)

        if not tiene_permiso:
            qs = qs.filter(taller_id=taller_id)   # 👈 solo propias si no hay permiso

        qs = qs.order_by("-fecha_turno", "-id")
        return Response(OrdenDeTrabajoSerializer(qs, many=True).data)


    
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
    