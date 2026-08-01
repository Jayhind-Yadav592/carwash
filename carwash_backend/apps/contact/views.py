from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from accounts.permissions import IsAdminUserRole

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactSubmitView(APIView):
    """
    Public Endpoint (APIView): Allows users and website visitors to submit contact forms.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            contact_msg = serializer.save()
            return Response({
                "message": "Thank you! Your contact request has been submitted successfully.",
                "data": ContactMessageSerializer(contact_msg).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactMessageListView(APIView):
    """
    Admin Endpoint (APIView): Allows admins to view all submitted contact messages.
    """
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        messages = ContactMessage.objects.all()
        serializer = ContactMessageSerializer(messages, many=True)
        return Response({
            "count": messages.count(),
            "messages": serializer.data
        }, status=status.HTTP_200_OK)


class ContactMessageDetailView(APIView):
    """
    Admin Endpoint (APIView): Allows admins to retrieve/read and delete specific contact messages.
    """
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get_object(self, pk):
        try:
            return ContactMessage.objects.get(pk=pk)
        except ContactMessage.DoesNotExist:
            return None

    def get(self, request, pk):
        message = self.get_object(pk)
        if not message:
            return Response({"detail": "Contact message not found."}, status=status.HTTP_404_NOT_FOUND)

        # Mark message as read upon opening
        if not message.is_read:
            message.is_read = True
            message.save()

        serializer = ContactMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        message = self.get_object(pk)
        if not message:
            return Response({"detail": "Contact message not found."}, status=status.HTTP_404_NOT_FOUND)

        message.delete()
        return Response({"message": "Contact message deleted successfully."}, status=status.HTTP_200_OK)
