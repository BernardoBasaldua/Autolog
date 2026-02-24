# # auth/views.py
# from rest_framework_simplejwt.views import TokenObtainPairView

# from .serializers import MyTokenObtainPairSerializer


# class MyTokenObtainPairView(TokenObtainPairView):
#     serializer_class = MyTokenObtainPairSerializer

# auth/views.py
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from google.oauth2 import id_token
from google.auth.transport import requests

from usuarios.models import Usuario
from .serializers import MyTokenObtainPairSerializer


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("id_token")
        if not token:
            return Response({"detail": "id_token requerido"}, status=status.HTTP_400_BAD_REQUEST)

        # 1) Verificar token contra Google (firma + exp + iss) y validar aud
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID,  # valida "aud"
            )
        except ValueError:
            return Response({"detail": "ID token inválido"}, status=status.HTTP_401_UNAUTHORIZED)

        # 2) Obtener datos del usuario desde el payload verificado
        sub = idinfo.get("sub")  # id único del usuario en Google (estable)
        email = idinfo.get("email")
        email_verified = idinfo.get("email_verified", False)
        given_name = idinfo.get("given_name", "") or ""
        family_name = idinfo.get("family_name", "") or ""

        if not email or not email_verified:
            return Response({"detail": "Email no disponible o no verificado"}, status=status.HTTP_400_BAD_REQUEST)

        # 3.1) Si ya está linkeado por google_sub, es ese usuario
        user = Usuario.objects.filter(google_sub=sub).first()

        if user is None:
            # 3.2) Si no está linkeado, intentamos linkear por email (verificado)
            user = Usuario.objects.filter(email__iexact=email).first()

            if user is None:
                return Response(
                    {"detail": "No existe una cuenta con ese email. Registrate primero."},
                    status=status.HTTP_409_CONFLICT,
                )

            if not user.google_sub:
                user.google_sub = sub
                user.save(update_fields=["google_sub"])
                    
            # else:
            #     # 3.3) No existe: creamos uno nuevo
            #     base = email.split("@")[0]
            #     username = base
            #     i = 1
            #     while Usuario.objects.filter(username=username).exists():
            #         username = f"{base}{i}"
            #         i += 1

            #     user = Usuario.objects.create(
            #         username=username,
            #         email=email,
            #         first_name=given_name,
            #         last_name=family_name,
            #         google_sub=sub,
            #     )

        # actualizamos email/nombre por si cambiaron
        changed = False
        if user.email != email:
            user.email = email
            changed = True
        if given_name and user.first_name != given_name:
            user.first_name = given_name
            changed = True
        if family_name and user.last_name != family_name:
            user.last_name = family_name
            changed = True
        if changed:
            user.save()

        # 4) Emitir JWT propios (SimpleJWT) y agregar role como en tu serializer
        refresh = RefreshToken.for_user(user)

        if user.is_superuser:
            role = "admin"
        elif user.is_staff:
            role = "tecnico"
        else:
            role = "cliente"

        refresh["role"] = role
        access = refresh.access_token
        access["role"] = role

        return Response(
            {"access": str(access), "refresh": str(refresh)},
            status=status.HTTP_200_OK,
        )