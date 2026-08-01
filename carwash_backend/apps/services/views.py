from rest_framework import viewsets, filters
from .models import Service
from .serializers import ServiceSerializer
from accounts.permissions import IsAdminOrReadOnly


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Services module.
    Admin: Manage Services (Create, Update, Delete)
    Users/Public: View Services (Read-only access)
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'duration', 'name', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        # Show active services only for non-admin requests unless specified
        is_admin = (
            self.request.user and
            self.request.user.is_authenticated and
            (getattr(self.request.user, 'role', '') == 'admin' or self.request.user.is_staff or self.request.user.is_superuser)
        )
        if not is_admin:
            queryset = queryset.filter(is_active=True)
        return queryset
