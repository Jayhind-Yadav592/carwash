from django.urls import path
from .views import (
    ContactSubmitView,
    ContactMessageListView,
    ContactMessageDetailView
)

urlpatterns = [
    # Public Endpoint
    path('submit/', ContactSubmitView.as_view(), name='contact-submit'),

    # Admin Endpoints
    path('messages/', ContactMessageListView.as_view(), name='contact-messages-list'),
    path('messages/<int:pk>/', ContactMessageDetailView.as_view(), name='contact-messages-detail'),
]
