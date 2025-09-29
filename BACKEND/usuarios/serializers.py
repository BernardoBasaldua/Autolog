# users/serializers.py
from rest_framework import serializers

from talleres.models.taller import Taller
from vehiculos.serializers import VehiculoSerializer

from .models import AdministradorTecnico, Cliente, PermisoDeAcceso, Usuario


class UsuarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Usuario
        fields = [
            "pk",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "dni",
            "telefono",
            "direccion",
        ]

        extra_kwargs = {
            "password": {"write_only": True}  # La contraseña no debe ser visible al pedir datos
        }

    def create(self, validated_data):
        # Este método se asegura de que la contraseña se guarde de forma segura (hasheada)
        password = validated_data.pop("password", None)
        instance = self.Meta.model(**validated_data)
        if (
            password is not None
        ):  # si permitimos que sea None despues no vamos a poder usar authenticate(), VERR MAS ADELANTE
            instance.set_password(password)  # este metodo heredado de abstractuser hace el hash
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermisoDeAcceso
        fields = ["vehiculo_autorizado", "cliente_autorizado", "taller_autorizado"]


class ClienteSerializer(serializers.ModelSerializer):

    # usuario_id = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all(), write_only=True)
    usuario = UsuarioSerializer()
    mis_vehiculos = VehiculoSerializer(many=True, read_only=True)
    permisos_que_otorgo = PermisoSerializer(many=True, read_only=True)
    # vehiculo_autorizado = VehiculoSerializer(many=True)
    # usuarios_autorizados = serializers.SerializerMethodField()
    # talleres_autorizados = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ["usuario", "permisos_que_otorgo", "mis_vehiculos"]

    def create(self, validated_date):
        usuario_data = validated_date.pop("usuario")
        usuario = Usuario.objects.create_user(**usuario_data)
        cliente = Cliente.objects.create(usuario=usuario, **validated_date)
        return cliente


class AdministradorTecnicoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()
    taller = serializers.PrimaryKeyRelatedField(queryset=Taller.objects.all())

    class Meta:
        model = AdministradorTecnico
        fields = ["id", "usuario", "taller"]

    # Tu serializer tiene usuario = UsuarioSerializer(), pero por defecto Django REST Framework no crea automáticamente el usuario interno cuando hacés un POST, a menos que vos sobreescribas el método create.
    def create(self, validated_data):
        usuario_data = validated_data.pop("usuario")  # saca los datos del usuario
        usuario = Usuario.objects.create_user(
            **usuario_data
        )  # crea el usuario con password hasheada
        tecnico = AdministradorTecnico.objects.create(
            usuario=usuario, **validated_data
        )  # Crea el AdministradorTecnico, relacionándolo con ese usuario y con el taller extraído.
        return tecnico

    def update(self, instance, validated_data):
        usuario_data = validated_data.pop("usuario", None)
        taller = validated_data.get("taller")
        # actualizar usuario si se mandaron datos nuevos
        if usuario_data:
            for attr, value in usuario_data.items():
                if attr == "password":
                    instance.usuario.set_password(value)
                else:
                    setattr(instance.usuario, attr, value)
            instance.usuario.save()
        # actualizar taller si fue modificado
        if taller:
            instance.taller = taller
            instance.save()
        return instance
