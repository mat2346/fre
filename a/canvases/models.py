from django.db import models
from django.conf import settings
import uuid


def generate_join_code():
    return uuid.uuid4().hex[:12]


class Canvas(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='canvases'
    )
    name = models.CharField(max_length=200)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True) 
    updated_at = models.DateTimeField(auto_now=True)
    join_code = models.CharField(max_length=12, unique=True, default=generate_join_code)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.owner})"
