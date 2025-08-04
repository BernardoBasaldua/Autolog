from rest_framework import serializers
from .models import Vehiculo, Marca, Modelo
from ordenes.serializers import OrdenDeTrabajoSerializer

class ModeloSerializer (serializers.ModelSerializer):
    class Meta:
        model = Modelo
        fields = '__all__'

class VehiculoSerializer(serializers.ModelSerializer):

    modelo_id = serializers.PrimaryKeyRelatedField(
    queryset=Modelo.objects.all(),
    source='modelo',
    write_only=True
    )

    marca = serializers.SerializerMethodField()
    modelo = ModeloSerializer(read_only=True) 
    fecha_prox_servicio = serializers.DateField(read_only=True)
    kilometraje_prox_servicio = serializers.IntegerField(read_only=True)
    historial = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Vehiculo
        fields = '__all__'
        #read_only_fields = ['propietario']
        
    def get_marca(self, obj):
        return MarcaSerializer(obj.marca).data
    
    def get_historial(self, obj):
        historial = obj.historial
        return OrdenDeTrabajoSerializer(historial, many=True).data

class MarcaSerializer (serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = '__all__'