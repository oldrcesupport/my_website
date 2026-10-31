from rest_framework import serializers

from .models import Ticket
from .services import TicketService


class TicketPassSerializer(serializers.ModelSerializer):
    effective_status = serializers.SerializerMethodField()
    qr_payload = serializers.SerializerMethodField()
    qr_data_uri = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "public_id",
            "ticket_number",
            "status",
            "effective_status",
            "business_date",
            "valid_from",
            "valid_until",
            "created_at",
            "used_at",
            "qr_payload",
            "qr_data_uri",
        ]

    def get_effective_status(self, obj) -> str:
        return obj.get_effective_status()

    def get_qr_payload(self, obj) -> str:
        return obj.get_qr_payload()

    def get_qr_data_uri(self, obj) -> str:
        return TicketService.render_qr_data_uri(obj.get_qr_payload())


class AdminTicketSerializer(serializers.ModelSerializer):
    order_public_id = serializers.CharField(source="order.public_id", read_only=True)
    purchaser_name = serializers.CharField(
        source="order.purchaser_name", read_only=True
    )
    purchaser_phone = serializers.CharField(
        source="order.purchaser_phone", read_only=True
    )
    effective_status = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "public_id",
            "order_public_id",
            "purchaser_name",
            "purchaser_phone",
            "ticket_number",
            "status",
            "effective_status",
            "business_date",
            "valid_from",
            "valid_until",
            "created_at",
            "used_at",
            "cancelled_at",
        ]

    def get_effective_status(self, obj) -> str:
        return obj.get_effective_status()
