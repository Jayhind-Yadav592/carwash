import urllib.parse
from django.conf import settings
from rest_framework import serializers
from .models import Booking, Payment, Notification
from services.models import Service
from services.serializers import ServiceSerializer
from accounts.serializers import UserSerializer


class PaymentSerializer(serializers.ModelSerializer):
    merchant_upi_id = serializers.SerializerMethodField()
    merchant_name = serializers.SerializerMethodField()
    upi_deep_link = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = (
            'id',
            'transaction_id',
            'amount',
            'payment_method',
            'status',
            'upi_id',
            'merchant_upi_id',
            'merchant_name',
            'upi_deep_link',
            'upi_qr_url',
            'paid_at',
            'created_at'
        )

    def get_merchant_upi_id(self, obj):
        return getattr(settings, 'MERCHANT_UPI_ID', '').strip()

    def get_merchant_name(self, obj):
        return getattr(settings, 'MERCHANT_BUSINESS_NAME', '').strip()

    def get_upi_deep_link(self, obj):
        upi_id = self.get_merchant_upi_id(obj)
        merchant_name = self.get_merchant_name(obj)
        try:
            amount = float(obj.amount or (obj.booking.total_price if obj.booking else 0))
        except (ValueError, TypeError):
            amount = 0.0

        booking_id = obj.booking.id if (obj.booking and obj.booking.id) else None

        # Validate amount > 0 and configuration environment variables
        if not upi_id or not merchant_name or amount <= 0 or not booking_id:
            return None

        encoded_name = urllib.parse.quote(merchant_name)
        return f"upi://pay?pa={upi_id}&pn={encoded_name}&am={amount:.2f}&cu=INR&tn=Booking-{booking_id}"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id',
            'title',
            'message',
            'notification_type',
            'booking',
            'is_read',
            'created_at'
        )


class BookingSerializer(serializers.ModelSerializer):
    """
    Detailed Serializer for displaying Bookings.
    """
    user = UserSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    merchant_upi_id = serializers.SerializerMethodField()
    merchant_name = serializers.SerializerMethodField()
    upi_deep_link = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id',
            'user',
            'service',
            'full_name',
            'phone',
            'email',
            'vehicle_type',
            'vehicle_brand',
            'vehicle_model',
            'vehicle_number',
            'address',
            'booking_date',
            'booking_time',
            'notes',
            'total_price',
            'status',
            'payment_status',
            'transaction_id',
            'payment',
            'merchant_upi_id',
            'merchant_name',
            'upi_deep_link',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'status', 'payment_status', 'created_at', 'updated_at')

    def get_merchant_upi_id(self, obj):
        return getattr(settings, 'MERCHANT_UPI_ID', '').strip()

    def get_merchant_name(self, obj):
        return getattr(settings, 'MERCHANT_BUSINESS_NAME', '').strip()

    def get_upi_deep_link(self, obj):
        upi_id = self.get_merchant_upi_id(obj)
        merchant_name = self.get_merchant_name(obj)
        try:
            amount = float(obj.total_price or (obj.service.price if obj.service else 0))
        except (ValueError, TypeError):
            amount = 0.0

        if not upi_id or not merchant_name or amount <= 0 or not obj.id:
            return None

        encoded_name = urllib.parse.quote(merchant_name)
        return f"upi://pay?pa={upi_id}&pn={encoded_name}&am={amount:.2f}&cu=INR&tn=Booking-{obj.id}"


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Robust Serializer for creating Guest & User Bookings.
    Validates total_price > 0 and creates linked Payment.
    """
    service_id = serializers.CharField(required=False, write_only=True)
    full_name = serializers.CharField(required=False, default='Customer')
    phone = serializers.CharField(required=False, default='')
    email = serializers.CharField(required=False, default='')

    class Meta:
        model = Booking
        fields = (
            'id',
            'service_id',
            'full_name',
            'phone',
            'email',
            'vehicle_type',
            'vehicle_brand',
            'vehicle_model',
            'vehicle_number',
            'address',
            'booking_date',
            'booking_time',
            'notes',
            'total_price'
        )

    def validate_total_price(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Booking total price must be greater than zero.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if (request and request.user and request.user.is_authenticated) else None

        # Resolve Service instance dynamically
        raw_service_id = validated_data.pop('service_id', None)
        service_instance = None

        if raw_service_id:
            try:
                service_id_num = int(raw_service_id)
                service_instance = Service.objects.filter(pk=service_id_num).first()
            except (ValueError, TypeError):
                service_instance = Service.objects.filter(name__icontains=str(raw_service_id)).first()

        if not service_instance:
            service_instance = Service.objects.first()
            if not service_instance:
                service_instance = Service.objects.create(
                    name='Doorstep Express Wash',
                    description='High pressure foam wash and interior vacuum',
                    price=500.00,
                    duration=60
                )

        validated_data['service'] = service_instance
        validated_data['user'] = user
        validated_data['status'] = Booking.StatusChoices.PENDING
        validated_data['payment_status'] = Booking.PaymentStatusChoices.PENDING

        booking = super().create(validated_data)

        # Ensure valid positive total price
        amount = booking.total_price or service_instance.price or 500.00
        if amount <= 0:
            amount = 500.00
        booking.total_price = amount

        # Generate unique transaction ID
        txn_id = f"TXN-UPI-{booking.id}{int(booking.created_at.timestamp()) % 100000}"
        booking.transaction_id = txn_id
        booking.save()

        # Dynamic Merchant UPI Details from Settings
        upi_id = getattr(settings, 'MERCHANT_UPI_ID', 'rudracarwash@upi')
        merchant_name = getattr(settings, 'MERCHANT_BUSINESS_NAME', 'Rudra Doorstep Express')
        encoded_name = urllib.parse.quote(merchant_name)

        qr_data = f"upi://pay?pa={upi_id}&pn={encoded_name}&am={amount:.2f}&cu=INR&tn=Booking-{booking.id}"
        qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={urllib.parse.quote(qr_data)}"

        # Create Payment Record
        Payment.objects.create(
            booking=booking,
            transaction_id=txn_id,
            amount=amount,
            payment_method=Payment.PaymentMethod.UPI_QR,
            status=Payment.PaymentStatus.PENDING,
            upi_id=upi_id,
            upi_qr_url=qr_code_url
        )

        return booking


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ('status', 'payment_status')
