from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """
    Admin management layout for Customer Reviews.
    """
    list_display = ('id', 'user', 'rating', 'approved', 'created_at')
    list_filter = ('approved', 'rating', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'review')
    list_editable = ('approved',)
    ordering = ('-created_at',)
