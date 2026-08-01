from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Admin management layout for Bookings.
    """
    list_display = (
        'id',
        'user',
        'service',
        'vehicle_type',
        'vehicle_brand',
        'vehicle_number',
        'booking_date',
        'booking_time',
        'status',
        'created_at'
    )
    list_filter = ('status', 'booking_date', 'vehicle_type', 'created_at')
    search_fields = (
        'user__email',
        'user__first_name',
        'user__last_name',
        'vehicle_number',
        'vehicle_brand',
        'vehicle_model',
        'address'
    )
    list_editable = ('status',)
    ordering = ('-booking_date', '-booking_time')

    fieldsets = (
        ('Booking Info', {'fields': ('user', 'service', 'status')}),
        ('Vehicle Details', {'fields': ('vehicle_type', 'vehicle_brand', 'vehicle_model', 'vehicle_number')}),
        ('Schedule & Location', {'fields': ('booking_date', 'booking_time', 'address', 'notes')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

    readonly_fields = ('created_at', 'updated_at')
