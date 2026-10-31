from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from .models import StaffRole

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("نام کاربری یا رمز عبور اشتباه است.")
        if not user.is_active:
            raise serializers.ValidationError("این حساب کاربری غیرفعال است.")

        attrs["user"] = user
        return attrs


class StaffUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    is_super_admin = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    can_scan = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "display_name",
            "role",
            "is_super_admin",
            "is_admin",
            "can_scan",
            "is_active",
            "date_joined",
        ]

    def get_role(self, obj):
        profile = getattr(obj, "staff_profile", None)
        if obj.is_superuser:
            return StaffRole.SUPER_ADMIN
        return profile.role if profile else StaffRole.STAFF_SCANNER

    def get_display_name(self, obj):
        profile = getattr(obj, "staff_profile", None)
        if profile and profile.display_name:
            return profile.display_name
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username

    def get_is_super_admin(self, obj):
        profile = getattr(obj, "staff_profile", None)
        return obj.is_superuser or (profile and profile.is_super_admin)

    def get_is_admin(self, obj):
        profile = getattr(obj, "staff_profile", None)
        return obj.is_superuser or (profile and profile.is_admin)

    def get_can_scan(self, obj):
        profile = getattr(obj, "staff_profile", None)
        return obj.is_superuser or (profile and profile.can_scan) or obj.is_staff


class StaffCreateUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, required=False, write_only=True)
    display_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=StaffRole.choices, default=StaffRole.STAFF_SCANNER
    )
    is_active = serializers.BooleanField(default=True)

    def validate_username(self, value):
        instance = self.context.get("instance")
        qs = User.objects.filter(username=value)
        if instance:
            qs = qs.exclude(id=instance.id)
        if qs.exists():
            raise serializers.ValidationError("این نام کاربری قبلاً انتخاب شده است.")
        return value

    def validate(self, attrs):
        instance = self.context.get("instance")
        password = attrs.get("password")
        if not instance and not password:
            raise serializers.ValidationError(
                {"password": "تعیین رمز عبور برای ساخت پرسنل جدید الزامی است."}
            )
        if password and len(password) < 8:
            raise serializers.ValidationError(
                {"password": "رمز عبور باید حداقل ۸ کاراکتر باشد."}
            )
        return attrs
