# usuarios/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdministradorTecnicoViewSet, UsuarioViewSet, clienteViewSet

# Creamos un router y registramos nuestro viewset
router = DefaultRouter()
router.register(r"usuarios", UsuarioViewSet)
router.register(r"tecnicos", AdministradorTecnicoViewSet, basename="tecnicos")
router.register(r"clientes", clienteViewSet)

# router.register(r'ordenes', OrdenDeTrabajoViewSet)
# router.register(r'vehiculos', VehiculoViewSet)

# Las URLs de la API son determinadas automáticamente por el router
urlpatterns = [
    path("", include(router.urls)),
]

# | Método   | URL                                                                  |
# | -------- | -------------------------------------------------------------------- |
# | `GET`    | `/api/administradores-tecnicos/`                                     |
# | `POST`   | `/api/administradores-tecnicos/`                                     |
# | `GET`    | `/api/administradores-tecnicos/{id}/`                                |
# | `PATCH`  | `/api/administradores-tecnicos/{id}/`                                |
# | `DELETE` | `/api/administradores-tecnicos/{id}/`                                |
# | `GET`    | `/api/administradores-tecnicos/{id}/ordenes/`                        |
# | `POST`   | `/api/administradores-tecnicos/{id}/crear_orden/`                    |
# | `PATCH`  | `/api/administradores-tecnicos/{id}/ordenes/{orden_id}/`             |
# | `DELETE` | `/api/administradores-tecnicos/{id}/ordenes/{orden_id}/`             |
# | `POST`   | `/api/administradores-tecnicos/{id}/crear_cliente/`                  |
# | `POST`   | `/api/administradores-tecnicos/{id}/crear_vehiculo/` *(si lo tenés)* |
