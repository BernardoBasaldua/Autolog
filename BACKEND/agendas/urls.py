from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AgendaViewSet

# El router genera automáticamente las URLs para el ViewSet.
# Incluirá /api/agendas/, /api/agendas/{id}/,
# y nuestras acciones personalizadas.
router = DefaultRouter()
router.register(r"agendas", AgendaViewSet, basename="agenda")

urlpatterns = [
    path("", include(router.urls)),
]
