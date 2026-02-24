# from django.db import models
# import datetime

# # Modelo para la configuración de la agenda de un Taller
# class Agenda(models.Model):
#     taller = models.OneToOneField(
#         'talleres.Taller',
#         on_delete=models.CASCADE,
#         related_name='agenda'
#     )

#     # En lugar de una lista, usamos campos booleanos para los días laborales. Es más eficiente.
#     lunes = models.BooleanField(default=True)
#     martes = models.BooleanField(default=True)
#     miercoles = models.BooleanField(default=True)
#     jueves = models.BooleanField(default=True)
#     viernes = models.BooleanField(default=True)
#     sabado = models.BooleanField(default=False)
#     domingo = models.BooleanField(default=False)

#     horario_desde = models.TimeField()
#     horario_hasta = models.TimeField()
#     turnos_maximos_por_hora = models.PositiveIntegerField(default=1)

#     def __str__(self):
#         return f"Agenda de {self.taller.nombre}"


#         # --- NUEVOS MÉTODOS PARA LA LÓGICA DE TURNOS ---

#     def verificar_disponibilidad(self, fecha_hora_propuesta):
#         """
#         Verifica si un slot de tiempo específico está disponible.
#         """
#         # 1. ¿El día de la semana se trabaja?
#         dias_laborales = [self.lunes, self.martes, self.miercoles, self.jueves, self.viernes, self.sabado, self.domingo]
#         if not dias_laborales[fecha_hora_propuesta.weekday()]:
#             return False # No es un día laboral

#         # 2. ¿La hora está dentro del horario laboral?
#         if not (self.horario_desde <= fecha_hora_propuesta.time() < self.horario_hasta):
#             return False # Fuera de horario

#         # 3. ¿Hay lugar en esa franja horaria?
#         turnos_en_esa_hora = self.ordenes.filter(fecha_turno__hour=fecha_hora_propuesta.hour).count()
#         if turnos_en_esa_hora >= self.turnos_maximos_por_hora:
#             return False # No hay más cupos en esta hora

#         return True # ¡Hay lugar!

#     def obtener_turnos_disponibles(self, dia):
#         """
#         Genera una lista de horarios disponibles para un día específico.
#         """
#         turnos_disponibles = []

#         # Generar slots de una hora desde el inicio hasta el fin de la jornada
#         hora_actual = datetime.datetime.combine(dia, self.horario_desde)
#         hora_fin = datetime.datetime.combine(dia, self.horario_hasta)

#         while hora_actual < hora_fin:
#             # Usamos el método anterior para chequear cada slot
#             if self.verificar_disponibilidad(hora_actual):
#                 turnos_disponibles.append(hora_actual.time())

#             # Avanzamos a la siguiente hora
#             hora_actual += datetime.timedelta(hours=1)

#         return turnos_disponibles

"""Aca le mandamos mecha a la nuevo"""
import datetime

from django.db import models
from django.utils import timezone

class Agenda(models.Model):
    """Modelo para la configuración de la agenda de un Taller.
    Contiene la lógica para la gestión de turnos.
    """

    taller = models.OneToOneField(
        "talleres.Taller", on_delete=models.CASCADE, related_name="agenda"
    )

    # Configuración de días laborales
    lunes = models.BooleanField(default=True)
    martes = models.BooleanField(default=True)
    miercoles = models.BooleanField(default=True)
    jueves = models.BooleanField(default=True)
    viernes = models.BooleanField(default=True)
    sabado = models.BooleanField(default=False)
    domingo = models.BooleanField(default=False)

    # Configuración de horarios
    horario_desde = models.TimeField(default="07:00")
    horario_hasta = models.TimeField(default="18:00")

    # Capacidad del taller
    turnos_maximos_por_hora = models.PositiveIntegerField(default=0)

    def __str__(self):
        # Asumiendo que el modelo Taller tiene un campo 'nombre'
        return f"Agenda de {self.taller.nombre}"

    def get_turnos_asignados(self, fecha_inicio=None, fecha_fin=None):
        """Devuelve un listado de todas las órdenes de trabajo (turnos)
        asignadas a esta agenda, opcionalmente filtradas por un rango de fechas.
        """
        turnos = self.ordenes.filter(fecha_turno__isnull=False).order_by("fecha_turno")
        if fecha_inicio:
            turnos = turnos.filter(fecha_turno__gte=fecha_inicio)
        if fecha_fin:
            turnos = turnos.filter(fecha_turno__lte=fecha_fin)
        return turnos

    def verificar_disponibilidad(self, fecha_hora_propuesta):
        """Verifica si un slot de tiempo específico está disponible en la agenda."""
        # 1. Validar que la fecha/hora sea en el futuro
        if fecha_hora_propuesta <= timezone.now():
            raise ValueError("No se pueden reservar turnos en el pasado.")

        # 2. Validar si es un día laboral
        dias_laborales = [
            self.lunes,
            self.martes,
            self.miercoles,
            self.jueves,
            self.viernes,
            self.sabado,
            self.domingo,
        ]
        if not dias_laborales[fecha_hora_propuesta.weekday()]:
            raise ValueError("El día seleccionado no es un día laboral.")

        # 3. Validar si está dentro del horario laboral
        if not (self.horario_desde <= fecha_hora_propuesta.time() <= self.horario_hasta):
            raise ValueError("El horario seleccionado está fuera del horario laboral.")

        # 4. Validar si hay cupos disponibles en esa franja horaria
        turnos_en_esa_hora = (
            self.get_turnos_asignados()
            .filter(
                fecha_turno__date=fecha_hora_propuesta.date(),
                fecha_turno__hour=fecha_hora_propuesta.hour,
            )
            .count()
        )

        if self.turnos_maximos_por_hora and turnos_en_esa_hora >= self.turnos_maximos_por_hora:
            raise ValueError("No hay más cupos disponibles en el horario seleccionado.")

        return True  # Si todas las validaciones pasan, el turno está disponible
