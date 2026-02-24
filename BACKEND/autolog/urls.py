"""URL configuration for autolog project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/

Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))

"""

from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from auth.views import MyTokenObtainPairView,GoogleLoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Agrego la ruta de la API de usuarios
    path("api/", include("usuarios.urls")),
    path("api/", include("ordenes.urls")),
    path("api/", include("vehiculos.urls")),
    path("api/", include("talleres.urls")),
    path("api/", include("agendas.urls")),
    # JWT
    path("api/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    #AUTH GOOGLE
    path("api/auth/google/", GoogleLoginView.as_view(), name="google_login"),
]
