from rest_framework import serializers

from .models import CheckInRecord


class StaffCheckInRequestSerializer(serializers.Serializer):
    qr_token = serializers.CharField(required=True, allow_blank=False, max_length=500)
    scanner_device_id = serializers.CharField(
        required=False, allow_blank=True, max_length=128, default=""
    )


class CheckInRecordSerializer(serializers.ModelSerializer):
    ticket_number = serializers.CharField(
        source="ticket.ticket_number", read_only=True, default=""
    )
    staff_username = serializers.CharField(
        source="staff_user.username", read_only=True, default="System"
    )

    class Meta:
        model = CheckInRecord
        fields = [
            "id",
            "ticket_number",
            "staff_username",
            "result",
            "scanned_at",
            "scanner_device_id",
            "notes",
        ]
