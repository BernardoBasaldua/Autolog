from rest_framework import viewsets

from .models.taller import Taller
from .serializers import TallerSerializer


class TallerViewSet(viewsets.ModelViewSet):
    queryset = Taller.objects.all()
    serializer_class = TallerSerializer
