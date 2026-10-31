from rest_framework import serializers

from .models import Order


class CreateOrderSerializer(serializers.Serializer):
    purchaser_name = serializers.CharField(max_length=200, required=True)
    purchaser_phone = serializers.CharField(max_length=32, required=True)
    purchaser_email = serializers.EmailField(
        required=False, allow_blank=True, default=""
    )
    quantity = serializers.IntegerField(min_value=1, max_value=50, default=1)

    def validate_purchaser_phone(self, value):
        cleaned = value.strip().replace(" ", "").replace("-", "")
        persian_digits = "۰۱۲۳۴۵۶۷۸۹"
        arabic_digits = "٠١٢٣٤٥٦٧٨٩"
        for i in range(10):
            cleaned = cleaned.replace(persian_digits[i], str(i)).replace(arabic_digits[i], str(i))
        if len(cleaned) < 10:
            raise serializers.ValidationError("شماره تلفن وارد شده نامعتبر است.")
        return cleaned

    def validate_purchaser_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("نام خریدار باید حداقل ۲ حرف باشد.")
        return cleaned


class OrderStatusSerializer(serializers.ModelSerializer):
    tickets_count = serializers.SerializerMethodField()
    reference_id = serializers.SerializerMethodField()
    ticket_numbers = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "public_id",
            "purchaser_name",
            "purchaser_phone",
            "quantity",
            "unit_price_toman",
            "total_price_toman",
            "currency_unit",
            "business_date",
            "status",
            "created_at",
            "paid_at",
            "payment_deadline",
            "tickets_count",
            "reference_id",
            "ticket_numbers",
        ]

    def get_tickets_count(self, obj) -> int:
        return obj.tickets.count()

    def get_reference_id(self, obj) -> str | None:
        att = obj.payment_attempts.filter(status="VERIFIED").first()
        return att.reference_id if att else None

    def get_ticket_numbers(self, obj) -> list[str]:
        return list(obj.tickets.values_list("ticket_number", flat=True))
