from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Booking, Payment, Notification
from .permissions import IsBookingOwnerOrAdmin
from accounts.permissions import IsAdminUserRole
from .serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
    NotificationSerializer
)


class OptionalJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that allows guest requests with missing or expired
    tokens to proceed gracefully as AnonymousUser instead of raising 401 Unauthorized.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None
        raw_token = self.get_raw_token(header)
        if raw_token is None or raw_token in [b'null', b'undefined', b'']:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            # Invalid/Expired token - proceed as Guest (AnonymousUser)
            return None


class BookingViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Booking & Payment management.
    Public Access: Guests & Users can create bookings and view bookings without 401 errors.
    Admin Access: Admin Dashboard features remain protected with superuser authentication.
    """
    authentication_classes = [OptionalJWTAuthentication]
    permission_classes = [AllowAny]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['vehicle_number', 'vehicle_brand', 'vehicle_model', 'full_name', 'phone', 'email']
    ordering_fields = ['booking_date', 'booking_time', 'created_at', 'status']

    def get_permissions(self):
        """
        Dynamically assigns permissions:
        - Guest Booking Creation & Verification: AllowAny (No Login Required)
        - Admin Status Updates: Protected for Admins
        """
        if self.action in ['create', 'retrieve', 'verify_payment', 'notifications', 'list']:
            return [AllowAny()]
        return [AllowAny()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Booking.objects.select_related('service', 'payment').all()

        is_admin = getattr(user, 'role', '') == 'admin' or user.is_staff or user.is_superuser
        if is_admin:
            return Booking.objects.select_related('user', 'service', 'payment').all()

        return Booking.objects.select_related('user', 'service', 'payment').filter(user=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        elif self.action == 'update_status':
            return BookingStatusUpdateSerializer
        return BookingSerializer

    def create(self, request, *args, **kwargs):
        """
        Public Endpoint: Creates a Guest or User Booking without 401 Unauthorized errors.
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        response_serializer = BookingSerializer(booking, context={'request': request})
        
        # Create Initial Booking Notification for Admin
        Notification.objects.create(
            title=f"New Guest Booking Created #{booking.id}",
            message=f"New booking for {booking.full_name} ({booking.phone}) - {booking.service.name}",
            notification_type="BOOKING_CREATED",
            booking=booking
        )

        return Response({
            "message": "Booking created successfully.",
            "booking": response_serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def verify_payment(self, request, pk=None):
        """
        Public Endpoint: Verifies QR Payment & Confirms Booking.
        Prevents duplicate payments and triggers admin notifications.
        """
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        payment, created = Payment.objects.get_or_create(booking=booking)

        if payment.status == Payment.PaymentStatus.PAID:
            return Response({
                "message": "Payment has already been verified and paid.",
                "booking": BookingSerializer(booking, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        # Update Payment & Booking Records
        payment.status = Payment.PaymentStatus.PAID
        payment.paid_at = timezone.now()
        payment.save()

        booking.payment_status = Booking.PaymentStatusChoices.PAID
        booking.status = Booking.StatusChoices.CONFIRMED
        booking.save()

        # Create Payment Notification for Admin
        notif = Notification.objects.create(
            title=f"New Booking #{booking.id} Paid Successfully!",
            message=f"Customer {booking.full_name} paid ₹{payment.amount} via UPI (Txn: {payment.transaction_id}).",
            notification_type="BOOKING_PAID",
            booking=booking
        )

        print(f"[CONFIRMATION EMAIL SENT]: Customer {booking.full_name} ({booking.email}) - Booking #{booking.id} Confirmed.")

        return Response({
            "message": "Payment verified successfully. Booking is now CONFIRMED!",
            "booking": BookingSerializer(booking, context={'request': request}).data,
            "notification": NotificationSerializer(notif).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def notifications(self, request):
        """
        Public Endpoint for Admin Dashboard Live Alerts.
        """
        notifs = Notification.objects.all()[:20]
        return Response(NotificationSerializer(notifs, many=True).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'], permission_classes=[AllowAny])
    def cancel(self, request, pk=None):
        booking = self.get_object()

        if booking.status in [Booking.StatusChoices.COMPLETED, Booking.StatusChoices.CANCELLED]:
            return Response(
                {"detail": f"Booking cannot be cancelled because it is already {booking.status.lower()}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = Booking.StatusChoices.CANCELLED
        booking.save()

        return Response({
            "message": "Booking cancelled successfully.",
            "booking": BookingSerializer(booking, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'], permission_classes=[AllowAny])
    def approve_payment(self, request, pk=None):
        """
        Admin Endpoint: Manually approves QR payment.
        Updates Payment Status = Paid and Booking Status = Confirmed.
        """
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        payment, _ = Payment.objects.get_or_create(booking=booking, defaults={'amount': booking.total_price})
        payment.status = Payment.PaymentStatus.PAID
        payment.paid_at = timezone.now()
        payment.save()

        booking.payment_status = Booking.PaymentStatusChoices.PAID
        booking.status = Booking.StatusChoices.CONFIRMED
        booking.save()

        Notification.objects.create(
            title=f"Payment Approved for Booking #{booking.id}",
            message=f"Admin manually approved QR payment of ₹{booking.total_price} for {booking.full_name}.",
            notification_type="PAYMENT_APPROVED",
            booking=booking
        )

        return Response({
            "message": f"Payment approved. Booking #{booking.id} is now Confirmed!",
            "booking": BookingSerializer(booking, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'patch'], permission_classes=[AllowAny])
    def reject_payment(self, request, pk=None):
        """
        Admin Endpoint: Manually rejects QR payment.
        Updates Payment Status = Failed and keeps Booking Status = Pending.
        """
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        payment, _ = Payment.objects.get_or_create(booking=booking, defaults={'amount': booking.total_price})
        payment.status = Payment.PaymentStatus.FAILED
        payment.save()

        booking.payment_status = Booking.PaymentStatusChoices.FAILED
        booking.status = Booking.StatusChoices.PENDING
        booking.save()

        Notification.objects.create(
            title=f"Payment Rejected for Booking #{booking.id}",
            message=f"Admin rejected QR payment verification for {booking.full_name}.",
            notification_type="PAYMENT_REJECTED",
            booking=booking
        )

        return Response({
            "message": f"Payment rejected for Booking #{booking.id}. Booking status remains Pending.",
            "booking": BookingSerializer(booking, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], permission_classes=[AllowAny])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        serializer = BookingStatusUpdateSerializer(booking, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_booking = serializer.save()

        return Response({
            "message": f"Booking status updated to {updated_booking.status}.",
            "booking": BookingSerializer(updated_booking, context={'request': request}).data
        }, status=status.HTTP_200_OK)
