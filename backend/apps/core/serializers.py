from apps.business_time.services import BusinessTimeService
from rest_framework import serializers
from django.conf import settings

from .models import AuditLog, RestaurantSettings


class PublicRestaurantSettingsSerializer(serializers.ModelSerializer):
    currency_label = serializers.SerializerMethodField()
    current_business_date = serializers.SerializerMethodField()
    sales_cutoff_active = serializers.SerializerMethodField()
    checkout_remaining_seconds = serializers.SerializerMethodField()
    ticket_price_toman = serializers.SerializerMethodField()
    sales_enabled = serializers.SerializerMethodField()
    business_timezone = serializers.SerializerMethodField()

    class Meta:
        model = RestaurantSettings
        fields = [
            "restaurant_name",
            "tagline",
            "description",
            "address",
            "phone",
            "currency_unit",
            "currency_label",
            "ticket_price_toman",
            "is_demo_price",
            "sales_enabled",
            "business_timezone",
            "business_day_cutoff",
            "current_business_date",
            "sales_cutoff_active",
            "checkout_remaining_seconds",
            "capacity_enabled",
            "capacity_policy",
        ]

    def get_currency_label(self, obj) -> str:
        return "تومان"

    def get_business_timezone(self, obj):
        return "Asia/Tehran"

    def get_ticket_price_toman(self, obj):
        if obj.ticket_price_toman <= 0 or (settings.APP_ENV == "production" and obj.is_demo_price):
            return None
        return obj.ticket_price_toman

    def get_sales_enabled(self, obj):
        return obj.sales_enabled and self.get_ticket_price_toman(obj) is not None

    def get_current_business_date(self, obj) -> str:
        biz_date = BusinessTimeService.get_business_date(settings_obj=obj)
        return str(biz_date)

    def get_sales_cutoff_active(self, obj) -> bool:
        if not self.get_sales_enabled(obj):
            return False
        allowed, _, _ = BusinessTimeService.is_checkout_allowed(settings_obj=obj)
        return not allowed

    def get_checkout_remaining_seconds(self, obj) -> int:
        _, _, seconds = BusinessTimeService.is_checkout_allowed(settings_obj=obj)
        return seconds


class AdminRestaurantSettingsSerializer(serializers.ModelSerializer):
    def validate_business_timezone(self, value):
        if value != "Asia/Tehran":
            raise serializers.ValidationError("منطقه زمانی باید Asia/Tehran باشد.")
        return value

    def validate_currency_unit(self, value):
        if value != "TOMAN":
            raise serializers.ValidationError("واحد پول باید تومان باشد.")
        return value

    def validate_capacity_enabled(self, value):
        if value:
            raise serializers.ValidationError("کنترل ظرفیت هنوز پشتیبانی نمی‌شود.")
        return value

    def validate_ticket_price_toman(self, value):
        if value <= 0:
            raise serializers.ValidationError("قیمت باید بزرگ‌تر از صفر باشد.")
        return value

    class Meta:
        model = RestaurantSettings
        fields = "__all__"


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(
        source="actor.username", read_only=True, default="System"
    )

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor_username",
            "action",
            "target_model",
            "target_id",
            "metadata",
            "created_at",
        ]
