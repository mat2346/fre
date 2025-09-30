from rest_framework import routers
from django.urls import path, include
from .views import CanvasViewSet, generate_diagram_ai

router = routers.DefaultRouter()
router.register(r'', CanvasViewSet, basename='canvas')

urlpatterns = [
    path('ai/generate-diagram/', generate_diagram_ai, name='generate_diagram_ai'),
    path('', include(router.urls)),
]
