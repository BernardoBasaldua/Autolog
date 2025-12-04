# users/serializers.py
from vehiculos.models.vehiculo import Vehiculo
from rest_framework import serializers

from talleres.models.taller import Taller
from vehiculos.serializers import VehiculoSerializer

from .models import AdministradorTecnico, Cliente, PermisoDeAcceso, Usuario


class UsuarioSerializer(serializers.ModelSerializer):
#El serializer hereda de la clase serializaers.ModelSerializer la cual crea automaticamente campos basados en tu modelo, es decir, los atributos que el serializare va a leer y escribir. Basicamente esto quiere decir que cuando se hace un get, el json va a contener esos campos y ademas cuando se hace un post el serializer espera recibiir esos campos. 
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
# write_only: True para password significa solo se acepta en operaciones de escritura (POST/PUT/PATCH), pero no se incluye en las representaciones de lectura (GET). Evita que la contraseña aparezca en respuestas JSON.
    def create(self, validated_data):
        # Sobrescribe el método create del serializer. Se llama cuando se hace .save() en un serializer.
        # .save() es un método que se llama cuando querés crear o actualizar un objeto de tu modelo a través del serializer.
        # Internamente, .save() hace esto:
        # Llama al método .is_valid()
        # Si los datos son válidos, llama a create() o update()
        # Crea o actualiza el objeto del modelo
        # Guarda ese objeto en la base de datos (.save() del modelo)
        # validated_data es un diccionario con los datos limpios/validados por el serializer. Es decir, es lo que te devuelve el metodo .is_valid()
        # Este método se asegura de que la contraseña se guarde de forma segura (hasheada)
        password = validated_data.pop("password", None)
        # Extrae (y elimina) la clave 'password' de validated_data.
        # pop devuelve el valor si existe, o None si no.
        # Se usa pop porque no queremos pasar la contraseña en texto plano al constructor del modelo (evita que se guarde sin hashear).
        instance = self.Meta.model(**validated_data)
        # Crea una instancia del modelo (Usuario) sin guardar aún en la BD, pasando el resto de campos (username, email, etc.) como argumentos.
        if (
            password is not None
        ):  # si permitimos que sea None despues no vamos a poder usar authenticate(), VERR MAS ADELANTE
            instance.set_password(password)  # este metodo heredado de abstractuser hace el hash
            # Usa el método del modelo (heredado típicamente de AbstractUser) para hashear la contraseña y almacenarla en el campo password de forma segura. No guarda el texto plano.
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


from talleres.serializers import TallerSerializer
class PermisoSerializer(serializers.ModelSerializer):
    vehiculo_autorizado = serializers.PrimaryKeyRelatedField(
        queryset=Vehiculo.objects.all()
    )
    taller_autorizado = serializers.PrimaryKeyRelatedField(
        queryset=Taller.objects.all(),
        required=False,
        allow_null=True
    )
    cliente_autorizado = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        required=False,
        allow_null=True
    )

    autoriza = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all()
    )
    fecha_autorizacion = serializers.DateField(read_only=True)

    class Meta:
        model = PermisoDeAcceso
        fields = [
            "id",
            "fecha_autorizacion",
            "vehiculo_autorizado",
            "cliente_autorizado",
            "taller_autorizado",
            "autoriza",
        ]
        read_only_fields = ["id", "fecha_autorizacion"]

    
class ClienteSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()
    mis_vehiculos = VehiculoSerializer(many=True, read_only=True)  # ya son los propios
    permisos_que_otorgo = PermisoSerializer(many=True, read_only=True)

    vehiculos_externos = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = [
            "id",
            "usuario",
            "mis_vehiculos",        # propios
            "vehiculos_externos",   # externos
            "permisos_que_otorgo",
        ]

    def create(self, validated_data):
        usuario_data = validated_data.pop("usuario")
        usuario = Usuario.objects.create_user(**usuario_data)
        cliente = Cliente.objects.create(usuario=usuario, **validated_data)
        return cliente

    def get_vehiculos_externos(self, obj):
        return VehiculoSerializer(obj.vehiculos_externos_autorizados, many=True).data



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

