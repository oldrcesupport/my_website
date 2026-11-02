from rest_framework import permissions


class IsStaffScannerUser(permissions.BasePermission):
    """
    Grants access to users who are authenticated staff members permitted to scan tickets
    (Check-in Staff, Administrators, and Super Administrators).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, "staff_profile", None)
        if profile and profile.can_scan:
            return True
        return False


class IsAdminUserRole(permissions.BasePermission):
    """
    Grants access to Administrators and Super Administrators.
    Check-in staff cannot access these endpoints.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, "staff_profile", None)
        if profile and profile.is_admin:
            return True
        return False


class IsSuperAdminUser(permissions.BasePermission):
    """
    Grants access exclusively to Super Administrators.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, "staff_profile", None)
        if profile and profile.is_super_admin:
            return True
        return False
