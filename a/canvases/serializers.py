from rest_framework import serializers
from .models import Canvas


class CanvasSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    join_code = serializers.ReadOnlyField()

    class Meta:
        model = Canvas
        fields = ['id', 'owner', 'name', 'data', 'created_at', 'updated_at', 'join_code']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at', 'join_code']
