from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    AdminLoginView,
    LogoutView,
    UserProfileView,
    UpdateProfileView,
    ChangePasswordView,
    UserManagementViewSet
)

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='user-management')

urlpatterns = [
    # Authentication Endpoints
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('admin-login/', AdminLoginView.as_view(), name='auth-admin-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Profile Endpoints
    path('profile/', UserProfileView.as_view(), name='auth-profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='auth-profile-update'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),

    # Admin User Management
    path('', include(router.urls)),
]
