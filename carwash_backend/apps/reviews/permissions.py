from rest_framework import permissions


class IsReviewOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission for Reviews:
    - GET (List/Retrieve): Public access to approved reviews; users can also see their own pending reviews; Admins can see all.
    - POST (Create): Authenticated users can submit reviews.
    - PUT/PATCH/DELETE: Review owners can edit/delete their own reviews; Admins can delete any review.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            is_admin = getattr(request.user, 'role', '') == 'admin' or request.user.is_staff or request.user.is_superuser
            return obj.approved or (request.user and (request.user == obj.user or is_admin))

        if not request.user or not request.user.is_authenticated:
            return False

        is_admin = getattr(request.user, 'role', '') == 'admin' or request.user.is_staff or request.user.is_superuser
        is_owner = obj.user == request.user

        if is_admin:
            return True

        if is_owner:
            # Users can edit or delete their own review
            if view.action in ['update', 'partial_update', 'destroy']:
                return True

        return False
