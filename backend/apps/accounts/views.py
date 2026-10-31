from apps.core.services import log_audit
from django.contrib.auth import get_user_model, login, logout
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StaffProfile, StaffRole
from .permissions import IsAdminUserRole
from .serializers import (
    LoginSerializer,
    StaffCreateUpdateSerializer,
    StaffUserSerializer,
)

User = get_user_model()


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)

        log_audit(user, "STAFF_LOGIN", "User", user.id)

        user_data = StaffUserSerializer(user).data
        return Response(
            {
                "token": token.key,
                "user": user_data,
            }
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response({"message": "خروج موفقیت‌آمیز بود."})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(StaffUserSerializer(request.user).data)


class StaffListCreateView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        users = User.objects.filter(is_staff=True) | User.objects.filter(
            staff_profile__isnull=False
        )
        users = users.distinct().order_by("-date_joined")
        return Response(StaffUserSerializer(users, many=True).data)

    def post(self, request):
        serializer = StaffCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            user = User.objects.create_user(
                username=data["username"],
                password=data.get("password") or "TempPass123!",
                email=data.get("email", ""),
                is_staff=True,
                is_active=data.get("is_active", True),
            )
            role = data.get("role", StaffRole.STAFF_SCANNER)
            if role == StaffRole.SUPER_ADMIN and request.user.is_superuser:
                user.is_superuser = True
                user.save(update_fields=["is_superuser"])

            StaffProfile.objects.create(
                user=user, role=role, display_name=data.get("display_name", "")
            )

            log_audit(
                request.user,
                "CREATE_STAFF_MEMBER",
                "User",
                user.id,
                {"username": user.username, "role": role},
            )

        return Response(StaffUserSerializer(user).data, status=status.HTTP_201_CREATED)


class StaffDetailUpdateView(APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "کاربر یافت نشد."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = StaffCreateUpdateSerializer(
            data=request.data, partial=True, context={"instance": user}
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            if "username" in data:
                user.username = data["username"]
            if "email" in data:
                user.email = data["email"]
            if "is_active" in data:
                user.is_active = data["is_active"]
            if data.get("password"):
                user.set_password(data["password"])
            user.save()

            profile, _ = StaffProfile.objects.get_or_create(user=user)
            if "display_name" in data:
                profile.display_name = data["display_name"]
            if "role" in data:
                # Only super admin can grant super admin role
                if (
                    data["role"] == StaffRole.SUPER_ADMIN
                    and not request.user.is_superuser
                ):
                    return Response(
                        {"error": "تنها مدیر ارشد می‌تواند نقش مدیر ارشد اعطا کند."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                profile.role = data["role"]
            profile.save()

            log_audit(request.user, "UPDATE_STAFF_MEMBER", "User", user.id, data)

        return Response(StaffUserSerializer(user).data)
