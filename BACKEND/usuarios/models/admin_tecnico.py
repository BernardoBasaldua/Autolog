from django.conf import settings
from django.db import models

from ordenes.models.ordenDeTrabajo import OrdenDeTrabajo
from talleres.models.taller import Taller
from usuarios.models.pemisoAcceso import PermisoDeAcceso
from vehiculos.models.vehiculo import Vehiculo

from .usuario import Usuario


class AdministradorTecnico(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tecnico"
    )
    taller = models.ForeignKey(Taller, on_delete=models.CASCADE, related_name="tecnicos")

    class Meta:
        verbose_name = "Administrador Técnico"
        verbose_name_plural = "Administradores Técnicos"

    def __str__(self):
        return f"{self.usuario.username} (Técnico en {self.taller.nombre})"

    # #creás solo un objeto Cliente con todos los campos requeridos (incluidos los de Usuario).
    def crear_cliente(
        self,
        username,
        email,
        password,
        first_name,
        last_name=None,
        dni=None,
        telefono=None,
        direccion=None,
    ):
        from .cliente import Cliente

        usuario_cliente = Usuario.objects.create_user(  # El password queda hasheado correctamente y podés usar el sistema de autenticación de Django.
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name or "",
            dni=dni,
            telefono=telefono or "",
            direccion=direccion or "",
        )
        cliente = Cliente.objects.create(usuario=usuario_cliente)
        return cliente

    def crear_vehiculo(self, cliente, modelo, año, dominio):
        from vehiculos.models.vehiculo import Vehiculo

        return Vehiculo.objects.create(
            propietario=cliente,
            modelo=modelo,
            año=año,
            dominio=dominio,
        )

    # OT
    # CREATE
    def crear_orden_trabajo(
        self,
        cliente,
        vehiculo,
        fecha_turno,
        kilometraje,
        mantenimiento="preventivo",
        observaciones_tecnicas=None,
        fecha_entrega=None,
    ):
        from ordenes.models.ordenDeTrabajo import OrdenDeTrabajo

        # NO ESTOY SEGURA DE QUE SEA NECESARIO
        if mantenimiento not in dict(OrdenDeTrabajo.TIPOS_TRABAJO).keys():
            raise ValueError(
                f"Tipo de mantenimiento inválido: {mantenimiento}. Debe ser 'preventivo' o 'correctivo'."
            )

        orden = OrdenDeTrabajo.objects.create(
            vehiculo=vehiculo,
            tecnico=self,
            taller=self.taller,
            observaciones_tecnicas=observaciones_tecnicas,
            kilometraje=kilometraje,
            mantenimiento=mantenimiento,
            fecha_turno=fecha_turno,
            fecha_entrega=fecha_entrega,
            cliente=cliente,
        )
        # PRESUPUESTO?
        # PRACTICA?

        orden.calcular_fecha_siguiente_servicio()
        orden.save()
        return orden

    # UPDATE
    def actualizar_orden_trabajo(
        self,
        orden,
        observaciones_tecnicas=None,
        fecha_siguiente_servicio=None,
        fecha_entrega=None,
        kilometraje=None,
        kilometraje_siguiente_servicio=None,
        mantenimiento=None,
        fecha_turno=None,
    ):

        # Validación opcional: solo puede modificar sus propias órdenes
        if orden.tecnico != self:
            raise PermissionError("No tiene permiso para modificar esta orden.")

        # Actualizamos solo si se pasa un valor nuevo
        if observaciones_tecnicas is not None:
            orden.observaciones_tecnicas = observaciones_tecnicas
        if fecha_siguiente_servicio is not None:
            orden.fecha_siguiente_servicio = fecha_siguiente_servicio
        if fecha_entrega is not None:
            orden.fecha_entrega = fecha_entrega
        if kilometraje is not None:
            orden.kilometraje = kilometraje
        if kilometraje_siguiente_servicio is not None:
            orden.kilometraje_siguiente_servicio = kilometraje_siguiente_servicio
        if mantenimiento is not None:
            orden.mantenimiento = mantenimiento
        if fecha_turno is not None:
            orden.fecha_turno = fecha_turno

        # Guardamos
        orden.save()
        return orden

    # DELETE
    def eliminar_orden_trabajo(self, orden_id):

        try:
            orden = OrdenDeTrabajo.objects.get(pk=orden_id)
        except OrdenDeTrabajo.DoesNotExist:
            raise ValueError("La orden no existe.")

        if orden.tecnico_id != self.id:
            raise PermissionError("No tenés permiso para eliminar esta orden.")

        orden.delete()
        return f"Orden {orden_id} eliminada correctamente."

    # GET
    def get_ordenes_taller(self):
        permisos = PermisoDeAcceso.objects.filter(taller_autorizado=self.taller).values_list(
            "vehiculo_autorizado_id", flat=True
        )
        vehiculos = Vehiculo.objects.filter(id__in=permisos)
        ordenes_autorizadas = OrdenDeTrabajo.objects.filter(vehiculo__in=vehiculos)
        ordenes_directas = OrdenDeTrabajo.objects.filter(taller=self.taller)
        ordenes = ordenes_directas.union(ordenes_autorizadas)
        return ordenes

    def obtener_orden(self, orden_id):
        try:
            # Busca la orden que pertenece al taller del técnico y tiene ese id
            return OrdenDeTrabajo.objects.get(id=orden_id, taller=self.taller)
        except OrdenDeTrabajo.DoesNotExist:
            return None
