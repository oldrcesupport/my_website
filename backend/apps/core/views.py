from apps.accounts.permissions import IsAdminUserRole
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection, DatabaseError
from django.http import JsonResponse

from .models import AuditLog, RestaurantSettings
from .serializers import (
    AdminRestaurantSettingsSerializer,
    AuditLogSerializer,
    PublicRestaurantSettingsSerializer,
)
from .services import log_audit


def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        return JsonResponse({"status": "unavailable"}, status=503)
    return JsonResponse({"status": "ok"})


class PublicSettingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj = RestaurantSettings.get_settings()
        serializer = PublicRestaurantSettingsSerializer(settings_obj)
        return Response(serializer.data)


class AdminSettingsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        settings_obj = RestaurantSettings.get_settings()
        serializer = AdminRestaurantSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def patch(self, request):
        settings_obj = RestaurantSettings.get_settings()
        data = request.data.copy()

        # Only super admin can change pricing or demo mode flag
        if (
            "ticket_price_toman" in data or "is_demo_price" in data
        ) and not request.user.is_superuser:
            profile = getattr(request.user, "staff_profile", None)
            if not (profile and profile.is_super_admin):
                return Response(
                    {"error": "تغییر نرخ بلیت تنها توسط مدیر ارشد امکان‌پذیر است."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = AdminRestaurantSettingsSerializer(
            settings_obj, data=data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        log_audit(
            request.user, "UPDATE_RESTAURANT_SETTINGS", "RestaurantSettings", "1", data
        )
        return Response(serializer.data)


class AdminAuditLogListView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        logs = AuditLog.objects.select_related("actor").all()[:100]
        return Response(AuditLogSerializer(logs, many=True).data)
