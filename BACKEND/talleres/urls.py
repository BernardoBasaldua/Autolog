from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .api import TallerViewSet

router = DefaultRouter()
router.register(r"talleres", TallerViewSet)

urlpatterns = [path("", include(router.urls))]
