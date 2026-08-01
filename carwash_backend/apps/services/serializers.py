from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Car Wash Service model.
    """
    class Meta:
        model = Service
        fields = (
            'id',
            'name',
            'description',
            'price',
            'duration',
            'image',
            'is_active',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
