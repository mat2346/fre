from django.contrib import admin
from .models import Canvas

@admin.register(Canvas)
class CanvasAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'created_at', 'updated_at']
    search_fields = ['name', 'owner__username']
    list_filter = ['created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
