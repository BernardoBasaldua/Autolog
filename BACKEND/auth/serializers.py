# auth/serializers.py
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
