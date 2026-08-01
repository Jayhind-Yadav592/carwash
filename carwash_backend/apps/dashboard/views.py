from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from services.models import Service
from bookings.models import Booking
from reviews.models import Review
from accounts.permissions import IsAdminUserRole

User = get_user_model()


class DashboardOverviewView(APIView):
    """
    Admin dashboard overview API.
    Admin only permissions.
    """
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        total_users = User.objects.count()
        total_services = Service.objects.count()
        total_bookings = Booking.objects.count()
        total_reviews = Review.objects.count()

        pending_bookings = Booking.objects.filter(status=Booking.StatusChoices.PENDING).count()
        confirmed_bookings = Booking.objects.filter(status=Booking.StatusChoices.CONFIRMED).count()
        completed_bookings = Booking.objects.filter(status=Booking.StatusChoices.COMPLETED).count()
        cancelled_bookings = Booking.objects.filter(status=Booking.StatusChoices.CANCELLED).count()

        return Response({
            "total_users": total_users,
            "total_services": total_services,
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "confirmed_bookings": confirmed_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_reviews": total_reviews,
        })
