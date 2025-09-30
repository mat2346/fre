from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from .models import Canvas
from .serializers import CanvasSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import action
from rest_framework.response import Response

# Create your views here.

class CanvasViewSet(viewsets.ModelViewSet):
    serializer_class = CanvasSerializer
    # Permitir lecturas públicas (GET) pero proteger escrituras
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Canvas.objects.filter(owner=self.request.user) if self.request.user and self.request.user.is_authenticated else Canvas.objects.none()

    @swagger_auto_schema(
        operation_description="Listar (cargar) todos los canvases del usuario autenticado",
        responses={200: CanvasSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='cargar', permission_classes=[permissions.AllowAny])
    def cargar(self, request, *args, **kwargs):
        # Si el usuario no está autenticado devolvemos lista vacía en este punto para evitar 401 frecuentes en desarrollo
        if not request.user or not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)
        return self.list(request, *args, **kwargs)

    @swagger_auto_schema(
        request_body=CanvasSerializer,
        responses={201: CanvasSerializer},
        operation_description="Crear (crear) un nuevo canvas. El campo `data` debe ser un JSON con la estructura del diagrama."
    )
    @action(detail=False, methods=['post'], url_path='crear', permission_classes=[permissions.IsAuthenticated])
    def crear(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    @swagger_auto_schema(
        methods=['put', 'patch'],
        request_body=CanvasSerializer,
        responses={200: CanvasSerializer},
        operation_description="Guardar (guardar) cambios en un canvas existente. Usa PUT o PATCH en /{id}/guardar/"
    )
    @action(detail=True, methods=['put', 'patch'], url_path='guardar', permission_classes=[permissions.IsAuthenticated])
    def guardar(self, request, pk=None, *args, **kwargs):
        # Reutilizar update del ViewSet para mantener validaciones
        if request.method == 'PUT':
            return self.update(request, *args, **kwargs)
        else:
            return self.partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        responses={200: CanvasSerializer},
        operation_description="Obtener detalle de un canvas (cargar detalle)."
    )
    @action(detail=True, methods=['get'], url_path='detalle', permission_classes=[permissions.IsAuthenticated])
    def detalle(self, request, pk=None, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='join')
    def join_by_code(self, request):
        code = request.query_params.get('code')
        canvas = Canvas.objects.filter(join_code=code).first()
        if canvas:
            serializer = self.get_serializer(canvas)
            return Response(serializer.data)
        return Response({'detail': 'No encontrado'}, status=404)

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
