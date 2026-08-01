from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate, login as django_login, logout as django_logout

from .permissions import IsAdminUserRole, IsUserRole
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    LogoutSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Public Endpoint: Registers a new user and returns JWT tokens upon success.
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("Registration Serializer Errors:", serializer.errors)
            return Response(
                {
                    "message": "Registration failed due to validation errors.",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()

        # Generate JWT tokens for immediate login post-registration
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data

        return Response({
            "message": "User registered successfully.",
            "user": user_data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Public Endpoint: Authenticates user with Email/Username and Password, returning JWT tokens.
    Automatically identifies Superuser / Admin accounts.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            print("Login Serializer Errors:", serializer.errors)
            return Response(
                {
                    "message": "Invalid email or password.",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data['user']
        django_login(request, user)
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data

        # Explicitly tag Superuser / Staff / Admin role
        is_admin_flag = user.is_superuser or user.is_staff or getattr(user, 'role', '') == 'admin'
        user_data['is_superuser'] = user.is_superuser
        user_data['is_staff'] = user.is_staff
        if is_admin_flag:
            user_data['role'] = 'admin'

        return Response({
            "message": "Login successful.",
            "user": user_data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class AdminLoginView(APIView):
    """
    Dedicated Admin Login Endpoint.
    Only allows Superusers (created via python manage.py createsuperuser)
    or accounts with is_superuser=True / role='admin' / is_staff=True.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {
                    "message": "Invalid email or password.",
                    "errors": {"detail": ["Invalid email or password."]}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request=request, username=email, password=password)

        if not user:
            return Response(
                {
                    "message": "Invalid email or password.",
                    "errors": {"detail": ["Invalid email or password."]}
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.is_active:
            return Response(
                {
                    "message": "User account is disabled.",
                    "errors": {"detail": ["User account is disabled."]}
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # REQUIRE SUPERUSER OR ADMIN PRIVILEGES
        is_admin_user = user.is_superuser or user.is_staff or getattr(user, 'role', '') == 'admin'
        if not is_admin_user:
            return Response(
                {
                    "message": "Access Denied. Admin privileges required.",
                    "errors": {"detail": ["Access Denied. Admin privileges required."]}
                },
                status=status.HTTP_403_FORBIDDEN
            )

        django_login(request, user)
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user, context={'request': request}).data
        user_data['is_superuser'] = user.is_superuser
        user_data['is_staff'] = user.is_staff
        user_data['role'] = 'admin'

        return Response({
            "message": "Admin login successful.",
            "user": user_data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Authenticated Endpoint: Blacklists JWT refresh token and terminates Django session.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
        django_logout(request)
        return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveAPIView):
    """
    Authenticated Endpoint: Returns current user's profile details.
    """
    permission_classes = [IsUserRole]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    """
    Authenticated Endpoint: Updates current user's profile details & avatar.
    """
    permission_classes = [IsUserRole]
    serializer_class = UpdateProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()

        return Response({
            "message": "Profile updated successfully.",
            "user": UserSerializer(updated_user, context={'request': request}).data
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """
    Authenticated Endpoint: Changes current user's password after verifying old password.
    """
    permission_classes = [IsUserRole]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": ["Incorrect current password."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin Endpoint: Manage all users (List, Retrieve, Update, Delete).
    Admin permissions required.
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]
