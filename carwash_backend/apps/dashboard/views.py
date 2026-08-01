from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum
from django.utils import timezone
from django.contrib.auth import get_user_model
from services.models import Service
from bookings.models import Booking, Payment
from reviews.models import Review

User = get_user_model()


class DashboardOverviewView(APIView):
    """
    Admin dashboard overview API returning real PostgreSQL stats.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()

        total_users = User.objects.count()
        total_services = Service.objects.count()
        total_bookings = Booking.objects.count()
        total_reviews = Review.objects.count()

        pending_bookings = Booking.objects.filter(status=Booking.StatusChoices.PENDING).count()
        confirmed_bookings = Booking.objects.filter(status=Booking.StatusChoices.CONFIRMED).count()
        completed_bookings = Booking.objects.filter(status=Booking.StatusChoices.COMPLETED).count()
        cancelled_bookings = Booking.objects.filter(status=Booking.StatusChoices.CANCELLED).count()

        today_bookings = Booking.objects.filter(booking_date=today).count()
        upcoming_bookings = Booking.objects.filter(booking_date__gt=today).count()

        # Revenue calculations from Payments or Paid Bookings
        paid_payments = Payment.objects.filter(status=Payment.PaymentStatus.PAID)
        total_revenue_val = paid_payments.aggregate(total=Sum('amount'))['total'] or 0
        
        today_payments = paid_payments.filter(paid_at__date=today)
        today_revenue_val = today_payments.aggregate(total=Sum('amount'))['total'] or 0

        # Fallback if Payments table empty but Bookings are PAID
        if total_revenue_val == 0:
            paid_bookings = Booking.objects.filter(payment_status=Booking.PaymentStatusChoices.PAID)
            total_revenue_val = paid_bookings.aggregate(total=Sum('total_price'))['total'] or 0
            today_revenue_val = paid_bookings.filter(created_at__date=today).aggregate(total=Sum('total_price'))['total'] or 0

        return Response({
            "total_users": total_users,
            "total_services": total_services,
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "confirmed_bookings": confirmed_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_reviews": total_reviews,
            "today_bookings": today_bookings,
            "upcoming_bookings": upcoming_bookings,
            "total_revenue": float(total_revenue_val),
            "today_revenue": float(today_revenue_val),
            "totalUsers": total_users,
            "totalServices": total_services,
            "totalBookings": total_bookings,
            "pendingBookings": pending_bookings,
            "confirmedBookings": confirmed_bookings,
            "completedBookings": completed_bookings,
            "cancelledBookings": cancelled_bookings,
            "totalReviews": total_reviews,
            "todayRevenue": float(today_revenue_val),
            "totalRevenue": float(total_revenue_val)
        })
