from rest_framework import permissions


class IsAdminUserRole(permissions.BasePermission):
    """
    Custom permission to only allow access to admin users.
    Role 'admin', is_staff=True, or is_superuser=True.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, 'role', '') == 'admin' or request.user.is_staff or request.user.is_superuser)
        )


class IsUserRole(permissions.BasePermission):
    """
    Custom permission to allow access to authenticated users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read-only access for everyone,
    but write/delete access only for admin users.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, 'role', '') == 'admin' or request.user.is_staff or request.user.is_superuser)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow owners of an object or admins to access/edit it.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        is_admin = getattr(request.user, 'role', '') == 'admin' or request.user.is_staff or request.user.is_superuser
        is_owner = (obj == request.user) or (getattr(obj, 'user', None) == request.user)

        return is_admin or is_owner
