from rest_framework import serializers
from .models.taller import Taller

class TallerSerializer(serializers.ModelSerializer):
    
    horarioAtencion = serializers.SerializerMethodField()#VER DESPUES
    
    class Meta:
        model = Taller
        fields = '__all__'  # o explícitamente: ['id', 'nombre', 'descripcion', 'telefono', 'direccion']

    def get_horarioAtencion(self, obj):
         # VER DESPUES
         return ["08:00", "17:00", "12:00"]