from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'full_name', 'subscription']
    fieldsets = UserAdmin.fieldsets + (
        ('Información adicional', {'fields': ('full_name', 'subscription')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información adicional', {'fields': ('full_name', 'subscription')}),
    )
