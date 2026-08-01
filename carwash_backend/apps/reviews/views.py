from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q

from .models import Review
from .permissions import IsReviewOwnerOrAdmin
from accounts.permissions import IsAdminUserRole
from .serializers import (
    ReviewSerializer,
    ReviewCreateUpdateSerializer,
    ReviewApproveSerializer
)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Customer Reviews module.
    Users:
    - Add Review (POST)
    - Edit Own Review (PUT/PATCH)
    - Delete Own Review (DELETE)
    - View Approved Reviews (GET)

    Admin:
    - View All Reviews (GET)
    - Approve Reviews (PATCH approve)
    - Delete Reviews (DELETE)
    """
    permission_classes = [IsReviewOwnerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['review', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['rating', 'created_at']

    def get_queryset(self):
        user = self.request.user
        is_admin = user and user.is_authenticated and (getattr(user, 'role', '') == 'admin' or user.is_staff or user.is_superuser)

        if is_admin:
            return Review.objects.select_related('user').all()

        if user and user.is_authenticated:
            # Users see approved reviews + their own pending reviews
            return Review.objects.select_related('user').filter(Q(approved=True) | Q(user=user))

        # Public visitors see only approved reviews
        return Review.objects.select_related('user').filter(approved=True)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ReviewCreateUpdateSerializer
        elif self.action == 'approve':
            return ReviewApproveSerializer
        return ReviewSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        response_serializer = ReviewSerializer(review, context={'request': request})
        return Response({
            "message": "Review submitted successfully! It will be visible once approved by an admin.",
            "review": response_serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdminUserRole])
    def approve(self, request, pk=None):
        """
        Admin Endpoint: Approve or unapprove a customer review.
        """
        review = self.get_object()
        serializer = ReviewApproveSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_review = serializer.save()

        return Response({
            "message": f"Review approval status updated to {updated_review.approved}.",
            "review": ReviewSerializer(updated_review, context={'request': request}).data
        }, status=status.HTTP_200_OK)
