from rest_framework import serializers
from .models import Review
from accounts.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed Review display.
    """
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = (
            'id',
            'user',
            'rating',
            'review',
            'approved',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'approved', 'created_at', 'updated_at')


class ReviewCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Reviews.
    """
    class Meta:
        model = Review
        fields = ('id', 'rating', 'review')

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        validated_data['approved'] = False  # Pending admin approval
        return super().create(validated_data)


class ReviewApproveSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin review approval.
    """
    class Meta:
        model = Review
        fields = ('approved',)
