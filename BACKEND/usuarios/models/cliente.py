from datetime import date

from django.db import models

from usuarios.models.pemisoAcceso import PermisoDeAcceso
from vehiculos.models.vehiculo import Vehiculo

class Cliente(models.Model):
    #CAMI: si pones on_delete en cascade, no necesitas reescribir el metodo destroy en la view.
    # haciendo eso decis si se borra un usuario, tambien se borra cliente
    usuario = models.OneToOneField("Usuario", on_delete=models.CASCADE, related_name="clientes")
    #whatsapp_opt_in = models.BooleanField(default=True)

    # PERMISOS QUE OTORGA
    @property
    def vehiculos_propios_autorizados(self):
        return [permiso.vehiculo_autorizado for permiso in self.permiso_que_otorgo.all()]

    @property
    def talleres_autorizados(self):
        return [permiso.taller_autorizado for permiso in self.permiso_que_otorgo.all()]

    @property
    def clientes_autorizados(self):
        return [permiso.cliente_autorizado for permiso in self.permiso_que_otorgo.all()]

    @property
    def permisos_otorgados(self):
        return self.permisos_que_otorgo.all()

    # FIN PERMISOS QUE OTORGA

    # PERMISOS RECIBIDOS
    @property
    def permisos_recibidos(self):
        return self.permisos_que_recibi.all()

    @property
    def vehiculos_externos_autorizados(self):
        permisos = self.permisos_recibidos
        return [permiso.vehiculo_autorizado for permiso in permisos]
        # return vehiculos

    def tiene_permiso(self, vehiculo):
        return (vehiculo.id in self.mis_vehiculos.values_list("id", flat=True)) or (
            vehiculo.id in [v.id for v in self.vehiculos_externos_autorizados]
        )

    # VEHICULOS
    def crear_vehiculo(self, modelo=None, dominio=None, año=None, **kwargs):
        vehiculo = Vehiculo.objects.create(
            modelo=modelo, año=año, dominio=dominio, propietario=self
        )
        return vehiculo

    @property
    def mis_vehiculos(self):
        return self.vehiculos.all()

    # FALTA ACTUALIZAR VEHICULO, EN ETAPA POSTERIOR.


    # CREAR PERMISO
    def crear_permiso(self, vehiculo_autorizado, cliente_autorizado=None, taller_autorizado=None, **kwargs):

        if vehiculo_autorizado.propietario_id != self.id:
            raise ValueError("No se puede otorgar permiso para un vehículo que no te pertenece.")

        # exigir exactamente uno
        if (cliente_autorizado is None and taller_autorizado is None) or (cliente_autorizado is not None and taller_autorizado is not None):
            raise ValueError("Debe autorizar a un taller o a un usuario (solo uno).")

        # evitar duplicados por tipo
        if cliente_autorizado is not None:
            if PermisoDeAcceso.objects.filter(
                vehiculo_autorizado=vehiculo_autorizado,
                autoriza=self,
                cliente_autorizado=cliente_autorizado,
            ).exists():
                raise ValueError("Ese cliente ya tiene permiso para este vehículo.")

        if taller_autorizado is not None:
            if PermisoDeAcceso.objects.filter(
                vehiculo_autorizado=vehiculo_autorizado,
                autoriza=self,
                taller_autorizado=taller_autorizado,
            ).exists():
                raise ValueError("Ese taller ya tiene permiso para este vehículo.")

        permiso = PermisoDeAcceso.objects.create(
            vehiculo_autorizado=vehiculo_autorizado,
            autoriza=self,
            cliente_autorizado=cliente_autorizado,
            taller_autorizado=taller_autorizado,
            fecha_autorizacion=date.today(),
        )
        return permiso

    # # CREAR PERMISO
    # def crear_permiso(
    #     self,
    #     vehiculo_autorizado,
    #     cliente_autorizado=None,
    #     taller_autorizado=None,
    #     **kwargs,
    # ):

    #     if vehiculo_autorizado.propietario_id != self.id:
    #         print(f"{self} vs {vehiculo_autorizado.propietario}")
    #         raise ValueError("No se puede otorgar permiso para un vehículo que no te pertenece.")

    #     if not cliente_autorizado and not taller_autorizado:
    #         raise ValueError("Debe autorizar a un taller o a un usuario.")

    #     if PermisoDeAcceso.objects.filter(
    #         vehiculo_autorizado=vehiculo_autorizado,
    #         cliente_autorizado=cliente_autorizado,
    #         taller_autorizado=taller_autorizado,
    #     ).exists():
    #         raise ValueError("Ya existe un permiso igual.")

    #     permiso = PermisoDeAcceso.objects.create(
    #         vehiculo_autorizado=vehiculo_autorizado,
    #         autoriza=self,
    #         cliente_autorizado=cliente_autorizado,
    #         taller_autorizado=taller_autorizado,
    #         fecha_autorizacion=date.today(),
    #     )
    #     return permiso

    

    def __str__(self):
        return f"id:{self.pk} - username:{self.usuario.username}"
