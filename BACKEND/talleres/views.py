from rest_framework import viewsets
from django.contrib.auth import get_user_model

from usuarios.models.cliente import Cliente
from .models.taller import Taller
from .serializers import TallerSerializer


class TallerViewSet(viewsets.ModelViewSet):
    queryset = Taller.objects.all()
    serializer_class = TallerSerializer

    def perform_destroy(self, instance: Taller):
        User = get_user_model()
        taller = instance 
        # Técnicos del taller (usá tecnico_set si no tenés related_name)
        tecnicos = taller.tecnicos.all()

        # guardo los IDs de usuarios de cada tecnico asociado al taller antes de borrar nada
        user_ids = {tecnico.usuario_id for tecnico in tecnicos if tecnico.usuario_id}

        # reviso cada usuario y lo borro solo si NO es cliente
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                continue

            # ¿este user tiene un Cliente asociado?
            es_cliente = Cliente.objects.filter(usuario=user).exists()
            user.delete()
            # if not es_cliente:
            #     user.delete()
        
        # borro el taller (y en cascada se borran los técnicos)
        super().perform_destroy(taller)