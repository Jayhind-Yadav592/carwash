from rest_framework import viewsets
from .models import Gallery
from .serializers import GallerySerializer
from accounts.permissions import IsAdminOrReadOnly


class GalleryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing gallery images.
    Admin: Upload/Delete Images (Create, Update, Delete)
    Users/Public: View Gallery (Read-only access)
    """
    queryset = Gallery.objects.all().order_by('-created_at')
    serializer_class = GallerySerializer
    permission_classes = [IsAdminOrReadOnly]
