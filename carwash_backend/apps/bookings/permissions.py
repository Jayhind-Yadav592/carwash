from rest_framework import permissions


class IsBookingOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission for Bookings:
    - Users can only view, create, and cancel their own bookings.
    - Admins can view, update status, and delete all bookings.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        is_admin = getattr(request.user, 'role', '') == 'admin' or request.user.is_staff or request.user.is_superuser
        is_owner = obj.user == request.user

        if is_admin:
            return True

        # Non-admin users can view or cancel their own bookings
        if is_owner:
            if view.action in ['retrieve', 'cancel']:
                return True
            if request.method in permissions.SAFE_METHODS:
                return True

        return False
