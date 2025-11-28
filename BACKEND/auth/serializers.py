# auth/serializers.py
# Importamos el serializer que usa SimpleJWT para el endpoint /api/token/.
# Ese serializer es el que: valida username y password, y genera el par de tokens: 
# access y refresh.
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Agregamos el rol al payload
        if user.is_superuser:
            token["role"] = "admin"
        elif user.is_staff:
            token["role"] = "tecnico"
        else:
            token["role"] = "cliente"

        return token
