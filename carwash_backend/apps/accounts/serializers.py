from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed User Profile read operations.
    """
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'role',
            'profile_image',
            'is_verified',
            'is_active',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'email', 'is_verified', 'is_active', 'created_at', 'updated_at')


class RegisterSerializer(serializers.ModelSerializer):
    """
    Production-ready Serializer for User Registration.
    Supports email, first_name, last_name, phone, username, password,
    and password_confirm / confirm_password / password2 alias resolution.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = (
            'email',
            'username',
            'first_name',
            'last_name',
            'phone',
            'password',
            'password_confirm',
            'confirm_password',
            'role'
        )

    def validate_email(self, value):
        norm_email = value.lower().strip()
        if User.objects.filter(email__iexact=norm_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return norm_email

    def to_internal_value(self, data):
        # Flexible payload resolution for frontend & external API clients
        data = data.copy() if hasattr(data, 'copy') else dict(data)

        # Confirm password alias resolution
        if 'confirm_password' in data and not data.get('password_confirm'):
            data['password_confirm'] = data['confirm_password']
        elif 'password2' in data and not data.get('password_confirm'):
            data['password_confirm'] = data['password2']

        # Full name alias resolution
        if ('name' in data or 'full_name' in data) and not data.get('first_name'):
            full_name = (data.get('name') or data.get('full_name') or '').strip()
            parts = full_name.split(' ')
            data['first_name'] = parts[0]
            if len(parts) > 1:
                data['last_name'] = ' '.join(parts[1:])

        return super().to_internal_value(data)

    def validate(self, attrs):
        password = attrs.get('password')
        pwd_confirm = attrs.get('password_confirm') or attrs.get('confirm_password')

        # If confirm password was provided, verify matching
        if pwd_confirm and password != pwd_confirm:
            raise serializers.ValidationError({"password_confirm": "Password fields do not match."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        validated_data.pop('confirm_password', None)
        role = validated_data.get('role', User.RoleChoices.USER)

        email = validated_data['email'].lower().strip()
        username = validated_data.get('username') or email

        user = User.objects.create_user(
            email=email,
            username=username,
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=role
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for Email + Password Authentication.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password')

        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )

            if not user:
                raise serializers.ValidationError(
                    {"detail": "Unable to log in with provided credentials. Please check your email and password."}
                )

            if not user.is_active:
                raise serializers.ValidationError({"detail": "User account is disabled."})

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError({"detail": "Must include both email and password."})


class UpdateProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for User Profile Updates (including profile_image).
    """
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone', 'profile_image')

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone = validated_data.get('phone', instance.phone)

        if 'profile_image' in validated_data:
            instance.profile_image = validated_data.get('profile_image')

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password when authenticated.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "New passwords do not match."})
        return attrs


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for invalidating JWT refresh token on logout.
    """
    refresh = serializers.CharField(required=True)

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            raise serializers.ValidationError({"refresh": "Invalid or expired token."})
