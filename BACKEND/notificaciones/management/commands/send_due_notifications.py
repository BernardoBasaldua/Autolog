from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from notificaciones.models import NotificationJob, NotificationLog
from notificaciones.services.whatsapp_client import WhatsAppClient


class Command(BaseCommand):
    help = "Envía notificaciones pendientes cuyo scheduled_for ya llegó (due)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="No envía, solo simula.")
        parser.add_argument("--limit", type=int, default=50, help="Máximo de jobs a procesar.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        limit = options["limit"]

        now = timezone.now()

        # Seleccionamos jobs vencidos
        qs = (
            NotificationJob.objects
            .select_related("vehiculo", "cliente", "cliente__usuario")
            .filter(status="pending", scheduled_for__lte=now)
            .order_by("scheduled_for")[:limit]
        )

        processed = 0
        sent = 0
        failed = 0

        client = WhatsAppClient()

        with transaction.atomic():
            for job in qs:
                processed += 1

                # Opt-out: si el cliente desactivó WhatsApp, no enviamos y cancelamos el job
                if hasattr(job.cliente, "whatsapp_opt_in") and not job.cliente.whatsapp_opt_in:
                    NotificationLog.objects.create(
                        job=job,
                        provider="whatsapp",
                        status="skipped",
                        http_status=None,
                        response_body="Cliente con whatsapp_opt_in=False",
                    )
                    job.status = "cancelled"
                    job.attempts += 1
                    job.save(update_fields=["status", "attempts"])
                    continue
                
                try:
                    telefono = (job.cliente.usuario.telefono or "").strip()
                    if not telefono:
                        raise ValueError("Cliente sin teléfono")

                    # Normalizamos a formato E.164 sin '+'
                    telefono_e164 = telefono.replace("+", "").strip()

                    if dry_run:
                        NotificationLog.objects.create(
                            job=job,
                            provider="whatsapp",
                            status="ok",
                            http_status=None,
                            response_body="DRY_RUN: simulated send",
                        )
                        job.status = "sent"
                        job.attempts += 1
                        job.save(update_fields=["status", "attempts"])
                        sent += 1
                        continue

                    # ENVÍO REAL (por ahora con hello_world)
                    template_name = "hello_world"

                    # Variables {{1}}, {{2}}, {{3}}
                    nombre = (job.cliente.usuario.first_name or "Hola").strip() if hasattr(job.cliente.usuario, "first_name") else "Hola"

                    vehiculo_txt = f"{job.vehiculo.modelo.marca.nombre} {job.vehiculo.modelo.nombre} {job.vehiculo.dominio}"

                    fecha_txt = job.target_date.strftime("%d/%m/%Y")  # ej: 15/03/2026

                    variables = [nombre, vehiculo_txt, fecha_txt]

                    status_code, body = client.send_template(
                        to_number=telefono_e164,
                        template_name=template_name,
                        variables=variables,
                    )

                    NotificationLog.objects.create(
                        job=job,
                        provider="whatsapp",
                        status="ok" if status_code in (200, 201) else "error",
                        http_status=status_code,
                        response_body=body,
                    )

                    if status_code in (200, 201):
                        job.status = "sent"
                        sent += 1
                    else:
                        job.status = "failed"
                        failed += 1

                    job.attempts += 1
                    job.save(update_fields=["status", "attempts"])

                except Exception as e:
                    NotificationLog.objects.create(
                        job=job,
                        provider="whatsapp",
                        status="error",
                        http_status=None,
                        response_body=str(e),
                    )
                    job.status = "failed"
                    job.attempts += 1
                    job.save(update_fields=["status", "attempts"])
                    failed += 1

        self.stdout.write(self.style.SUCCESS(
            f"OK send_due_notifications | processed={processed} sent={sent} failed={failed} dry_run={dry_run}"
        ))