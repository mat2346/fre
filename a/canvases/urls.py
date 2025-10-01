from rest_framework import routers
from django.urls import path, include
from .views import CanvasViewSet, generate_diagram_ai, generate_crud_panel_ai

router = routers.DefaultRouter()
router.register(r'', CanvasViewSet, basename='canvas')

urlpatterns = [
    path('ai/generate-diagram/', generate_diagram_ai, name='generate_diagram_ai'),
    path('ai/generate-crud-panel/', generate_crud_panel_ai, name='generate_crud_panel_ai'),
    path('', include(router.urls)),
]
