from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """Usuario personalizado para el proyecto.

    Campos adicionales:
    - full_name: nombre completo opcional
    - subscription: plan de suscripción para uso futuro ('free' por defecto)
    """
    full_name = models.CharField(max_length=255, blank=True)
    subscription = models.CharField(max_length=50, default='free')

    def __str__(self):
        return self.username
