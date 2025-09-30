from rest_framework import routers
from django.urls import path, include
from .views import CanvasViewSet

router = routers.DefaultRouter()
router.register(r'', CanvasViewSet, basename='canvas')

urlpatterns = [
    path('', include(router.urls)),
]
