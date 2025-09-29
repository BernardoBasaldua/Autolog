from rest_framework.routers import DefaultRouter

from .views import OrdenDeTrabajoViewSet

router = DefaultRouter()
router.register("ordenes", OrdenDeTrabajoViewSet)

urlpatterns = router.urls
