from django.db import models
from django.conf import settings
from services.models import Service


class Booking(models.Model):
    """
    Car Wash Appointment Booking Model.
    """
    class StatusChoices(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        CONFIRMED = 'Confirmed', 'Confirmed'
        IN_PROGRESS = 'In Progress', 'In Progress'
        COMPLETED = 'Completed', 'Completed'
        CANCELLED = 'Cancelled', 'Cancelled'

    class PaymentStatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings',
        null=True,
        blank=True
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.PROTECT,
        related_name='bookings'
    )
    full_name = models.CharField(max_length=150, default='Customer')
    phone = models.CharField(max_length=20, default='')
    email = models.CharField(max_length=150, default='')

    vehicle_type = models.CharField(max_length=50, default='Sedan')
    vehicle_brand = models.CharField(max_length=50, default='Brand')
    vehicle_model = models.CharField(max_length=50, default='Model')
    vehicle_number = models.CharField(max_length=30)

    address = models.TextField()
    booking_date = models.DateField()
    booking_time = models.TimeField()
    notes = models.TextField(blank=True, null=True)

    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)

    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatusChoices.choices,
        default=PaymentStatusChoices.PENDING
    )
    transaction_id = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-booking_date', '-booking_time']
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"

    def __str__(self):
        return f"Booking #{self.id} - {self.full_name} ({self.phone}) - {self.service.name} [{self.payment_status}]"


class Payment(models.Model):
    """
    Payment Transaction Model linked to Booking.
    """
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'

    class PaymentMethod(models.TextChoices):
        UPI_QR = 'UPI_QR', 'UPI QR Code'
        CASH = 'CASH', 'Cash on Delivery'
        CARD = 'CARD', 'Credit / Debit Card'

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='payment'
    )
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.UPI_QR
    )
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    upi_id = models.CharField(max_length=100, default='rudracarwash@upi')
    upi_qr_url = models.TextField(blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.transaction_id} - ₹{self.amount} ({self.status})"


class Notification(models.Model):
    """
    System Notification Model for Customer & Admin alerts.
    """
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='BOOKING_PAID')
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title}"
