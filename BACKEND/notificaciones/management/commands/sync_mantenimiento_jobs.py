from datetime import datetime, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from notificaciones.models.notificaciones import NotificationJob
from vehiculos.models.vehiculo import Vehiculo


KIND = "MANTENIMIENTO_15_DIAS"
DAYS_BEFORE = 15
SEND_TIME = time(10, 0)  # 10:00


def build_idempotency_key(vehiculo_id: int, target_date) -> str:
    return f"{KIND}|vehiculo={vehiculo_id}|target={target_date.isoformat()}"


class Command(BaseCommand):
    help = "Crea/cancela jobs de WhatsApp para mantenimiento recomendado (15 días antes a las 10:00)."

    def handle(self, *args, **options):
        tz = timezone.get_current_timezone()
        created = 0
        updated = 0
        cancelled = 0
        skipped_no_date = 0
        skipped_no_phone = 0

        # Traemos vehículos y dueño
        ##CON SELECT_RELATED OPTIMIZAMOS LA QUERY, ES DECIR TRAEMOS EL OBJ RELACIONADO Y EL OBJETO RELACIONADO DEL RELACIONADO HACIENDO UN JOIN (ALEXIS)
        vehiculos = Vehiculo.objects.select_related("propietario", "propietario__usuario").all()

        with transaction.atomic():
            for v in vehiculos:
                target_date = v.fecha_prox_servicio
                cliente = v.propietario
                telefono = (cliente.usuario.telefono or "").strip() if cliente and cliente.usuario else ""

                # Opt-out: si el cliente desactiva WhatsApp, cancelamos pending y no creamos nuevos
                if cliente and hasattr(cliente, "whatsapp_opt_in") and not cliente.whatsapp_opt_in:
                    q = NotificationJob.objects.filter(vehiculo=v, kind=KIND, status="pending")
                    cancelled += q.update(status="cancelled")
                    continue

                # 1) Si no hay fecha objetivo: cancelamos pendientes y seguimos
                if not target_date:
                    skipped_no_date += 1
                    q = NotificationJob.objects.filter(
                        vehiculo=v,
                        kind=KIND,
                        status="pending",
                    )
                    cancelled += q.update(status="cancelled")
                    continue

                # 2) Si no hay teléfono: NO creamos job (y cancelamos pendientes)
                if not telefono:
                    skipped_no_phone += 1
                    q = NotificationJob.objects.filter(
                        vehiculo=v,
                        kind=KIND,
                        status="pending",
                    )
                    cancelled += q.update(status="cancelled")
                    continue

                # 3) Calculamos cuándo hay que enviar: target_date - 15 días a las 10:00 (TZ local)
                scheduled_date = target_date - timedelta(days=DAYS_BEFORE)
                scheduled_dt_naive = datetime.combine(scheduled_date, SEND_TIME) #naive sin zona horaria
                scheduled_for = timezone.make_aware(scheduled_dt_naive, tz) #con zona horaria local

                # 4) Key única por (vehiculo + kind + target_date)
                key = build_idempotency_key(v.id, target_date)

                # 5) Cancelar jobs pendientes viejos (si cambiaron la fecha)
                q_old = NotificationJob.objects.filter(
                    vehiculo=v,
                    kind=KIND,
                    status="pending",
                ).exclude(idempotency_key=key)
                cancelled += q_old.update(status="cancelled")

                # 6) Crear o actualizar el job correcto
                job, was_created = NotificationJob.objects.get_or_create(
                    idempotency_key=key,
                    defaults={
                        "vehiculo": v,
                        "cliente": cliente,
                        "kind": KIND,
                        "target_date": target_date,
                        "scheduled_for": scheduled_for,
                        "status": "pending",
                    },
                )

                if was_created:
                    created += 1
                else:
                    # Si ya existe pero cambió algo (raro, pero posible), lo alineamos
                    changed = False
                    if job.scheduled_for != scheduled_for:
                        job.scheduled_for = scheduled_for
                        changed = True
                    if job.status == "cancelled":
                        # si lo habían cancelado manualmente, lo respetamos (no lo reactivamos)
                        pass
                    if changed:
                        job.save(update_fields=["scheduled_for", "updated_at"])
                        updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"OK sync {KIND} | created={created} updated={updated} cancelled={cancelled} "
            f"skipped_no_date={skipped_no_date} skipped_no_phone={skipped_no_phone}"
        ))
