from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError, transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from talleres.serializers import TallerSerializer
from ordenes.models.ordenDeTrabajo import OrdenDeTrabajo
from ordenes.serializers import OrdenDeTrabajoSerializer
from vehiculos.models import Vehiculo
from vehiculos.serializers import VehiculoSerializer
from usuarios.models import PermisoDeAcceso

from .models import AdministradorTecnico, Cliente, Usuario
from .serializers import (
    AdministradorTecnicoSerializer,
    ClienteSerializer,
    PermisoSerializer,
    UsuarioSerializer,
)


# ViewSets define el comportamiento de la vista
class UsuarioViewSet(viewsets.ModelViewSet):

    queryset = Usuario.objects.all().order_by("-date_joined")
    serializer_class = UsuarioSerializer

    def get_queryset(self):
        # Cualquier usuario solo puede acceder a su propio perfil.
        if self.request.user.is_authenticated:
            return Usuario.objects.filter(pk=self.request.user.pk)
        else:
            return Usuario.objects.none()

# ----------------------------CLIENTE-------------------------------------------#
class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    # permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]  # registro público
        return [IsAuthenticated()]  # el resto protegido

    def get_queryset(self):
        user = self.request.user
        # si no está autenticado, no devolver nada (por seguridad)
        # if not user.is_authenticated:   #ESTO ESTA RESUELTO EN LOS PERMISOS
        #     return Cliente.objects.none()
        # si es staff/superuser podés dejar que vea todo (si querés)
        if user.is_staff or user.is_superuser:
            return Cliente.objects.all()
        # si es técnico y querés que vea todo, descomentár, PERO ACA A LOS TECNICOS LOS VAMOS A CREAR COMO SUPERADMIN, POR LO QUE NO ES NECESARIO
        # if hasattr(user, "tecnico"):
        #     return Cliente.objects.all()
        # cliente común: solo su propio registro
        return Cliente.objects.filter(usuario=user)
        #return Cliente.objects.all()

    #CAMI fijate en el modelo cliente, la propiedad usuario
    def destroy(self, request, *args, **kwargs):
        """
        Cuando se elimina un Cliente desde /api/clientes/<id>/,
        también se elimina el Usuario asociado.
        """
        cliente = self.get_object()
        usuario = cliente.usuario

        # (Opcional) seguridad extra: solo puede borrar su propio cliente,
        # salvo que sea staff/superuser
        if usuario != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "No tenés permiso para eliminar esta cuenta."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 1) borrar el cliente
        self.perform_destroy(cliente)

        # 2) borrar el usuario asociado
        usuario.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


    # crear permiso de acceso
    @action(detail=True, methods=["post", "get"])
    def acceso(self, request, pk=None):
        if request.method == "POST":
            serializer = PermisoSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            data_request = serializer.validated_data
            # print(data_request)
            cliente = self.get_object()
            permiso = cliente.crear_permiso(**data_request)
            return Response(PermisoSerializer(permiso).data, status=status.HTTP_201_CREATED)
        
        elif request.method == "GET":
            cliente = self.get_object()
            # aquí asumo que tienes una relación cliente.permisos
            permisos = cliente.permisos_otorgados.all()
            serializer = PermisoSerializer(permisos, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["delete"])
    def eliminar_permiso(self, request, pk=None):
        cliente = self.get_object()
        # Aquí asumo que mandas el ID del permiso en el body o en query params
        permiso_id = request.data.get("permiso_id") or request.query_params.get("permiso_id")
        if not permiso_id:
            return Response({"error": "Se requiere permiso_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            permiso = cliente.permisos_otorgados.get(id=permiso_id)
            permiso.delete()
            return Response({"detail": "Permiso eliminado correctamente"}, status=status.HTTP_204_NO_CONTENT)
        except PermisoDeAcceso.DoesNotExist:
            return Response({"error": "Permiso no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    #historial de todas las ordenes de todos los vehiculos e un cliente
    @action(detail=False, methods=['get'], url_path='historial_todos')
    def historial_todos(self, request):
        """
        Devuelve TODAS las órdenes de TODOS los vehículos DEL CLIENTE AUTENTICADO.
        """
        user = request.user

        # Obtener el cliente asociado al usuario autenticado
        try:
            cliente = user.clientes
        except Exception:
            return Response(
                {'mensaje': 'El usuario autenticado no tiene un cliente asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener vehículos relacionados al cliente
        vehiculos = cliente.mis_vehiculos.all()

        if not vehiculos.exists():
            return Response(
                {'mensaje': 'El cliente no tiene vehículos asociados.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Obtener órdenes
        from ordenes.models.ordenDeTrabajo import OrdenDeTrabajo
        ordenes = (
            OrdenDeTrabajo.objects
            .filter(vehiculo__in=vehiculos)
            .order_by('-fecha_turno', '-id')
        )

        if not ordenes.exists():
            return Response(
                {'mensaje': 'No hay órdenes para ninguno de tus vehículos.'},
                status=status.HTTP_404_NOT_FOUND
            )

        from ordenes.serializers import OrdenDeTrabajoSerializer
        serializer = OrdenDeTrabajoSerializer(ordenes, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


    
    
    # ver historial
    @action(detail=True, methods=["get"])
    def historial(self, request, pk=None):
        cliente = self.get_object()
        vehiculo_id = request.query_params.get("vehiculo_id")

        if not vehiculo_id:
            return Response(
                {"error": "vehiculo_id es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            vehiculo = Vehiculo.objects.get(pk=vehiculo_id)
        except Vehiculo.DoesNotExist:
            return Response({"error": "vehiculo no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if cliente.tiene_permiso(vehiculo):
            try:
                historial = vehiculo.historial
                serializer = OrdenDeTrabajoSerializer(historial, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ObjectDoesNotExist:
                return Response(
                    {"mensaje": "El vehiculo no tiene historial de órdenes."},
                    status=404,
                )
        else:
            return Response(
                {"mensaje": "no tenes permiso para ver este historial de vehiculo"},
                status=status.HTTP_404_NOT_FOUND,
            )

    # vehiculos del cliente
    @action(detail=False, methods=["get"])
    def vehiculos(self, request):
        cliente = Cliente.objects.get(usuario=self.request.user)
        vehiculos = cliente.mis_vehiculos
        if not vehiculos.exists():
            return Response(
                {"mensaje": "usted no tiene vehiculos asociados"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = VehiculoSerializer(vehiculos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # proximo service un vehiculo
    @action(detail=True, methods=["get"])
    def service(self, request, pk=None):
        cliente = self.get_object()
        vehiculo_id = request.query_params.get("vehiculo_id")
        try:
            vehiculo = Vehiculo.objects.get(pk=vehiculo_id)
        except Vehiculo.DoesNotExist:
            return Response({"mensaje": "vehiculo no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if not cliente.tiene_permiso(vehiculo):
            return Response(
                {"mensaje": "No tenés permiso para ese vehículo"},
                status=status.HTTP_403_FORBIDDEN,
            )

        fecha = vehiculo.fecha_prox_servicio
        kilometraje = vehiculo.kilometraje_prox_servicio

        if not fecha or not kilometraje:
            return Response(
                {"mensaje": "vehiculo sin proximo servicio estimado"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {"fecha_prox_servicio": fecha, "kilometraje_prox_servicio": kilometraje},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])  # /api/clientes/id de cliente/crear_vehiculo
    def crear_vehiculo(self, request, pk=None):
        serializer = VehiculoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vehiculo_data = serializer.validated_data
        cliente = self.get_object()
        try:
            vehiculo = cliente.crear_vehiculo(**vehiculo_data)
        except IntegrityError:
            return Response(
                {"mensaje": "ya existe un vehiculo con esa patente"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"id": vehiculo.id, "mensaje": "vehiculo creado"},
            status=status.HTTP_201_CREATED,
        )


# ----admintec
class AdministradorTecnicoViewSet(viewsets.ModelViewSet):
    queryset = AdministradorTecnico.objects.all()
    serializer_class = AdministradorTecnicoSerializer
    
    def get_permissions(self):
        if self.action == "registrar_establecimiento":
            # Registro público de establecimiento
            return [AllowAny()]
        return [IsAuthenticated()]
    # permission_classes = [permissions.AllowAny] # acceso público por ahora para probar

    def get_queryset(self):
        # El técnico solo puede acceder a su propio perfil (objeto AdministradorTecnico)
        if self.request.user.is_authenticated:
            return AdministradorTecnico.objects.filter(usuario=self.request.user)
    
    # --- nuevo endpoint para registrar taller + usuario técnico ---
    @action(detail=False, methods=["post"], url_path="registrar-establecimiento")
    def registrar_establecimiento(self, request):
        data = request.data

        # 1) Separar bloques del body
        usuario_data = data.get("usuario")
        taller_data = data.get("taller")

        if not usuario_data or not taller_data:
            return Response(
                {"detail": "Faltan datos de usuario o de taller"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2) Validar usuario y taller con sus serializers
        user_serializer = UsuarioSerializer(data=usuario_data)
        taller_serializer = TallerSerializer(data=taller_data)

        user_serializer.is_valid(raise_exception=True)
        taller_serializer.is_valid(raise_exception=True)

        # 3) Crear todo dentro de una transacción
        with transaction.atomic():
            # crea usuario con tu lógica de UsuarioSerializer.create()
            usuario = user_serializer.save()
            # marcarlo como técnico / admin del taller
            usuario.is_staff = True       # o también is_superuser=True si querés
            usuario.save()

            taller = taller_serializer.save()

            admin = AdministradorTecnico.objects.create(
                usuario=usuario,
                taller=taller,
            )

        # 4) Responder usando el serializer de AdministradorTecnico
        resp_serializer = AdministradorTecnicoSerializer(admin)
        return Response(resp_serializer.data, status=status.HTTP_201_CREATED)

    
    # Crud Cliente desde tecnico
    @action(detail=True, methods=["post"])
    def crear_cliente(self, request, pk=None):
        tecnico = self.get_object()
        serializer = ClienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        usuario_data = data["usuario"]

        cliente = tecnico.crear_cliente(
            username=usuario_data["username"],
            email=usuario_data["email"],
            password=usuario_data["password"],
            first_name=usuario_data.get("first_name", ""),
            last_name=usuario_data.get("last_name", ""),
            dni=data.get("dni"),
            telefono=data.get("telefono", ""),
            direccion=data.get("direccion", ""),
        )

        return Response(ClienteSerializer(cliente).data, status=status.HTTP_201_CREATED)

    # crud vehiculo desde tecnico
    @action(detail=True, methods=["post"])
    def crear_vehiculo(self, request, pk=None):
        tecnico = self.get_object()
        serializer = VehiculoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vehiculo = tecnico.crear_vehiculo(
            cliente=serializer.validated_data["propietario"],
            modelo=serializer.validated_data["modelo"],
            año=serializer.validated_data["año"],
            dominio=serializer.validated_data["dominio"],
        )
        return Response(VehiculoSerializer(vehiculo).data, status=status.HTTP_201_CREATED)

    # Crud OT desde tecnico
    # POST
    @action(detail=True, methods=["post"])
    def crear_orden(self, request, pk=None):
        tecnico = self.get_object()
        serializer = OrdenDeTrabajoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        orden = serializer.validated_data
        try:
            orden = tecnico.crear_orden_trabajo(**orden)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Serializar la orden creada
        serializer = OrdenDeTrabajoSerializer(orden)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # PATCH
    @action(detail=True, methods=["patch"])  # url_path="ordenes/(?P<orden_id>[^/.]+)/actualizar")
    def actualizar_orden(self, request, pk=None, orden_id=None):
        tecnico = self.get_object()
        orden_id = request.query_params.get("orden_id")
        serializer = OrdenDeTrabajoSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        nuevos_datos = serializer.validated_data

        try:
            orden = OrdenDeTrabajo.objects.get(pk=orden_id)

            if orden.tecnico_id != tecnico.id:
                return Response(
                    {"error": "No tiene permiso para modificar esta orden."}, status=403
                )

            # Aplicar los cambios a la instancia
            for campo, valor in nuevos_datos.items():
                setattr(orden, campo, valor)

            orden.save()

            # Podés usar un serializer
            return Response({"mensaje": "Orden actualizada correctamente", "orden_id": orden.id})

        except OrdenDeTrabajo.DoesNotExist:
            return Response({"error": f"No existe la orden con ID {orden_id}"}, status=404)

    # DELETE
    @action(detail=True, methods=["delete"], url_path="orden/(?P<orden_id>[^/.]+)/eliminar")
    def eliminar_orden(self, request, pk=None, orden_id=None):
        tecnico = self.get_object()
        try:
            mensaje = tecnico.eliminar_orden_trabajo(orden_id)
            return Response({"mensaje": mensaje}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)

    # GET
    @action(detail=True, methods=["get"], url_path="ordenes_del_taller")
    def ordenes_del_taller(self, request, pk=None):
        # --- INICIO DE DEPURACIÓN ---
        print("=============================================")
        try:
            tecnico = self.get_object()
            print(f"✅ Técnico encontrado: {tecnico} (ID: {tecnico.id})")

            if tecnico.taller:
                print(f"✅ Taller del técnico: {tecnico.taller.nombre} (ID: {tecnico.taller.id})")

                # Esta es la consulta clave
                ordenes = tecnico.taller.orden_de_trabajo.all()

                print(
                    f"🔍 Consulta realizada: OrdenDeTrabajo.objects.filter(taller_id={tecnico.taller.id})"
                )
                print(f"📊 Cantidad de órdenes encontradas: {ordenes.count()}")
                print(f"📦 Órdenes: {list(ordenes)}")

            else:
                print("❌ ERROR: Este técnico no tiene un taller asignado.")
                ordenes = OrdenDeTrabajo.objects.none()

        except AdministradorTecnico.DoesNotExist:
            print(f"❌ ERROR: No se encontró ningún técnico con el ID: {pk}")
            return Response({"error": "Técnico no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        print("=============================================")
        # --- FIN DE DEPURACIÓN ---
        tecnico = self.get_object()
        ordenes = tecnico.get_ordenes_taller()
        serializer = OrdenDeTrabajoSerializer(ordenes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="orden/(?P<orden_id>[^/.]+)")
    def detalle_orden(self, request, pk=None, orden_id=None):
        # --- INICIO DE DEPURACIÓN ---
        print("\n=============================================")
        print("--- 🚀 Dentro de detalle_orden() en la VISTA ---")
        print(f"ID del técnico recibido (pk): {pk}")
        print(f"ID de la orden recibido (orden_id): {orden_id}")
        # --- FIN DE DEPURACIÓN ---
        tecnico = self.get_object()
        orden = tecnico.obtener_orden(orden_id)
        if not orden:
            return Response(
                {"detail": "Orden no encontrada o no pertenece a este taller."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrdenDeTrabajoSerializer(orden)
        return Response(serializer.data)


# @action(detail=True, methods=["get"])
# def ordenes(self, request, pk=None):
#     tecnico = self.get_object()
#     ordenes = OrdenDeTrabajo.objects.filter(taller=tecnico.taller)
#     serializer = OrdenDeTrabajoSerializer(ordenes, many=True)
#     return Response(serializer.data)
# @action(detail=True, methods=["post"])
# def crear_orden(self, request, pk=None):
#     tecnico = self.get_object()
#     serializer = OrdenDeTrabajoSerializer(data=request.data)
#     if serializer.is_valid():
#         serializer.save(tecnico=tecnico, taller=tecnico.taller)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# @action(detail=True, methods=["patch", "delete"], url_path="ordenes/(?P<orden_id>[^/.]+)")
# def modificar_orden(self, request, pk=None, orden_id=None):
#     tecnico = self.get_object()
#     try:
#         orden = OrdenDeTrabajo.objects.get(id=orden_id, taller=tecnico.taller)
#     except OrdenDeTrabajo.DoesNotExist:
#         return Response({"error": "Orden no encontrada."}, status=404)
#     if request.method == "PATCH":
#         serializer = OrdenDeTrabajoSerializer(orden, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data)
#         return Response(serializer.errors, status=400)
#     if request.method == "DELETE":
#         orden.delete()
#         return Response(status=204)
# def perform_update(self, serializer):
#     serializer.save()
# def perform_destroy(self, instance):
#     if instance.usuario == self.request.user:
#         instance.delete()
# #crear vehiculo
# @action(detail=True, methods=['post'])
# def crear_vehiculo(self, request, pk=None):
#     tecnico = self.get_object()
#     serializer = VehiculoSerializer(data=request.data)
#     if serializer.is_valid():
#         serializer.save(creado_por=tecnico)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#  #crear cliente
# @action(detail=True, methods=['post'])
# def crear_cliente(self, request, pk=None):
#     tecnico = self.get_object()
#     serializer = ClienteSerializer(data=request.data)
#     if serializer.is_valid():
#         cliente = serializer.save()
#         # si querés podés hacer algo con el cliente creado y el técnico, ej: asignar taller etc.
#         return Response(ClienteSerializer(cliente).data, status=status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
